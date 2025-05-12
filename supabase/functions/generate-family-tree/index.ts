// supabase/functions/generate-family-tree/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_TIMEOUT_SECONDS_CONFIG = Deno.env.get("FUNCTION_TIMEOUT_SECONDS");
const FUNCTION_TIMEOUT_GRACE_PERIOD_MS = 5000;
// --- TEMPORARY BYPASS FOR TESTING ---
const BYPASS_AI_FOR_TESTING = true; // Set to true to bypass AI and test structuring logic
// --- END TEMPORARY BYPASS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Interfaces for form input (align with your frontend)
interface MemberInputData { name?: string; gender?: string; birthYear?: string; deathYear?: string; notes?: string; /* any other fields from form */ }
interface ParentsInputData { father?: MemberInputData; mother?: MemberInputData; }
interface GrandparentsInputData {
  paternal?: { grandfather?: MemberInputData; grandmother?: MemberInputData; };
  maternal?: { grandfather?: MemberInputData; grandmother?: MemberInputData; };
}
interface ExtendedFamilyInputData {
  familyName?: string; gender?: string; birthYear?: string; birthPlace?: string; notes?: string; // Main person
  siblings?: MemberInputData[]; spouse?: MemberInputData; parents?: ParentsInputData;
  grandparents?: GrandparentsInputData; children?: MemberInputData[];
  selectedElders?: { id: string; name: string; approximateEra?: string; notes?: string }[];
}
interface TreeFormData { surname: string; tribe: string; clan: string; extendedFamily: ExtendedFamilyInputData; }

// Output structure
interface FamilyMember {
  id: string; name: string; relationship: string; birthYear?: string; deathYear?: string;
  generation: number; parentId?: string; isElder: boolean; gender?: string;
  side?: 'paternal' | 'maternal'; status: 'living' | 'deceased'; photoUrl?: string; notes?: string;
}

// Helper to generate unique string IDs
const generateDeterministicId = (role: string, name?: string, index?: number): string => {
  const base = name ? name.trim().toLowerCase().replace(/[^a-z0-9]/gi, '_') : role;
  return `${role.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_${base}_${index !== undefined ? index : Date.now().toString(36) + Math.random().toString(36).substring(2, 5)}`;
};

// Structure for AI to fill (simpler)
interface AiPersonInput {
  tempId: string; // Temporary ID for matching AI output back to pre-processed individuals
  role: string; // e.g., "mainPerson", "father", "paternalGrandfather", "sibling_0", "child_1"
  providedName?: string;
  providedGender?: string;
  providedBirthYear?: string;
  providedDeathYear?: string;
  providedNotes?: string;
  contextualRelationship: string; // e.g. "Self", "Father of [mainPersonName]"
}

interface AiPersonOutput {
  tempId: string; // Should match the input tempId
  name: string;
  birthYear?: string;
  deathYear?: string;
  gender?: string;
  status?: 'living' | 'deceased';
  notes?: string; // AI can generate or pass through
}


serve(async (req: Request) => {
  const functionStartTime = Date.now();
  const configuredTimeout = FUNCTION_TIMEOUT_SECONDS_CONFIG ? parseInt(FUNCTION_TIMEOUT_SECONDS_CONFIG) * 1000 : 55000;
  const invocationId = `InvokeID:${functionStartTime % 100000}`;
  console.log(`[${new Date(functionStartTime).toISOString()}] ${invocationId} generate-family-tree invoked (NEW APPROACH). Method: ${req.method}.`);

  if (req.method === 'OPTIONS') { /* ... CORS handling ... */ return new Response(null, { headers: corsHeaders }); }

  try {
    const formData: TreeFormData = await req.json();
    const { surname, tribe, clan, extendedFamily } = formData;
    console.log(`[${new Date().toISOString()}] ${invocationId} Request body received. Surname: ${surname}, Main Person: ${extendedFamily?.familyName}`);

    if (!surname || !tribe || !clan || !extendedFamily || !extendedFamily.familyName) { /* ... validation ... */ }

    // 1. Pre-process TreeFormData into a list of individuals with roles for AI
    const individualsForAI: AiPersonInput[] = [];
    const mainPersonTempId = "main_person";

    individualsForAI.push({
      tempId: mainPersonTempId, role: "mainPerson", providedName: extendedFamily.familyName,
      providedGender: extendedFamily.gender, providedBirthYear: extendedFamily.birthYear,
      providedNotes: extendedFamily.notes, contextualRelationship: "Self (Proband)"
    });

    if (extendedFamily.parents) {
      if (extendedFamily.parents.father) individualsForAI.push({ tempId: "father", role: "father", ...extendedFamily.parents.father, contextualRelationship: `Father of ${extendedFamily.familyName}` });
      if (extendedFamily.parents.mother) individualsForAI.push({ tempId: "mother", role: "mother", ...extendedFamily.parents.mother, contextualRelationship: `Mother of ${extendedFamily.familyName}` });
    }
    if (extendedFamily.grandparents) {
      if (extendedFamily.grandparents.paternal?.grandfather) individualsForAI.push({ tempId: "paternalGrandfather", role: "paternalGrandfather", ...extendedFamily.grandparents.paternal.grandfather, contextualRelationship: `Paternal Grandfather of ${extendedFamily.familyName}` });
      if (extendedFamily.grandparents.paternal?.grandmother) individualsForAI.push({ tempId: "paternalGrandmother", role: "paternalGrandmother", ...extendedFamily.grandparents.paternal.grandmother, contextualRelationship: `Paternal Grandmother of ${extendedFamily.familyName}` });
      if (extendedFamily.grandparents.maternal?.grandfather) individualsForAI.push({ tempId: "maternalGrandfather", role: "maternalGrandfather", ...extendedFamily.grandparents.maternal.grandfather, contextualRelationship: `Maternal Grandfather of ${extendedFamily.familyName}` });
      if (extendedFamily.grandparents.maternal?.grandmother) individualsForAI.push({ tempId: "maternalGrandmother", role: "maternalGrandmother", ...extendedFamily.grandparents.maternal.grandmother, contextualRelationship: `Maternal Grandmother of ${extendedFamily.familyName}` });
    }
    if (extendedFamily.spouse) individualsForAI.push({ tempId: "spouse", role: "spouse", ...extendedFamily.spouse, contextualRelationship: `Spouse of ${extendedFamily.familyName}` });
    (extendedFamily.siblings || []).forEach((s, i) => individualsForAI.push({ tempId: `sibling_${i}`, role: `sibling`, ...s, contextualRelationship: `Sibling of ${extendedFamily.familyName}` }));
    (extendedFamily.children || []).forEach((c, i) => individualsForAI.push({ tempId: `child_${i}`, role: `child`, ...c, contextualRelationship: `Child of ${extendedFamily.familyName}` }));
    (extendedFamily.selectedElders || []).forEach(e => individualsForAI.push({ tempId: e.id, role: "clanElder", providedName: e.name, providedNotes: e.approximateEra ? `Era: ${e.approximateEra}` : e.notes, contextualRelationship: "Clan Elder" }));
    
    console.log(`[${new Date().toISOString()}] ${invocationId} Pre-processed ${individualsForAI.length} individuals for AI input.`);

    let processedAiOutput: AiPersonOutput[] = [];
    let source: 'ai' | 'fallback' = 'ai';

    if (!OPENAI_API_KEY) { /* ... fallback if no API key ... */ 
        console.warn(`[${new Date().toISOString()}] ${invocationId} OPENAI_API_KEY not configured. Using simplified fallback structure.`);
        processedAiOutput = individualsForAI.map(ind => ({
            tempId: ind.tempId, name: ind.providedName || `Fallback ${ind.role}`,
            gender: ind.providedGender, birthYear: ind.providedBirthYear, deathYear: ind.providedDeathYear,
            status: ind.providedDeathYear ? 'deceased' : 'living', notes: ind.providedNotes
        }));
        source = 'fallback';
    } else {
      try {
        // New, simpler prompt for AI: Ask it to fill details for the pre-defined list.
        const prompt = `
          You are a data enrichment assistant for Ugandan family trees.
          Family Context: Surname: "${surname}", Tribe: "${tribe}", Clan: "${clan}".
          
          Here is a list of individuals identified from user input. For each person, please:
          1. Confirm or provide a culturally appropriate Ugandan full name, strongly prioritizing any 'providedName'.
          2. Estimate a plausible 'birthYear' (string) if 'providedBirthYear' is missing or vague, considering their role and Ugandan context.
          3. Estimate a 'deathYear' (string, optional) if 'providedDeathYear' is missing but context implies deceased (e.g., historical elder).
          4. Confirm or provide 'gender' ('male', 'female', 'other', string) using 'providedGender' or inferring from their role.
          5. Determine 'status' ('living' or 'deceased') based on deathYear or context.
          6. Include or generate brief 'notes' (string, optional) based on 'providedNotes' or their role.

          Input list of individuals (each with a 'tempId' you MUST preserve in your output):
          \`\`\`json
          ${JSON.stringify(individualsForAI.map(p => ({tempId: p.tempId, role: p.role, contextualRelationship: p.contextualRelationship, providedName: p.providedName, providedGender: p.providedGender, providedBirthYear: p.providedBirthYear, providedDeathYear: p.providedDeathYear, providedNotes: p.providedNotes })), null, 2)}
          \`\`\`

          Output ONLY a valid JSON array, where each object corresponds to an individual from the input list and includes:
          \`tempId\` (copied from input), \`name\`, \`birthYear\`, \`deathYear\`, \`gender\`, \`status\`, \`notes\`.
          Example object: {"tempId": "father", "name": "Mukasa Henry", "birthYear": "1965", "gender": "male", "status": "living", "notes": "Farmer from Mbarara."}
        `;

        console.log(`[${new Date().toISOString()}] ${invocationId} Sending new simpler prompt to OpenAI (length: ${prompt.length}).`);
        const openAICallStartTime = Date.now();
        const response = await fetch("https://api.openai.com/v1/chat/completions", { /* ... OpenAI call config ... */ 
             method: "POST",
             headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
             body: JSON.stringify({
                 model: "gpt-4o", // Or gpt-3.5-turbo for faster/cheaper processing of simpler tasks
                 messages: [
                     { role: "system", content: "You are a data enrichment assistant. Respond with ONLY a valid JSON array. Each object in the array must contain the 'tempId' from the input." },
                     { role: "user", content: prompt }
                 ], temperature: 0.2, max_tokens: 2000,
             }),
        });
        const openAICallDuration = Date.now() - openAICallStartTime;
        console.log(`[${new Date().toISOString()}] ${invocationId} OpenAI API call finished. Status: ${response.status}, Duration: ${openAICallDuration}ms`);

        if (!response.ok) { /* ... error handling ... */ }
        const data = await response.json();
        const aiResponseContent = data.choices?.[0]?.message?.content;
        if (!aiResponseContent) { /* ... error handling ... */ }
        
        console.log(`[${new Date().toISOString()}] ${invocationId} Raw AI (simpler) response received. Attempting to parse...`);
        try { processedAiOutput = JSON.parse(aiResponseContent); } 
        catch (parseError) { /* ... robust JSON parsing from markdown ... */ }

        if (!Array.isArray(processedAiOutput)) { /* ... error handling ... */ }
        console.log(`[${new Date().toISOString()}] ${invocationId} AI (simpler) processing successful. Items received: ${processedAiOutput.length}`);

      } catch (aiError) { /* ... fallback logic to use individualsForAI directly with defaults ... */ 
          console.error(`[${new Date().toISOString()}] ${invocationId} Error during NEW APPROACH AI processing:`, aiError.message);
          processedAiOutput = individualsForAI.map(ind => ({ // Use pre-AI list with defaults
            tempId: ind.tempId, name: ind.providedName || `Fallback ${ind.role} ${ind.tempId}`,
            gender: ind.providedGender, birthYear: ind.providedBirthYear, deathYear: ind.providedDeathYear,
            status: ind.providedDeathYear ? 'deceased' : 'living', notes: ind.providedNotes
          }));
          source = 'fallback';
          console.log(`[${new Date().toISOString()}] ${invocationId} Using fallback data (from pre-AI list) due to AI error.`);
      }
    }

    // 2. Now, deterministically build the final FamilyMember[] array
    const finalMembers: FamilyMember[] = [];
    const idMap: Record<string, string> = {}; // Maps tempId to final generated string ID

    // First pass: create all members with final IDs and basic details from AI/fallback
    processedAiOutput.forEach((aiPerson, index) => {
        const originalInput = individualsForAI.find(i => i.tempId === aiPerson.tempId);
        const finalId = generateDeterministicId(originalInput?.role || "member", aiPerson.name, index);
        idMap[aiPerson.tempId] = finalId;

        finalMembers.push({
            id: finalId,
            name: aiPerson.name,
            relationship: originalInput?.contextualRelationship || "Relative", // Set relationship based on role
            birthYear: aiPerson.birthYear ? String(aiPerson.birthYear) : undefined,
            deathYear: aiPerson.deathYear ? String(aiPerson.deathYear) : undefined,
            generation: 0, // Will be calculated next
            parentId: undefined, // Will be set next
            isElder: originalInput?.role === 'clanElder' || (originalInput?.role.toLowerCase().includes('grand') && originalInput?.role.toLowerCase().includes('parent')), // Basic elder logic
            gender: aiPerson.gender ? String(aiPerson.gender) : undefined,
            side: undefined, // Will be set next
            status: aiPerson.deathYear ? 'deceased' : (aiPerson.status || 'living'),
            photoUrl: undefined,
            notes: aiPerson.notes ? String(aiPerson.notes) : undefined,
        });
    });
    
    // Second pass: set generations, parentIds, and sides
    finalMembers.forEach(member => {
        const originalInput = individualsForAI.find(i => idMap[i.tempId] === member.id);
        const role = originalInput?.role;

        if (role === "mainPerson") {
            member.generation = 0;
            member.relationship = "Self";
            const fatherTempId = individualsForAI.find(i => i.role === "father")?.tempId;
            if (fatherTempId && idMap[fatherTempId]) member.parentId = idMap[fatherTempId];
            // Could add logic for mother as second parent if schema supports array parentIds or different linking
        } else if (role === "father") {
            member.generation = -1; member.side = "paternal";
            const pgfTempId = individualsForAI.find(i => i.role === "paternalGrandfather")?.tempId;
            if (pgfTempId && idMap[pgfTempId]) member.parentId = idMap[pgfTempId];
        } else if (role === "mother") {
            member.generation = -1; member.side = "maternal";
            const mgfTempId = individualsForAI.find(i => i.role === "maternalGrandfather")?.tempId;
            if (mgfTempId && idMap[mgfTempId]) member.parentId = idMap[mgfTempId];
        } else if (role === "paternalGrandfather") {
            member.generation = -2; member.side = "paternal";
        } else if (role === "paternalGrandmother") {
            member.generation = -2; member.side = "paternal";
            const pgfTempId = individualsForAI.find(i => i.role === "paternalGrandfather")?.tempId;
            if (pgfTempId && idMap[pgfTempId]) member.parentId = idMap[pgfTempId]; // Assuming linked to PGF
        } else if (role === "maternalGrandfather") {
            member.generation = -2; member.side = "maternal";
        } else if (role === "maternalGrandmother") {
            member.generation = -2; member.side = "maternal";
            const mgfTempId = individualsForAI.find(i => i.role === "maternalGrandfather")?.tempId;
            if (mgfTempId && idMap[mgfTempId]) member.parentId = idMap[mgfTempId]; // Assuming linked to MGF
        } else if (role === "spouse") {
            member.generation = 0;
        } else if (role === "sibling") {
            member.generation = 0;
            const fatherTempId = individualsForAI.find(i => i.role === "father")?.tempId;
            if (fatherTempId && idMap[fatherTempId]) member.parentId = idMap[fatherTempId];
            else {
                const motherTempId = individualsForAI.find(i => i.role === "mother")?.tempId;
                if (motherTempId && idMap[motherTempId]) member.parentId = idMap[motherTempId];
            }
        } else if (role === "child") {
            member.generation = 1;
            member.parentId = idMap[mainPersonTempId]; // Child of main person
        } else if (role === "clanElder") {
            member.generation = -3; // Or derive from approximateEra
            member.isElder = true;
        }
    });
    console.log(`[${new Date().toISOString()}] ${invocationId} Deterministic structuring complete. Final members count: ${finalMembers.length}`);


    const treeId = crypto.randomUUID(); 
    const responsePayload = {
        id: treeId, surname, tribe, clan, 
        members: finalMembers, 
        createdAt: new Date().toISOString(), source,
    };

    const functionEndTime = Date.now();
    const functionDuration = functionEndTime - functionStartTime;
    console.log(`[${new Date(functionEndTime).toISOString()}] ${invocationId} Preparing to send response (NEW APPROACH). Duration: ${functionDuration}ms. Payload members: ${responsePayload.members.length}.`);
    if (responsePayload.members.length > 0) console.log(`[${new Date().toISOString()}] ${invocationId} First member in new response:`, JSON.stringify(responsePayload.members[0]));
    
    if (functionDuration > configuredTimeout - FUNCTION_TIMEOUT_GRACE_PERIOD_MS) { /* ... timeout warning ... */ }

    return new Response(JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) { /* ... outer error handling ... */ }
});
