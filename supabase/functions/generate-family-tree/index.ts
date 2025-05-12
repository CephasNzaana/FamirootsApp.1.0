// supabase/functions/generate-family-tree/index.ts
// Ensure you have OPENAI_API_KEY in your Edge Function's environment variables.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // For Deno Deploy compatibility

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Consider restricting this in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// These interfaces should match your frontend types/index.ts
interface MemberInputData { // Represents individuals within extendedFamily
  name?: string;
  gender?: string;
  birthYear?: string;
  deathYear?: string;
  // Add any other fields you collect per person in the form
}

interface ParentsInputData {
  father?: MemberInputData;
  mother?: MemberInputData;
}

interface GrandparentsInputData {
  paternal?: ParentsInputData; // Grandfather, Grandmother
  maternal?: ParentsInputData; // Grandfather, Grandmother
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

interface TreeFormData { // Matches the input this function now expects
  surname: string;
  tribe: string;
  clan: string;
  extendedFamily: ExtendedFamilyInputData; // Now expecting the detailed structure
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
  gender?: 'male' | 'female' | 'other' | string; // Allow string for flexibility from AI
  side?: 'paternal' | 'maternal';
  status: 'living' | 'deceased';
  photoUrl?: string; // If you want AI to suggest or if it's part of TreeFormData
  notes?: string;
}

// Fallback data (can be simplified if AI is the primary source)
const fallbackMembers: FamilyMember[] = [
  // ... (your existing fallback members, maybe adjust one name based on surname if needed)
  { id: "fb-self", name: "Fallback User", relationship: "Self", generation: 0, isElder: false, status: "living", gender: "male" },
  { id: "fb-father", name: "Fallback Father", relationship: "Father", generation: -1, isElder: false, status: "living", gender: "male", parentId: undefined /* link to fallback grandparent if desired */ },
];


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // TODO: Implement proper user authentication check here if this function should be protected
    // const authHeader = req.headers.get('Authorization');
    // if (!authHeader) { /* ... return 401 ... */ }
    // Verify JWT, check against Supabase auth, etc.

    const formData: TreeFormData = await req.json();
    const { surname, tribe, clan, extendedFamily } = formData;

    if (!surname || !tribe || !clan || !extendedFamily || !extendedFamily.familyName) {
      return new Response(
        JSON.stringify({ error: 'Missing required detailed form data (surname, tribe, clan, extendedFamily with familyName).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let members: FamilyMember[] = [];
    let source: 'ai' | 'fallback' = 'ai';

    if (!OPENAI_API_KEY) {
      console.warn("OpenAI API key is not configured. Using fallback data.");
      members = fallbackMembers.map(m => m.relationship === 'Self' ? { ...m, name: `${extendedFamily.familyName || surname}` } : m);
      source = 'fallback';
    } else {
      try {
        // **CRITICAL: Construct a detailed prompt for OpenAI**
        // This prompt needs to guide the AI to take your `extendedFamily` object
        // and structure it into the `FamilyMember[]` array.
        // This is a complex prompt engineering task.
        const userProvidedDataString = JSON.stringify(extendedFamily, null, 2);

        const prompt = `
          You are an expert Ugandan genealogist tasked with structuring provided family data.
          The family details are: Surname: ${surname}, Tribe: ${tribe}, Clan: ${clan}.
          User-provided data (prioritize this):
          \`\`\`json
          ${userProvidedDataString}
          \`\`\`

          Your tasks:
          1.  Process the user-provided data to create a list of individuals.
          2.  For each individual, generate a \`FamilyMember\` object with the following fields:
              - \`id\`: A unique string ID (e.g., "person_1", "person_2").
              - \`name\`: The full name. Use the names provided by the user. If a name is missing for a crucial role (e.g. a parent is mentioned but unnamed), use a placeholder like "Father of [MainPersonName]" or the role itself, but strongly prefer user-provided names.
              - \`relationship\`: Relationship to the main person (\`${extendedFamily.familyName}\`) or their direct relative (e.g., "Father", "Paternal Grandmother", "Spouse", "Son", "Daughter", "Sibling").
              - \`birthYear\`: (string, e.g., "1990"). Use provided, or estimate plausible Ugandan birth years if missing.
              - \`deathYear\`: (string, e.g., "2020", optional). Use provided.
              - \`generation\`: (number) 0 for \`${extendedFamily.familyName}\`; -1 for parents, -2 for grandparents; 1 for children, etc.
              - \`parentId\`: (string, optional) The 'id' of this person's primary parent (e.g. father or mother). Establish these links based on the provided structure (parents of main person, parents of siblings, main person as parent of children etc.).
              - \`isElder\`: (boolean) True if they are from \`selectedElders\` or context implies they are a respected elder.
              - \`gender\`: ('male', 'female', 'other', or a descriptive string). Use provided.
              - \`side\`: ('paternal' or 'maternal', optional) For parents and grandparents.
              - \`status\`: ('living' or 'deceased') based on deathYear or provided info.
              - \`photoUrl\`: (string, optional) Leave empty for now.
              - \`notes\`: (string, optional) Any relevant notes.
          3.  Ensure all individuals mentioned in the \`extendedFamily\` structure (main person, parents, grandparents, spouse, siblings, children, selectedElders) are included.
          4.  Siblings should share the same parents as the main person unless data implies otherwise.
          5.  Children should have the main person (and/or their spouse) as a parent.
          6.  \`selectedElders\` should be integrated, possibly as ancestors or notable figures; assign appropriate generations.

          Output ONLY the valid JSON array of FamilyMember objects. Do not include any explanations or markdown.
          Example of one FamilyMember: {"id": "person_1", "name": "John Doe", "relationship": "Father", "birthYear": "1960", "generation": -1, "parentId": "grandparent_1", "isElder": false, "gender": "male", "side": "paternal", "status": "living"}
        `;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o", // Or your preferred model
            messages: [
              { role: "system", content: "You are a family tree data structuring assistant. Output only valid JSON arrays." },
              { role: "user", content: prompt }
            ],
            temperature: 0.5, // Lower temperature for more deterministic structuring
            max_tokens: 3000, // Adjust as needed based on data size
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
          console.error("OpenAI API error response:", errorData);
          throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const aiResponseContent = data.choices?.[0]?.message?.content;

        if (!aiResponseContent) {
            throw new Error("Empty content in AI response.");
        }

        // Attempt to parse JSON from the AI response
        try {
          members = JSON.parse(aiResponseContent);
        } catch (parseError) {
          console.error("Failed to parse AI JSON response:", parseError);
          console.error("Raw AI response content:", aiResponseContent); // Log raw response for debugging
          // Attempt to extract JSON from markdown code block if present
          const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              members = JSON.parse(jsonMatch[1]);
            } catch (nestedParseError) {
              throw new Error("Could not extract or parse JSON from AI response even after ```json block extraction.");
            }
          } else {
            throw new Error("AI response was not valid JSON and no JSON block found.");
          }
        }
        
        if (!Array.isArray(members) || (members.length === 0 && Object.keys(extendedFamily).length > 0 )) { // if user provided data, expect some members
          console.warn("AI returned empty or invalid array for non-empty input. Raw:", aiResponseContent);
          // Potentially fall back or throw error
           throw new Error("Invalid or empty member array from AI for provided data.");
        }
        
        // Basic validation and default setting for AI-generated members
        members = members.map((member: any, index: number) => ({
          id: member.id || `ai_member_${Date.now()}_${index}`,
          name: member.name || "Unnamed by AI", // CRITICAL: Ensure names are processed
          relationship: member.relationship || "Relative",
          birthYear: member.birthYear || undefined,
          deathYear: member.deathYear || undefined,
          generation: (typeof member.generation === 'number') ? member.generation : 0,
          parentId: member.parentId || undefined,
          isElder: member.isElder || false,
          gender: member.gender || undefined,
          side: member.side as 'maternal' | 'paternal' | undefined,
          status: member.deathYear ? 'deceased' : (member.status || 'living'),
          photoUrl: member.photoUrl || undefined,
          notes: member.notes || undefined,
        }));

      } catch (aiError) {
        console.error("Error processing family tree with AI:", aiError.message);
        members = fallbackMembers.map(m => m.relationship === 'Self' ? { ...m, name: `${extendedFamily.familyName || surname}` } : m);
        source = 'fallback';
      }
    }

    const treeId = crypto.randomUUID(); // For the new FamilyTree record

    return new Response(
      JSON.stringify({
        id: treeId, // This is the ID for the 'family_trees' table entry
        userId: null, // This should be set on the client or via Supabase Auth context when saving
        surname,
        tribe,
        clan,
        members, // The array of FamilyMember objects
        createdAt: new Date().toISOString(),
        source, // 'ai' or 'fallback'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unhandled error in Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
