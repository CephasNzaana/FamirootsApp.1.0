// supabase/functions/generate-family-tree/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Use a recent stable Deno standard library version
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for Deno Deploy if any library relies on XHR

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_TIMEOUT_SECONDS_CONFIG = Deno.env.get("FUNCTION_TIMEOUT_SECONDS");
const FUNCTION_TIMEOUT_GRACE_PERIOD_MS = 5000; // Increased grace period

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // IMPORTANT: Restrict this to your app's domain in production!
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- INTERFACES (Ensure these align with your frontend types/index.ts) ---
interface MemberInputData {
  name?: string;
  gender?: string;
  birthYear?: string;
  deathYear?: string;
  // Add any other relevant fields you collect per individual in your TreeFormData.extendedFamily
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
  familyName?: string; // Main person's name from "About You" section of your form
  gender?: string;
  birthYear?: string;
  birthPlace?: string; // If you collect this
  siblings?: MemberInputData[];
  spouse?: MemberInputData;
  parents?: ParentsInputData;
  grandparents?: GrandparentsInputData;
  children?: MemberInputData[];
  selectedElders?: { id: string; name: string; approximateEra?: string }[]; // From your form data
}

interface TreeFormData { // This is the expected structure of the request body
  surname: string;
  tribe: string;
  clan: string;
  extendedFamily: ExtendedFamilyInputData;
}

interface FamilyMember {
  id: string; // Should be generated uniquely for each member by AI/this function
  name: string;
  relationship: string; // e.g., "Self", "Father", "Paternal Grandfather"
  birthYear?: string;
  deathYear?: string;
  generation: number; // 0 for main person, -1 for parents, etc.
  parentId?: string; // ID of one primary parent (e.g., father or mother)
  isElder: boolean;
  gender?: 'male' | 'female' | 'other' | string; // AI might return a string
  side?: 'paternal' | 'maternal';
  status: 'living' | 'deceased';
  photoUrl?: string; // Optional
  notes?: string;    // Optional
}

// --- FALLBACK DATA (Customize as needed) ---
const fallbackMembers: FamilyMember[] = [
  { id: "fb_self_1", name: "Fallback User", relationship: "Self", birthYear: "1990", generation: 0, isElder: false, status: "living", gender: "male" },
  { id: "fb_father_1", name: "Fallback Father", relationship: "Father", birthYear: "1960", generation: -1, parentId: "fb_p_gf_1", isElder: false, status: "living", gender: "male", side: "paternal" },
  { id: "fb_mother_1", name: "Fallback Mother", relationship: "Mother", birthYear: "1965", generation: -1, parentId: "fb_m_gf_1", isElder: false, status: "living", gender: "female", side: "maternal" },
  { id: "fb_p_gf_1", name: "Fallback Paternal GF", relationship: "Paternal Grandfather", birthYear: "1930", generation: -2, isElder: true, status: "deceased", gender: "male", side: "paternal" },
  { id: "fb_m_gf_1", name: "Fallback Maternal GF", relationship: "Maternal Grandfather", birthYear: "1935", generation: -2, isElder: true, status: "deceased", gender: "male", side: "maternal" },
];

serve(async (req: Request) => {
  const functionStartTime = Date.now();
  const configuredTimeout = FUNCTION_TIMEOUT_SECONDS_CONFIG ? parseInt(FUNCTION_TIMEOUT_SECONDS_CONFIG) * 1000 : 55000; // Default 55s for a 60s limit
  const invocationId = `InvokeID:${functionStartTime % 100000}`; // Short ID for correlating logs

  console.log(`[${new Date(functionStartTime).toISOString()}] ${invocationId} generate-family-tree invoked. Method: ${req.method}. Configured timeout: ${configuredTimeout}ms`);

  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] ${invocationId} Handling OPTIONS request.`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: TreeFormData = await req.json();
    console.log(`[${new Date().toISOString()}] ${invocationId} Request body received. Surname: ${formData.surname}, Main Person: ${formData.extendedFamily?.familyName}`);
    // For deeper debugging, log more of formData if needed, being mindful of log size limits
    // console.log(`[${new Date().toISOString()}] ${invocationId} Full extendedFamily input:`, JSON.stringify(formData.extendedFamily, null, 2).substring(0,1000));


    const { surname, tribe, clan, extendedFamily } = formData;

    if (!surname || !tribe || !clan || !extendedFamily || !extendedFamily.familyName) {
      console.error(`[${new Date().toISOString()}] ${invocationId} Validation Error: Missing required data in request.`);
      return new Response(
        JSON.stringify({ error: 'Missing required detailed form data (surname, tribe, clan, and extendedFamily details including main person\'s name) are needed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let members: FamilyMember[] = [];
    let source: 'ai' | 'fallback' = 'ai';

    if (!OPENAI_API_KEY) {
      console.warn(`[${new Date().toISOString()}] ${invocationId} OPENAI_API_KEY is not configured. Using fallback data.`);
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
        console.log(`[${new Date().toISOString()}] ${invocationId} Preparing data for OpenAI prompt...`);
        const userProvidedDataString = JSON.stringify(extendedFamily, null, 2);

        // !!! --- THIS IS THE CRUCIAL PROMPT TO REFINE EXTENSIVELY --- !!!
        // Test this prompt with different inputs to ensure the AI understands how to map your TreeFormData
        // to the FamilyMember[] structure, especially using the names YOU provide.
        const prompt = `
          You are an expert Ugandan genealogist tasked with structuring detailed family data into a specific JSON format.
          The family details are: Surname: "${surname}", Tribe: "${tribe}", Clan: "${clan}".
          The main person for this tree (generation 0) is named: "${extendedFamily.familyName}".

          User-provided family structure details (prioritize all names and details from here):
          \`\`\`json
          ${userProvidedDataString}
          \`\`\`

          Your tasks are to meticulously process ALL individuals mentioned in the user-provided \`extendedFamily\` JSON data and generate a list of \`FamilyMember\` objects.
          For each individual, create a \`FamilyMember\` object with the following fields:
          - \`id\`: Generate a unique, descriptive STRING ID for each person (e.g., "main_${extendedFamily.familyName?.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/gi, '')}", "father_of_main", "sibling_1_main"). IDs MUST be unique strings within the generated list.
          - \`name\`: The full name as a STRING. YOU MUST USE THE NAMES EXACTLY AS PROVIDED BY THE USER from the \`extendedFamily\` data. If a name is structurally implied but missing in the user input (e.g., a parent slot is present in the form's structure but the user left the name blank in the input), use a descriptive placeholder like "Unnamed Father of ${extendedFamily.familyName}" or "Unnamed Paternal Grandmother". User-provided names take absolute precedence.
          - \`relationship\`: STRING. The relationship term (e.g., "Self", "Father", "Mother", "Paternal Grandfather", "Spouse", "Son", "Daughter", "Sibling", "Clan Elder"). This should be relative to the main person ("${extendedFamily.familyName}") or their direct parent in the hierarchy.
          - \`birthYear\`: STRING (e.g., "1990"). Use the user-provided birth year. If missing and context allows (e.g. parent of known child), estimate a plausible Ugandan birth year. Otherwise, leave as null or undefined.
          - \`deathYear\`: STRING (e.g., "2020", optional). Use user-provided.
          - \`generation\`: NUMBER. Set strictly: 0 for the main person ("${extendedFamily.familyName}"); -1 for their direct parents; -2 for their direct grandparents; 0 for spouse of main person; 0 for siblings of main person; 1 for children of main person. For \`selectedElders\`, assign appropriate ancestral generations (e.g., -2, -3, -4) based on their \`approximateEra\` or context.
          - \`parentId\`: STRING (optional). The 'id' of this person's primary parent. Establish these links carefully based on the input structure.
          - \`isElder\`: BOOLEAN. True if the person is listed in \`extendedFamily.selectedElders\` or if their context (e.g., a great-grandparent role) strongly implies they are a respected elder. Default to false.
          - \`gender\`: STRING ('male', 'female', 'other'). Use user-provided. Infer from roles like 'father', 'mother', 'grandmother' if not specified.
          - \`side\`: STRING ('paternal' or 'maternal', optional). Apply accurately for parents/grandparents of the main person.
          - \`status\`: STRING ('living' or 'deceased'). Infer from \`deathYear\`. If \`deathYear\` present, status is 'deceased'. Default 'living'.
          - \`photoUrl\`: STRING (optional). Leave as null or undefined for now.
          - \`notes\`: STRING (optional). Include any user-provided notes from the input. If none are provided, you can generate a brief, culturally relevant note if appropriate, or leave null/undefined.

          CRITICAL: Ensure "${extendedFamily.familyName}" is included in the output array with relationship "Self", generation 0, and a valid string 'id'.
          Output ONLY the valid JSON array of these FamilyMember objects. Do not include any explanations, comments, or markdown formatting outside the JSON array itself. ALL 'id' and 'parentId' fields MUST be STRINGS.
        `;
        
        console.log(`[${new Date().toISOString()}] ${invocationId} Sending prompt to OpenAI (length: ${prompt.length}).`);
        // console.log("Full prompt being sent:", prompt); // Uncomment for deep prompt debugging
        const openAICallStartTime = Date.now();

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o", // Or "gpt-3.5-turbo-0125" for faster testing
            messages: [
              { role: "system", content: "You are a family tree data structuring assistant. Output only valid JSON arrays of FamilyMember objects. Ensure all user-provided names are used. All 'id' and 'parentId' fields MUST be strings. The main person specified in the prompt MUST be included with relationship 'Self' and generation 0." },
              { role: "user", content: prompt }
            ],
            temperature: 0.1, 
            max_tokens: 3800, 
          }),
        });

        const openAICallDuration = Date.now() - openAICallStartTime;
        console.log(`[${new Date().toISOString()}] ${invocationId} OpenAI API call finished. Status: ${response.status}, Duration: ${openAICallDuration}ms`);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorData;
          try { errorData = JSON.parse(errorBody); } catch (e) {
            errorData = { error: { message: `OpenAI API Error ${response.status}: ${response.statusText}. Response (first 500 chars): ${errorBody.substring(0, 500)}` } };
          }
          console.error(`[${new Date().toISOString()}] ${invocationId} OpenAI API error response:`, errorData);
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponseContent = data.choices?.[0]?.message?.content;

        if (!aiResponseContent) {
          console.error(`[${new Date().toISOString()}] ${invocationId} Empty content in AI response from OpenAI.`);
          throw new Error("Empty content in AI response.");
        }

        console.log(`[${new Date().toISOString()}] ${invocationId} Raw AI response content received (length: ${aiResponseContent.length}). Attempting to parse...`);
        // For deeper debugging of AI output:
        // console.log(`[${new Date().toISOString()}] ${invocationId} AI Raw Content Snippet (first 1000 chars):`, aiResponseContent.substring(0,1000)); 

        try {
          members = JSON.parse(aiResponseContent);
        } catch (parseError) {
          console.warn(`[${new Date().toISOString()}] ${invocationId} Initial JSON.parse failed for AI response (Error: ${parseError.message}). Attempting to extract from markdown block...`);
          const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              members = JSON.parse(jsonMatch[1]);
              console.log(`[${new Date().toISOString()}] ${invocationId} Successfully parsed JSON from markdown block.`);
            } catch (nestedParseError) {
              console.error(`[${new Date().toISOString()}] ${invocationId} Failed to parse JSON even from markdown block:`, nestedParseError.message);
              console.error(`[${new Date().toISOString()}] ${invocationId} Problematic AI content for markdown extraction (first 500 chars):`, aiResponseContent.substring(0,500));
              throw new Error("Could not extract or parse JSON from AI response (tried raw & markdown block).");
            }
          } else {
            console.error(`[${new Date().toISOString()}] ${invocationId} AI response was not valid JSON and no JSON block found.`);
            console.error(`[${new Date().toISOString()}] ${invocationId} Problematic AI content (first 500 chars):`, aiResponseContent.substring(0,500));
            throw new Error("AI response was not valid JSON and no JSON block found.");
          }
        }
        
        if (!Array.isArray(members)) {
          console.error(`[${new Date().toISOString()}] ${invocationId} AI response parsed but is not an array as expected. Received type: ${typeof members}, Value (first 500 chars):`, JSON.stringify(members, null, 2).substring(0, 500));
          throw new Error("AI response format was not an array of family members as expected.");
        }
        
        if (members.length === 0 && extendedFamily.familyName) { 
           console.warn(`[${new Date().toISOString()}] ${invocationId} AI returned an empty member list despite receiving familyName. This indicates a potential issue with the prompt or the AI's ability to process the provided detailed input.`);
        }
        
        console.log(`[${new Date().toISOString()}] ${invocationId} AI processing successful. Number of members initially parsed: ${members.length}`);
        
        // Final validation and type casting for members from AI
        members = members.map((member: any, index: number) => {
          if (!member || typeof member !== 'object') {
            console.warn(`[${new Date().toISOString()}] ${invocationId} Invalid member item from AI at index ${index}, skipping. Item:`, member);
            return null; // Will be filtered out
          }
          return {
            id: String(member.id || `ai_member_${Date.now()}_${index}`), // CRITICAL: ID must be string
            name: String(member.name || "Unnamed by AI"),             // CRITICAL: Name must be string
            relationship: String(member.relationship || "Relative"),
            birthYear: member.birthYear ? String(member.birthYear) : undefined,
            deathYear: member.deathYear ? String(member.deathYear) : undefined,
            generation: (typeof member.generation === 'number' && !isNaN(member.generation)) ? member.generation : 0,
            parentId: member.parentId ? String(member.parentId) : undefined, // CRITICAL: parentId must be string or undefined
            isElder: Boolean(member.isElder || false),
            gender: member.gender ? String(member.gender) : undefined,
            side: member.side ? String(member.side) as 'paternal' | 'maternal' : undefined,
            status: member.deathYear ? 'deceased' : (String(member.status || 'living') as 'living' | 'deceased'),
            photoUrl: member.photoUrl ? String(member.photoUrl) : undefined,
            notes: member.notes ? String(member.notes) : undefined,
          };
        }).filter(member => member !== null) as FamilyMember[]; // Filter out any nulls from invalid items
        
        console.log(`[${new Date().toISOString()}] ${invocationId} Members after string casting, defaulting, and validation: ${members.length}`);

      } catch (aiError) {
        console.error(`[${new Date().toISOString()}] ${invocationId} Error during AI processing stage:`, aiError.message, aiError.stack ? aiError.stack.substring(0, 500) : "No stack");
        members = fallbackMembers.map(m => {
          if (m.relationship === 'Self' && extendedFamily.familyName) {
            return { ...m, name: extendedFamily.familyName, gender: extendedFamily.gender || m.gender, birthYear: extendedFamily.birthYear || m.birthYear };
          }
          return m;
        });
        source = 'fallback';
        console.log(`[${new Date().toISOString()}] ${invocationId} Using fallback data due to AI processing error.`);
      }
    }

    const treeId = crypto.randomUUID(); 
    const responsePayload = {
        id: treeId, // This is the ID for the 'family_trees' table entry in the database
        surname,
        tribe,
        clan,
        members: Array.isArray(members) ? members : [], // Ensure members is an array, even if empty
        createdAt: new Date().toISOString(),
        source, // 'ai' or 'fallback'
    };

    const functionEndTime = Date.now();
    const functionDuration = functionEndTime - functionStartTime;
    console.log(`[${new Date(functionEndTime).toISOString()}] ${invocationId} Preparing to send response. Duration: ${functionDuration}ms. Payload members: ${responsePayload.members.length}. Response 'id': ${responsePayload.id}, 'source': ${responsePayload.source}`);
    // Log a snippet of members for quick check
    if (responsePayload.members.length > 0) {
        console.log(`[${new Date().toISOString()}] ${invocationId} First member in response:`, JSON.stringify(responsePayload.members[0]));
    }
    
    if (functionDuration > configuredTimeout - FUNCTION_TIMEOUT_GRACE_PERIOD_MS) {
        console.warn(`[${new Date().toISOString()}] ${invocationId} Function approaching configured timeout of ${configuredTimeout}ms (duration: ${functionDuration}ms). Sending response now.`);
    }

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorTime = Date.now();
    const functionDuration = errorTime - functionStartTime;
    console.error(`[${new Date(errorTime).toISOString()}] ${invocationId} UNHANDLED error in Edge Function after ${functionDuration}ms:`, error.message, error.stack ? error.stack.substring(0, 500) : "No stack");
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred in the Edge Function." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
