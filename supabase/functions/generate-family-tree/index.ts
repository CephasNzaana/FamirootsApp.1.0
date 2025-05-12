// supabase/functions/generate-family-tree/index.ts
// Deployed Edge Function to process detailed TreeFormData using OpenAI

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Use a recent stable version
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for Deno Deploy

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // IMPORTANT: Restrict to your app's domain in production!
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- INTERFACES (Align with your frontend types/index.ts) ---
interface MemberInputData {
  name?: string;
  gender?: string;
  birthYear?: string;
  deathYear?: string;
  // Add any other fields you collect per individual in your TreeFormData.extendedFamily
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

interface TreeFormData { // Expected structure of the request body
  surname: string;
  tribe: string;
  clan: string;
  extendedFamily: ExtendedFamilyInputData;
}

interface FamilyMember {
  id: string; // Should be generated uniquely for each member
  name: string;
  relationship: string; // e.g., "Self", "Father", "Paternal Grandmother"
  birthYear?: string;
  deathYear?: string;
  generation: number; // 0 for main person, -1 for parents, etc.
  parentId?: string; // ID of one primary parent (e.g., father or mother, convention needed)
  isElder: boolean;
  gender?: 'male' | 'female' | 'other' | string;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // TODO: Consider stronger auth checks if this function isn't just called by authenticated users via client library.
    // For invoke, Supabase client handles auth header, but RLS on target tables is also good.

    const formData: TreeFormData = await req.json();
    const { surname, tribe, clan, extendedFamily } = formData;

    if (!surname || !tribe || !clan || !extendedFamily || !extendedFamily.familyName) {
      return new Response(
        JSON.stringify({ error: 'Missing required data: surname, tribe, clan, and extendedFamily details (especially main person\'s name) are needed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let members: FamilyMember[] = [];
    let source: 'ai' | 'fallback' = 'ai';

    if (!OPENAI_API_KEY) {
      console.warn("OpenAI API key is not configured on the server. Using fallback data.");
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
          - \`id\`: Generate a unique, descriptive string ID for each person (e.g., "main_${extendedFamily.familyName.split(' ')[0]}", "father_of_main", "sibling_1_of_main"). Ensure IDs are unique within the generated list.
          - \`name\`: The full name. YOU MUST USE THE NAMES EXACTLY AS PROVIDED BY THE USER from the \`extendedFamily\` data. If a name is structurally implied but missing in the user input (e.g., a parent slot is present in the form's structure but the user left the name blank), use a placeholder like "Unnamed Father of ${extendedFamily.familyName}" or "Unnamed Sibling". Prioritize any user-provided name.
          - \`relationship\`: The relationship term (e.g., "Self", "Father", "Mother", "Paternal Grandfather", "Spouse", "Son", "Daughter", "Sibling", "Clan Elder"). This should be relative to the main person ("${extendedFamily.familyName}") or their direct parent in the hierarchy.
          - \`birthYear\`: String (e.g., "1990"). Use the user-provided birth year. If missing, try to estimate a plausible Ugandan birth year based on context (e.g., parents typically 20-40 years older than their child). If no context, leave as null or undefined.
          - \`deathYear\`: String (e.g., "2020", optional). Use user-provided.
          - \`generation\`: Number. Set strictly: 0 for the main person ("${extendedFamily.familyName}"); -1 for their direct parents; -2 for their direct grandparents; 0 for spouse of main person; 0 for siblings of main person; 1 for children of main person. Elders from \`selectedElders\` might be ancestral (e.g., -2, -3) or as described.
          - \`parentId\`: String (optional). The 'id' of this person's primary parent. For the main person, their \`parentId\` would be the 'id' of their father (or mother if father is not listed). Siblings should share the same \`parentId\`(s). Children's \`parentId\` should be the main person's 'id'. Grandparents usually have no \`parentId\` in this dataset unless their parents are also part of the input.
          - \`isElder\`: Boolean. True if the person is listed in \`extendedFamily.selectedElders\` or if their context (e.g., a great-grandparent role) strongly implies they are a respected elder. Default to false.
          - \`gender\`: String ('male', 'female', 'other'). Use user-provided. Infer from roles like 'father', 'mother', 'grandmother' if not specified.
          - \`side\`: String ('paternal' or 'maternal', optional). Apply accurately for parents and grandparents relative to the main person.
          - \`status\`: String ('living' or 'deceased'). Infer from \`deathYear\`. If \`deathYear\` is present, status is 'deceased'. Otherwise, assume 'living' unless context implies otherwise.
          - \`photoUrl\`: String (optional). Leave as null or undefined for now.
          - \`notes\`: String (optional). Any relevant notes if provided or inferable.

          Ensure all individuals from the \`extendedFamily\` structure are represented.
          Output ONLY the valid JSON array of these FamilyMember objects. Do not include any explanations, comments, or markdown formatting outside the JSON array itself.
        `;

        console.log("Sending prompt to OpenAI...");
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o", // Or "gpt-3.5-turbo" for testing
            messages: [
              { role: "system", content: "You are a highly accurate family tree data structuring assistant for Ugandan families. You will be given detailed family information and must return ONLY a valid JSON array of FamilyMember objects, strictly adhering to the user-provided names and structure." },
              { role: "user", content: prompt }
            ],
            temperature: 0.1, // Low temperature for more deterministic structuring
            max_tokens: 3800, 
            // response_format: { type: "json_object" }, // Enable if your model version supports it for guaranteed JSON
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          let errorData;
          try { errorData = JSON.parse(errorBody); } catch (e) {
            errorData = { error: { message: `OpenAI API Error ${response.status}: ${response.statusText}. Raw: ${errorBody.substring(0, 200)}` } };
          }
          console.error("OpenAI API error response:", errorData);
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponseContent = data.choices?.[0]?.message?.content;

        if (!aiResponseContent) {
          throw new Error("Empty content in AI response.");
        }

        console.log("Raw AI response content received. Attempting to parse...");
        try {
          members = JSON.parse(aiResponseContent);
        } catch (parseError) {
          console.warn("Initial JSON.parse failed. Attempting to extract from markdown block...");
          const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              members = JSON.parse(jsonMatch[1]);
              console.log("Successfully parsed JSON from markdown block.");
            } catch (nestedParseError) {
              console.error("Failed to parse JSON even from markdown block:", nestedParseError.message);
              console.error("Problematic AI content for markdown extraction (first 500 chars):", aiResponseContent.substring(0,500));
              throw new Error("Could not extract or parse JSON from AI response (tried raw & markdown block).");
            }
          } else {
            console.error("AI response was not valid JSON and no JSON block found.");
            console.error("Problematic AI content (first 500 chars):", aiResponseContent.substring(0,500));
            throw new Error("AI response was not valid JSON and no JSON block found.");
          }
        }
        
        if (!Array.isArray(members)) {
          console.error("AI response was not an array as expected. Received:", typeof members, members);
          throw new Error("AI response format was not an array as expected.");
        }
        if (members.length === 0 && extendedFamily.familyName) { 
           console.warn("AI returned an empty member list despite receiving familyName. This might be an issue with the prompt or AI understanding for the given input.");
        }
        
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
        console.error("Error processing family tree with AI:", aiError.message);
        members = fallbackMembers.map(m => {
          if (m.relationship === 'Self' && extendedFamily.familyName) {
            return { ...m, name: extendedFamily.familyName, gender: extendedFamily.gender || m.gender, birthYear: extendedFamily.birthYear || m.birthYear };
          }
          return m;
        });
        source = 'fallback';
      }
    }

    const treeId = crypto.randomUUID(); 

    return new Response(
      JSON.stringify({
        id: treeId, // This is the ID for the 'family_trees' table entry
        // userId should be set by the client when inserting into DB based on authenticated user
        surname,
        tribe,
        clan,
        members, // The array of FamilyMember objects
        createdAt: new Date().toISOString(), // Can also be set by DB default
        source, // 'ai' or 'fallback'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unhandled error in Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred in the Edge Function." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
