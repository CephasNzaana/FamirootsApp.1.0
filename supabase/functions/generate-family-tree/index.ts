// supabase/functions/generate-family-tree/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_TIMEOUT_GRACE_PERIOD_MS = 3000; 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MemberInputData {
  name?: string;
  gender?: string;
  birthYear?: string;
  deathYear?: string;
}
interface ParentsInputData {
  father?: MemberInputData;
  mother?: MemberInputData;
}
interface GrandparentsInputData {
  paternal?: { grandfather?: MemberInputData; grandmother?: MemberInputData; };
  maternal?: { grandfather?: MemberInputData; grandmother?: MemberInputData; };
}
interface ExtendedFamilyInputData {
  familyName?: string; 
  gender?: string;
  birthYear?: string;
  birthPlace?: string;
  siblings?: MemberInputData[];
  spouse?: MemberInputData;
  parents?: ParentsInputData;
  grandparents?: GrandparentsInputData;
  children?: MemberInputData[];
  selectedElders?: { id: string; name: string; approximateEra?: string }[];
}
interface TreeFormData { 
  surname: string;
  tribe: string;
  clan: string;
  extendedFamily: ExtendedFamilyInputData;
}
interface FamilyMember {
  id: string; 
  name: string;
  relationship: string; 
  birthYear?: string;
  deathYear?: string;
  generation: number; 
  parentId?: string; 
  isElder: boolean;
  gender?: 'male' | 'female' | 'other' | string;
  side?: 'paternal' | 'maternal';
  status: 'living' | 'deceased';
  photoUrl?: string;
  notes?: string;
}

const fallbackMembers: FamilyMember[] = [
  { id: "fb_self_1", name: "Fallback User", relationship: "Self", birthYear: "1990", generation: 0, isElder: false, status: "living", gender: "male" },
  { id: "fb_father_1", name: "Fallback Father", relationship: "Father", birthYear: "1960", generation: -1, parentId: "fb_p_gf_1", isElder: false, status: "living", gender: "male", side: "paternal" },
  { id: "fb_mother_1", name: "Fallback Mother", relationship: "Mother", birthYear: "1965", generation: -1, parentId: "fb_m_gf_1", isElder: false, status: "living", gender: "female", side: "maternal" },
  { id: "fb_p_gf_1", name: "Fallback Paternal GF", relationship: "Paternal Grandfather", birthYear: "1930", generation: -2, isElder: true, status: "deceased", gender: "male", side: "paternal" },
  { id: "fb_m_gf_1", name: "Fallback Maternal GF", relationship: "Maternal Grandfather", birthYear: "1935", generation: -2, isElder: true, status: "deceased", gender: "male", side: "maternal" },
];

serve(async (req: Request) => {
  const functionStartTime = Date.now();
  console.log(`[${new Date(functionStartTime).toISOString()}] Function invoked. Method: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] Handling OPTIONS request.`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: TreeFormData = await req.json();
    console.log(`[${new Date().toISOString()}] Request body received (surname: ${formData.surname}, tribe: ${formData.tribe}, clan: ${formData.clan})`);
    
    const { surname, tribe, clan, extendedFamily } = formData;

    if (!surname || !tribe || !clan || !extendedFamily || !extendedFamily.familyName) {
      console.error(`[${new Date().toISOString()}] Missing required data in request.`);
      return new Response(
        JSON.stringify({ error: 'Missing required detailed form data (surname, tribe, clan, and extendedFamily details including main person\'s name) are needed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let members: FamilyMember[] = [];
    let source: 'ai' | 'fallback' = 'ai';

    if (!OPENAI_API_KEY) {
      console.warn(`[${new Date().toISOString()}] OPENAI_API_KEY is not configured. Using fallback data.`);
      members = fallbackMembers.map(m => {
        if (m.relationship === 'Self' && extendedFamily.familyName) {
          return { ...m, name: extendedFamily.familyName, gender: extendedFamily.gender || m.gender, birthYear: extendedFamily.birthYear || m.birthYear };
        }
        return m;
      });
      source = 'fallback';
    } else {
      try {
        const userProvidedDataString = JSON.stringify(extendedFamily, null, 2);
        // !!! --- THIS PROMPT IS A TEMPLATE - REFINE IT EXTENSIVELY --- !!!
        const prompt = `
          You are an expert Ugandan genealogist tasked with structuring detailed family data into a specific JSON format.
          Family details: Surname: "${surname}", Tribe: "${tribe}", Clan: "${clan}".
          Main person (generation 0): "${extendedFamily.familyName}".

          User-provided family structure:
          \`\`\`json
          ${userProvidedDataString}
          \`\`\`

          Your tasks:
          1. Process ALL individuals mentioned in the user-provided \`extendedFamily\` data.
          2. For each, create a \`FamilyMember\` object:
              - \`id\`: Generate a unique string ID (e.g., "main_${extendedFamily.familyName?.split(' ')[0].toLowerCase()}", "father_of_main"). IDs MUST be unique.
              - \`name\`: Use NAMES EXACTLY AS PROVIDED BY USER. If a name is structurally implied but missing (e.g., unnamed parent), use a placeholder like "Unnamed Father of ${extendedFamily.familyName}". User-provided names take precedence.
              - \`relationship\`: Relationship term (e.g., "Self", "Father", "Paternal Grandfather") relative to main person or direct parent.
              - \`birthYear\`: String. Use provided. If missing, estimate plausible Ugandan birth year OR leave null.
              - \`deathYear\`: String (optional). Use provided.
              - \`generation\`: Number. Main person ("${extendedFamily.familyName}") is 0. Parents -1, Grandparents -2. Spouse 0. Siblings 0. Children 1.
              - \`parentId\`: String (optional). 'id' of primary parent. Link main person to parents, siblings to same parents, children to main person/spouse. Grandparents often no parentId here.
              - \`isElder\`: Boolean. True if from \`selectedElders\` or context implies (e.g., great-grandparent). Default false.
              - \`gender\`: String ('male', 'female', 'other'). Use provided. Infer from roles if possible.
              - \`side\`: String ('paternal' or 'maternal', optional) for parents/grandparents of main person.
              - \`status\`: String ('living' or 'deceased'). Infer from \`deathYear\`. Default 'living'.
              - \`photoUrl\`: String (optional). Leave null.
              - \`notes\`: String (optional).
          3. Ensure "${extendedFamily.familyName}" is included with relationship "Self", generation 0.
          Output ONLY the valid JSON array of FamilyMember objects. No explanations or markdown.
        `;
        
        console.log(`[${new Date().toISOString()}] Sending prompt to OpenAI (length: ${prompt.length}). First 200 chars: ${prompt.substring(0,200)}`);
        const openAICallStartTime = Date.now();

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are a family tree data structuring assistant. Output only valid JSON arrays of FamilyMember objects, ensuring all user-provided names are used and the main person is included with relationship 'Self' and generation 0." },
              { role: "user", content: prompt }
            ],
            temperature: 0.1, 
            max_tokens: 3800,
          }),
        });

        const openAICallDuration = Date.now() - openAICallStartTime;
        console.log(`[${new Date().toISOString()}] OpenAI API call finished. Status: ${response.status}, Duration: ${openAICallDuration}ms`);

        if (!response.ok) { /* ... (error handling as in previous response) ... */ }
        const data = await response.json();
        const aiResponseContent = data.choices?.[0]?.message?.content;
        if (!aiResponseContent) { /* ... (error handling as in previous response) ... */ }
        
        console.log(`[${new Date().toISOString()}] Raw AI response content received (length: ${aiResponseContent.length}). Attempting to parse...`);
        try { members = JSON.parse(aiResponseContent); } 
        catch (parseError) { /* ... (robust JSON parsing as in previous response) ... */ }
        
        if (!Array.isArray(members)) { /* ... (error handling as in previous response) ... */ }
        if (members.length === 0 && extendedFamily.familyName) { /* ... (warning as in previous response) ... */ }
        
        console.log(`[${new Date().toISOString()}] AI processing successful. Members generated: ${members.length}`);
        members = members.map((member: any, index: number) => ({ /* ... (validation and default setting as in previous response) ... */
            id: String(member.id || `ai_member_${Date.now()}_${index}`),
            name: String(member.name || "Unnamed by AI"),
            relationship: String(member.relationship || "Relative"),
            birthYear: member.birthYear ? String(member.birthYear) : undefined,
            deathYear: member.deathYear ? String(member.deathYear) : undefined,
            generation: (typeof member.generation === 'number' && !isNaN(member.generation)) ? member.generation : 0,
            parentId: member.parentId ? String(member.parentId) : undefined,
            isElder: Boolean(member.isElder || false),
            gender: member.gender ? String(member.gender) : undefined,
            side: member.side ? String(member.side) as 'paternal' | 'maternal' : undefined,
            status: member.deathYear ? 'deceased' : (String(member.status || 'living') as 'living' | 'deceased'),
            photoUrl: member.photoUrl ? String(member.photoUrl) : undefined,
            notes: member.notes ? String(member.notes) : undefined,
        }));

      } catch (aiError) { /* ... (fallback logic as in previous response) ... */ }
    }

    const treeId = crypto.randomUUID(); 
    const responsePayload = {
        id: treeId, surname, tribe, clan, members: Array.isArray(members) ? members : [], 
        createdAt: new Date().toISOString(), source,
    };

    const functionEndTime = Date.now();
    const functionDuration = functionEndTime - functionStartTime;
    console.log(`[${new Date(functionEndTime).toISOString()}] Preparing to send response. Duration: ${functionDuration}ms. Payload members: ${responsePayload.members.length}`);
    
    if (functionDuration > (Deno.env.get("FUNCTION_TIMEOUT_SECONDS") ? parseInt(Deno.env.get("FUNCTION_TIMEOUT_SECONDS") as string) * 1000 : 15000) - FUNCTION_TIMEOUT_GRACE_PERIOD_MS) {
        console.warn(`[${new Date().toISOString()}] Function approaching timeout (${functionDuration}ms).`);
    }

    return new Response(JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) { /* ... (outer error handling as in previous response) ... */ }
});
