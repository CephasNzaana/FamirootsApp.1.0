// supabase/functions/generate-family-tree/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Using a common recent version
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // For Deno Deploy compatibility if needed

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_TIMEOUT_GRACE_PERIOD_MS = 3000; // Try to respond before runtime kills function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // IMPORTANT: Restrict to your app's domain in production!
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- INTERFACES (Ensure these align with your frontend types/index.ts) ---
interface MemberInputData {
  name?: string;
  gender?: string;
  birthYear?: string;
  deathYear?: string;
  // Add any other relevant fields from your TreeFormData.extendedFamily.XYZ structures
}

interface ParentsInputData {
  father?: MemberInputData;
  mother?: MemberInputData;
}

interface GrandparentsInputData {
  paternal?: {
    grandfather?: MemberInputData;
    grandmother?: MemberInputData;
  };
  maternal?: {
    grandfather?: MemberInputData;
    grandmother?: MemberInputData;
  };
}

interface ExtendedFamilyInputData {
  familyName?: string; // Main person's name from "About You"
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

interface TreeFormData { // Expected structure of the request body from Home.tsx
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
  gender?: 'male' | 'female' | 'other' | string; // Allow string for AI flexibility
  side?: 'paternal' | 'maternal';
  status: 'living' | 'deceased';
  photoUrl?: string;
  notes?: string;
}

// --- FALLBACK DATA ---
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
    const requestBody = await req.json();
    console.log(`[${new Date().toISOString()}] Request body received (first 500 chars):`, JSON.stringify(requestBody).substring(0, 500));
    const formData = requestBody as TreeFormData; // Assume body is TreeFormData

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
      // --- AI PROCESSING ---
      try {
        console.log(`[${new Date().toISOString()}] Preparing data for OpenAI prompt...`);
        const userProvidedDataString = JSON.stringify(extendedFamily, null, 2);

        // !!! --- CRITICAL: THIS PROMPT NEEDS EXTENSIVE TESTING AND REFINEMENT --- !!!
        const prompt = `
          You are an expert Ugandan genealogist tasked with structuring detailed family data into a specific JSON format.
          The family details are: Surname: "${surname}", Tribe: "${tribe}", Clan: "${clan}".
          The main person for this tree (generation 0) is named: "${extendedFamily.familyName}".

          User-provided family structure details:
          \`\`\`json
          ${userProvidedDataString}
          \`\`\`

          Your tasks are to meticulously process ALL individuals mentioned in the user-provided \`extendedFamily\` JSON data and generate a list of \`FamilyMember\` objects.
          For each individual, create a \`FamilyMember\` object with the following fields:
          - \`id\`: Generate a unique, descriptive string ID for each person (e.g., "main_${extendedFamily.familyName.split(' ')[0].toLowerCase()}", "father_of_main", "sibling_1_main"). IDs must be unique within the generated list.
          - \`name\`: The full name. YOU MUST USE THE NAMES EXACTLY AS PROVIDED BY THE USER from the \`extendedFamily\` data. If a name is structurally implied but missing in the user input (e.g., a parent slot is present in the form's structure but the user left the name blank), use a descriptive placeholder like "Father of ${extendedFamily.familyName}" or "Unnamed Paternal Grandmother". Prioritize any user-provided name.
          - \`relationship\`: The relationship term (e.g., "Self", "Father", "Mother", "Paternal Grandfather", "Spouse", "Son", "Daughter", "Sibling", "Clan Elder"). This should be relative to the main person ("${extendedFamily.familyName}") or their direct parent in the hierarchy.
          - \`birthYear\`: String (e.g., "1990"). Use the user-provided birth year. If missing, try to estimate a plausible Ugandan birth year based on context (e.g., parents typically 20-40 years older than their child). If no context, leave as null or undefined.
          - \`deathYear\`: String (e.g., "2020", optional). Use user-provided.
          - \`generation\`: Number. Set strictly: 0 for the main person ("${extendedFamily.familyName}"); -1 for their direct parents; -2 for their direct grandparents; 0 for spouse of main person; 0 for siblings of main person; 1 for children of main person. Elders from \`selectedElders\` might be ancestral (e.g., -2, -3) or as described by their \`approximateEra\`.
          - \`parentId\`: String (optional). The 'id' of this person's primary parent. For the main person, their \`parentId\` would be the 'id' of their father (or mother if father is not listed or a specific linking convention is followed). Siblings should share the same \`parentId\`(s) as the main person. Children's \`parentId\` should be the main person's 'id'. Grandparents usually have no \`parentId\` in this dataset unless their parents are also part of the input.
          - \`isElder\`: Boolean. True if the person is listed in \`extendedFamily.selectedElders\` or if their context (e.g., a great-grandparent role) strongly implies they are a respected elder. Default to false.
          - \`gender\`: String ('male', 'female', 'other'). Use user-provided. Infer from roles like 'father', 'mother', 'grandmother' if not specified.
          - \`side\`: String ('paternal' or 'maternal', optional). Apply accurately for parents and grandparents relative to the main person.
          - \`status\`: String ('living' or 'deceased'). Infer from \`deathYear\`. If \`deathYear\` is present, status is 'deceased'. Otherwise, assume 'living' unless context implies otherwise.
          - \`photoUrl\`: String (optional). Leave as null or undefined for now.
          - \`notes\`: String (optional). Any relevant notes if provided or inferable from context.

          Ensure all individuals from the \`extendedFamily\` structure are represented.
          Output ONLY the valid JSON array of these FamilyMember objects. Do not include any explanations, comments, or markdown formatting outside the JSON array itself.
          The main person, "${extendedFamily.familyName}", MUST be included in the output array with relationship "Self" and generation 0.
        `;
        
        console.log(`[${new Date().toISOString()}] Sending prompt to OpenAI. Prompt length: ${prompt.length}`);
        const openAICallStartTime = Date.now();

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o", // Consider "gpt-3.5-turbo" for faster testing if needed
            messages: [
              { role: "system", content: "You are a highly accurate family tree data structuring assistant for Ugandan families. You will be given detailed family information and must return ONLY a valid JSON array of FamilyMember objects, strictly adhering to the user-provided names and structure. Ensure the main person named in the prompt is included with relationship 'Self' and generation 0." },
              { role: "user", content: prompt }
            ],
            temperature: 0.1, 
            max_tokens: 3800, // Be mindful of token limits vs. input data size
          }),
        });

        const openAICallDuration = Date.now() - openAICallStartTime;
        console.log(`[${new Date().toISOString()}] OpenAI API call finished. Status: ${response.status}, Duration: ${openAICallDuration}ms`);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorData;
          try { errorData = JSON.parse(errorBody); } catch (e) {
            errorData = { error: { message: `OpenAI API Error ${response.status}: ${response.statusText}. Response (first 500 chars): ${errorBody.substring(0, 500)}` } };
          }
          console.error(`[${new Date().toISOString()}] OpenAI API error response:`, errorData);
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponseContent = data.choices?.[0]?.message?.content;

        if (!aiResponseContent) {
          console.error(`[${new Date().toISOString()}] Empty content in AI response from OpenAI.`);
          throw new Error("Empty content in AI response.");
        }

        console.log(`[${new Date().toISOString()}] Raw AI response content received. Length: ${aiResponseContent.length}. Attempting to parse...`);
        // console.log("AI Raw Content Snippet (first 1000 chars):", aiResponseContent.substring(0,1000)); // For heavy debugging

        try {
          members = JSON.parse(aiResponseContent);
        } catch (parseError) {
          console.warn(`[${new Date().toISOString()}] Initial JSON.parse failed. Attempting to extract from markdown block...`);
          const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              members = JSON.parse(jsonMatch[1]);
              console.log(`[${new Date().toISOString()}] Successfully parsed JSON from markdown block.`);
            } catch (nestedParseError) {
              console.error(`[${new Date().toISOString()}] Failed to parse JSON even from markdown block:`, nestedParseError.message);
              console.error("Problematic AI content for markdown extraction (first 500 chars):", aiResponseContent.substring(0,500));
              throw new Error("Could not extract or parse JSON from AI response (tried raw & markdown block).");
            }
          } else {
            console.error(`[${new Date().toISOString()}] AI response was not valid JSON and no JSON block found.`);
            console.error("Problematic AI content (first 500 chars):", aiResponseContent.substring(0,500));
            throw new Error("AI response was not valid JSON and no JSON block found.");
          }
        }
        
        if (!Array.isArray(members)) {
          console.error(`[${new Date().toISOString()}] AI response parsed but is not an array. Received type: ${typeof members}, Value (first 500 chars):`, JSON.stringify(members, null, 2).substring(0, 500));
          throw new Error("AI response format was not an array of family members as expected.");
        }
        
        if (members.length === 0 && extendedFamily.familyName) { 
           console.warn(`[${new Date().toISOString()}] AI returned an empty member list despite receiving familyName. This might be an issue with the prompt or AI understanding for the given input.`);
           // Consider if this should be an error or if an empty tree is acceptable.
        }
        
        console.log(`[${new Date().toISOString()}] AI processing successful. Number of members generated: ${members.length}`);
        // Validate and ensure default values for critical fields from AI members
        members = members.map((member: any, index: number) => ({
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

      } catch (aiError) {
        console.error(`[${new Date().toISOString()}] Error during AI processing stage:`, aiError.message, aiError.stack);
        // Fallback to static data
        members = fallbackMembers.map(m => {
          if (m.relationship === 'Self' && extendedFamily.familyName) {
            return { ...m, name: extendedFamily.familyName, gender: extendedFamily.gender || m.gender, birthYear: extendedFamily.birthYear || m.birthYear };
          }
          return m;
        });
        source = 'fallback';
        console.log(`[${new Date().toISOString()}] Using fallback data due to AI processing error.`);
      }
    }

    const treeId = crypto.randomUUID(); 
    const responsePayload = {
        id: treeId,
        surname,
        tribe,
        clan,
        members: Array.isArray(members) ? members : [], // Ensure members is an array
        createdAt: new Date().toISOString(),
        source,
    };

    const functionEndTime = Date.now();
    const functionDuration = functionEndTime - functionStartTime;
    console.log(`[${new Date(functionEndTime).toISOString()}] Preparing to send response. Function duration: ${functionDuration}ms. Payload members: ${responsePayload.members.length}`);
    
    // Check if approaching timeout, if so, respond quickly
    if (functionDuration > (Deno.env.get("FUNCTION_TIMEOUT_SECONDS") ? parseInt(Deno.env.get("FUNCTION_TIMEOUT_SECONDS") as string) * 1000 : 15000) - FUNCTION_TIMEOUT_GRACE_PERIOD_MS) {
        console.warn(`[${new Date().toISOString()}] Function approaching timeout (${functionDuration}ms). Sending response now.`);
    }

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorTime = Date.now();
    const functionDuration = errorTime - functionStartTime;
    console.error(`[${new Date(errorTime).toISOString()}] Unhandled error in Edge Function after ${functionDuration}ms:`, error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred in the Edge Function." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
