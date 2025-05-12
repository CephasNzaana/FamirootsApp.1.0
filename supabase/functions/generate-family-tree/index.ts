// supabase/functions/generate-family-tree/index.ts
// Ensure OPENAI_API_KEY is set in your Edge Function's environment variables.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Restrict in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interfaces matching your frontend types/index.ts (ensure these are accurate)
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
  familyName?: string; // Main person's name
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

const fallbackMembers: FamilyMember[] = [ /* Your fallback data */ ];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const formData: TreeFormData = await req.json();
    const { surname, tribe, clan, extendedFamily } = formData;

    if (!surname || !tribe || !clan || !extendedFamily || !extendedFamily.familyName) {
      return new Response(JSON.stringify({ error: 'Missing required detailed form data.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let members: FamilyMember[] = [];
    let source: 'ai' | 'fallback' = 'ai';

    if (!OPENAI_API_KEY) {
      console.warn("OpenAI API key missing. Using fallback.");
      members = fallbackMembers.map(m => m.relationship === 'Self' ? { ...m, name: `${extendedFamily.familyName || surname}` } : m); // Adjust fallback name
      source = 'fallback';
    } else {
      try {
        const userProvidedDataString = JSON.stringify(extendedFamily, null, 2);
        const prompt = `
          You are an expert Ugandan genealogist structuring family data.
          Family: Surname: ${surname}, Tribe: ${tribe}, Clan: ${clan}.
          User data:
          \`\`\`json
          ${userProvidedDataString}
          \`\`\`
          Tasks:
          1. Process user data into \`FamilyMember\` objects: \`id\` (unique, e.g., "person_1"), \`name\` (use provided, placeholder if missing), \`relationship\` (to main person or parent), \`birthYear\`, \`deathYear\`, \`generation\` (0 for ${extendedFamily.familyName}, -1 parents, etc.), \`parentId\` (link to parent's 'id'), \`isElder\`, \`gender\`, \`side\`, \`status\`, \`photoUrl\` (empty), \`notes\`.
          2. Include all individuals from \`extendedFamily\`. Siblings share parents. Children have main person/spouse as parent.
          3. \`selectedElders\` are part of lineage or notable figures.
          Output ONLY the valid JSON array of FamilyMember objects. No explanations.
          Example FamilyMember: {"id": "person_1", "name": "John Doe", "relationship": "Father", "birthYear": "1960", "generation": -1, "parentId": "grandparent_1", "isElder": false, "gender": "male", "side": "paternal", "status": "living"}
        `; // This prompt is conceptual and needs significant refinement and testing.

        const response = await fetch("https://api.openai.com/v1/chat/completions", { /* ... OpenAI call config ... */ 
            method: "POST",
            headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gpt-4o", messages: [
                    { role: "system", content: "Output only valid JSON arrays of FamilyMember objects." },
                    { role: "user", content: prompt }
                ], temperature: 0.3, max_tokens: 3500,
            }),
        });

        if (!response.ok) { /* ... error handling ... */ throw new Error(`OpenAI API error: ${response.statusText}`);}
        const data = await response.json();
        const aiResponseContent = data.choices?.[0]?.message?.content;
        if (!aiResponseContent) throw new Error("Empty content in AI response.");
        
        try { members = JSON.parse(aiResponseContent); }
        catch (parseError) {
            const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) try { members = JSON.parse(jsonMatch[1]); }
            catch (e) { throw new Error("Could not parse JSON from AI response (tried raw & markdown block)."); }
            else throw new Error("AI response not valid JSON and no JSON block found.");
        }
        
        if (!Array.isArray(members) || (members.length === 0 && Object.keys(extendedFamily).length > 0 )) {
           throw new Error("Invalid or empty member array from AI for provided data.");
        }
        members = members.map((member: any, index: number) => ({ /* ... validation and default setting for AI members ... */ 
            id: member.id || `ai_member_${Date.now()}_${index}`,
            name: member.name || "Unnamed by AI",
            relationship: member.relationship || "Relative",
            birthYear: member.birthYear || undefined, deathYear: member.deathYear || undefined,
            generation: (typeof member.generation === 'number') ? member.generation : 0,
            parentId: member.parentId || undefined, isElder: member.isElder || false,
            gender: member.gender || undefined, side: member.side as any || undefined,
            status: member.deathYear ? 'deceased' : (member.status || 'living'),
            photoUrl: member.photoUrl || undefined, notes: member.notes || undefined,
        }));
      } catch (aiError) { /* ... fallback logic ... */ 
          console.error("Error processing with AI:", aiError.message);
          members = fallbackMembers.map(m => m.relationship === 'Self' ? { ...m, name: `${extendedFamily.familyName || surname}` } : m);
          source = 'fallback';
      }
    }
    const treeId = crypto.randomUUID();
    return new Response(JSON.stringify({ id: treeId, surname, tribe, clan, members, createdAt: new Date().toISOString(), source }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) { /* ... error handling ... */ 
      return new Response(JSON.stringify({ error: error.message || "Unexpected error." }),
        { status: 500,
