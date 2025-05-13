// supabase/functions/generate-family-tree/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_TIMEOUT_SECONDS_CONFIG = Deno.env.get("FUNCTION_TIMEOUT_SECONDS");
const FUNCTION_TIMEOUT_GRACE_PERIOD_MS = 5000;

// --- TEMPORARY BYPASS FOR TESTING ---
// SET THIS TO true TO SKIP AI AND TEST YOUR DENO STRUCTURING LOGIC
const BYPASS_AI_FOR_TESTING = false; 
// --- END TEMPORARY BYPASS ---


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MemberInputData { name?: string; gender?: string; birthYear?: string; deathYear?: string; notes?: string; }
interface ParentsInputData { father?: MemberInputData; mother?: MemberInputData; }
interface GrandparentsInputData {
  paternal?: { grandfather?: MemberInputData; grandmother?: MemberInputData; };
  maternal?: { grandfather?: MemberInputData; grandmother?: MemberInputData; };
}
interface ExtendedFamilyInputData {
  familyName?: string; gender?: string; birthYear?: string; birthPlace?: string; notes?: string;
  siblings?: MemberInputData[]; spouse?: MemberInputData; parents?: ParentsInputData;
  grandparents?: GrandparentsInputData; children?: MemberInputData[];
  selectedElders?: { id: string; name: string; approximateEra?: string; notes?: string }[];
}
interface TreeFormData { surname: string; tribe: string; clan: string; extendedFamily: ExtendedFamilyInputData; }

interface FamilyMember {
  id: string; name: string; relationship: string; birthYear?: string; deathYear?: string;
  generation: number; parentId?: string; isElder: boolean; gender?: string;
  side?: 'paternal' | 'maternal'; status: 'living' | 'deceased'; photoUrl?: string; notes?: string; spouseId?: string;
}

const fallbackMembers: FamilyMember[] = [ /* Your fallback data */ ];

const generateDeterministicId = (role: string, name?: string, index?: number): string => {
  const safeRole = role.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const safeName = (name && name.trim()) ? name.trim().toLowerCase().replace(/[^a-z0-9_]/gi, '').substring(0,10) : `unnamed_${safeRole}`;
  const randomSuffix = Date.now().toString(36).slice(-4) + Math.random().toString(36).substring(2, 7);
  return `${safeRole}_${safeName}_${index !== undefined ? index : ''}${randomSuffix}`.substring(0, 60);
};

interface AiPersonInput {
  tempId: string; role: string; providedName?: string; providedGender?: string;
  providedBirthYear?: string; providedDeathYear?: string; providedNotes?: string;
  contextualRelationship: string; 
}
interface AiPersonOutput {
  tempId: string; name: string; birthYear?: string; deathYear?: string;
  gender?: string; status?: 'living' | 'deceased'; notes?: string;
}

serve(async (req: Request) => {
  const functionStartTime = Date.now();
  const configuredTimeout = FUNCTION_TIMEOUT_SECONDS_CONFIG ? parseInt(FUNCTION_TIMEOUT_SECONDS_CONFIG) * 1000 : 55000;
  const invocationId = `InvokeID:${functionStartTime % 100000}`;
  console.log(`[${new Date(functionStartTime).toISOString()}] ${invocationId} generate-family-tree invoked (AI Bypass: ${BYPASS_AI_FOR_TESTING}). Method: ${req.method}.`);

  if (req.method === 'OPTIONS') { return new Response(null, { headers: corsHeaders }); }

  try {
    const formData: TreeFormData = await req.json();
    const { surname, tribe, clan, extendedFamily } = formData;
    console.log(`[${new Date().toISOString()}] ${invocationId} Request body. Main Person: ${extendedFamily?.familyName}`);

    if (!surname || !tribe || !clan || !extendedFamily || !extendedFamily.familyName) {
      console.error(`[${new Date().toISOString()}] ${invocationId} Validation Error: Missing required data.`);
      return new Response(JSON.stringify({ error: 'Missing required detailed form data.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const individualsForAI: AiPersonInput[] = [];
    const mainPersonTempId = "main_person_temp_id";
    // ... (Populate individualsForAI exactly as in the previous "New Approach" Edge Function)
    individualsForAI.push({tempId: mainPersonTempId, role: "mainPerson", providedName: extendedFamily.familyName, providedGender: extendedFamily.gender, providedBirthYear: extendedFamily.birthYear, providedNotes: extendedFamily.notes, contextualRelationship: "Self (Proband)"});
    if(extendedFamily.parents){ if(extendedFamily.parents.father)individualsForAI.push({tempId:"father_temp_id",role:"father",...extendedFamily.parents.father,contextualRelationship:`Father of ${extendedFamily.familyName}`}); if(extendedFamily.parents.mother)individualsForAI.push({tempId:"mother_temp_id",role:"mother",...extendedFamily.parents.mother,contextualRelationship:`Mother of ${extendedFamily.familyName}`});}
    if(extendedFamily.grandparents){ if(extendedFamily.grandparents.paternal?.grandfather)individualsForAI.push({tempId:"pgf_temp_id",role:"paternalGrandfather",...extendedFamily.grandparents.paternal.grandfather,contextualRelationship:`Paternal Grandfather`}); if(extendedFamily.grandparents.paternal?.grandmother)individualsForAI.push({tempId:"pgm_temp_id",role:"paternalGrandmother",...extendedFamily.grandparents.paternal.grandmother,contextualRelationship:`Paternal Grandmother`}); if(extendedFamily.grandparents.maternal?.grandfather)individualsForAI.push({tempId:"mgf_temp_id",role:"maternalGrandfather",...extendedFamily.grandparents.maternal.grandfather,contextualRelationship:`Maternal Grandfather`}); if(extendedFamily.grandparents.maternal?.grandmother)individualsForAI.push({tempId:"mgm_temp_id",role:"maternalGrandmother",...extendedFamily.grandparents.maternal.grandmother,contextualRelationship:`Maternal Grandmother`});}
    if(extendedFamily.spouse)individualsForAI.push({tempId:"spouse_temp_id",role:"spouse",...extendedFamily.spouse,contextualRelationship:`Spouse of ${extendedFamily.familyName}`});
    (extendedFamily.siblings||[]).forEach((s,i)=>individualsForAI.push({tempId:`sibling_${i}_temp_id`,role:`sibling`,...s,contextualRelationship:`Sibling of ${extendedFamily.familyName}`}));
    (extendedFamily.children||[]).forEach((c,i)=>individualsForAI.push({tempId:`child_${i}_temp_id`,role:`child`,...c,contextualRelationship:`Child of ${extendedFamily.familyName}`}));
    (extendedFamily.selectedElders||[]).forEach((e,i)=>individualsForAI.push({tempId:e.id||`elder_${i}_temp_id`,role:"clanElder",providedName:e.name,providedNotes:e.approximateEra?`Era: ${e.approximateEra}`:e.notes,contextualRelationship:"Clan Elder"}));
    console.log(`[${new Date().toISOString()}] ${invocationId} Pre-processed ${individualsForAI.length} individuals for AI input/structuring.`);

    let processedAiOutput: AiPersonOutput[] = [];
    let source: 'ai' | 'fallback' | 'ai_bypassed_test' = 'ai';

    if (BYPASS_AI_FOR_TESTING || !OPENAI_API_KEY) { 
        console.warn(`[${new Date().toISOString()}] ${invocationId} ${BYPASS_AI_FOR_TESTING ? "AI BYPASSED FOR TESTING." : "OPENAI_API_KEY not configured."} Simulating AI output.`);
        processedAiOutput = individualsForAI.map(ind => ({
            tempId: ind.tempId, name: ind.providedName || `Test ${ind.role.replace(/_/g, ' ')}`,
            gender: ind.providedGender || (ind.role.includes("father") || ind.role.includes("grandfather") || (ind.role === "mainPerson" && ind.providedGender !== "female") ? "male" : (ind.role.includes("mother") || ind.role.includes("grandmother") ? "female" : "other")),
            birthYear: ind.providedBirthYear || "19XX", status: ind.providedDeathYear ? 'deceased' : 'living',
            notes: ind.providedNotes || `Test note for ${ind.role.replace(/_/g, ' ')}.`
        }));
        source = BYPASS_AI_FOR_TESTING ? 'ai_bypassed_test' : 'fallback';
    } else {
      try {
        const prompt = `
          You are a data enrichment assistant for Ugandan family trees.
          Family Context: Surname: "${surname}", Tribe: "${tribe}", Clan: "${clan}".
          Main person is "${extendedFamily.familyName}".
          Input list of individuals (each with a 'tempId' you MUST preserve):
          \`\`\`json
          ${JSON.stringify(individualsForAI.map(p => ({tempId: p.tempId, role: p.role, contextualRelationship: p.contextualRelationship, providedName: p.providedName, providedGender: p.providedGender, providedBirthYear: p.providedBirthYear, providedDeathYear: p.providedDeathYear, providedNotes: p.providedNotes })), null, 2)}
          \`\`\`
          For each person in the input list, provide:
          1. \`name\`: STRING. Use 'providedName' if available and not empty; otherwise, create a plausible Ugandan name for the given 'role'.
          2. \`birthYear\`: STRING. Use 'providedBirthYear' or estimate plausibly.
          3. \`deathYear\`: STRING (optional). Use 'providedDeathYear' or estimate if context implies deceased.
          4. \`gender\`: STRING ('male', 'female', 'other'). Use 'providedGender' or infer from 'role'.
          5. \`status\`: STRING ('living' or 'deceased'). Infer from deathYear/context.
          6. \`notes\`: STRING (optional). Use 'providedNotes' or generate a brief relevant note.
          Output ONLY a valid JSON array of objects, each containing: \`tempId\` (copied from input), \`name\`, \`birthYear\`, \`deathYear\`, \`gender\`, \`status\`, \`notes\`.
          Example: [{"tempId": "father_temp_id", "name": "Mukasa Henry", "birthYear": "1965", "gender": "male", "status": "living", "notes": "Farmer."}]
        `;
        
        console.log(`[${new Date().toISOString()}] ${invocationId} Sending new simpler prompt to OpenAI (length: ${prompt.length}).`);
        const openAICallStartTime = Date.now();
        const response = await fetch("https://api.openai.com/v1/chat/completions", { /* ... OpenAI call config ... */ 
            method: "POST",
            headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gpt-4o", messages: [
                    { role: "system", content: "You are a data enrichment assistant. Respond with ONLY a valid JSON array. Each object in the array must contain the 'tempId' from the input, and a non-empty 'name'." },
                    { role: "user", content: prompt }
                ], temperature: 0.2, max_tokens: 2500,
            }),
        });
        const openAICallDuration = Date.now() - openAICallStartTime;
        console.log(`[${new Date().toISOString()}] ${invocationId} OpenAI API call finished. Status: ${response.status}, Duration: ${openAICallDuration}ms`);

        if (!response.ok) { /* ... error handling ... */ throw new Error(`OpenAI API Error ${response.status}`); }
        const data = await response.json();
        const aiResponseContent = data.choices?.[0]?.message?.content;

        if (!aiResponseContent) { throw new Error("Empty content in AI response."); }
        
        // ***** CRITICAL LOGGING FOR AI RESPONSE *****
        console.log(`[${new Date().toISOString()}] ${invocationId} RAW AI RESPONSE CONTENT:\n------------\n${aiResponseContent}\n------------`);

        try {
          processedAiOutput = JSON.parse(aiResponseContent);
        } catch (parseError) {
          console.warn(`[${new Date().toISOString()}] ${invocationId} Initial JSON.parse failed. Error: ${parseError.message}. Attempting markdown extraction...`);
          const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              processedAiOutput = JSON.parse(jsonMatch[1]);
              console.log(`[${new Date().toISOString()}] ${invocationId} Successfully parsed JSON from markdown block.`);
            } catch (nestedParseError) {
              console.error(`[${new Date().toISOString()}] ${invocationId} Markdown extraction parse failed: ${nestedParseError.message}`);
              throw new Error("Could not parse JSON from AI response (tried raw & markdown block).");
            }
          } else {
            console.error(`[${new Date().toISOString()}] ${invocationId} No markdown JSON block found after initial parse fail.`);
            throw new Error("AI response not valid JSON, and no markdown block found.");
          }
        }
        
        if (!Array.isArray(processedAiOutput)) {
            console.error(`[${new Date().toISOString()}] ${invocationId} Parsed AI output is not an array. Type: ${typeof processedAiOutput}`);
            throw new Error("AI response, once parsed, was not an array.");
        }
        console.log(`[${new Date().toISOString()}] ${invocationId} AI processing successful. Items received from AI: ${processedAiOutput.length}`);
        if (processedAiOutput.length === 0 && individualsForAI.length > 0) {
             console.warn(`[${new Date().toISOString()}] ${invocationId} AI returned 0 items, but pre-processing had ${individualsForAI.length} items. Check AI's understanding of the prompt and input individualsForAI list.`);
        }
        source = 'ai';

      } catch (aiError) { /* ... fallback logic ... */ }
    }

    // 2. Deterministically build the final FamilyMember[] array
    const finalMembers: FamilyMember[] = [];
    const idMap: Record<string, string> = {}; 

    processedAiOutput.forEach((aiPerson, index) => { /* ... (deterministic structuring as in previous response) ... */ });
    console.log(`[${new Date().toISOString()}] ${invocationId} Deterministic structuring complete. Final members count: ${finalMembers.length}`);

    const treeUuid = crypto.randomUUID(); 
    const responsePayload = { /* ... (construct payload as in previous response, ensuring 'id' and 'source') ... */ };
    // ... (final logging and return as in previous response) ...
    
    // Make sure this part is complete and correct from the previous version
    // For brevity, not repeating the entire deterministic structuring and final response here
    // It should look like the version from 2 responses ago that included BYPASS_AI_FOR_TESTING
    // And ensure final `responsePayload` has top-level `id` and `source`.

    // --- Re-inserting the deterministic structuring and final response payload ---
    // (Copied from the "New Approach" Edge Function provided two responses ago)
    processedAiOutput.forEach((aiPerson, index) => {
        const originalInput = individualsForAI.find(i => i.tempId === aiPerson.tempId);
        if (!originalInput) {
            console.warn(`[${new Date().toISOString()}] ${invocationId} Could not find original input for AI person with tempId: ${aiPerson.tempId}. Skipping.`);
            return;
        }
        
        const memberName = String(aiPerson.name || originalInput.providedName || `Unnamed ${originalInput.role}`);
        const finalId = generateDeterministicId(originalInput.role, memberName, index);
        idMap[aiPerson.tempId] = finalId;

        finalMembers.push({
            id: finalId,
            name: memberName,
            relationship: originalInput.contextualRelationship || "Relative",
            birthYear: aiPerson.birthYear ? String(aiPerson.birthYear) : undefined,
            deathYear: aiPerson.deathYear ? String(aiPerson.deathYear) : undefined,
            generation: 0, 
            parentId: undefined, 
            isElder: originalInput.role === 'clanElder' || (originalInput.role.toLowerCase().includes('grand') && originalInput.role.toLowerCase().includes('parent')),
            gender: aiPerson.gender ? String(aiPerson.gender).toLowerCase() : undefined,
            side: undefined, 
            status: aiPerson.deathYear ? 'deceased' : (String(aiPerson.status || 'living').toLowerCase() as 'living' | 'deceased'),
            photoUrl: undefined,
            notes: aiPerson.notes ? String(aiPerson.notes) : undefined,
        });
    });
    
    finalMembers.forEach(member => {
        const originalInput = individualsForAI.find(i => idMap[i.tempId] === member.id);
        const role = originalInput?.role;

        switch(role) {
            case "mainPerson":
                member.generation = 0; member.relationship = "Self";
                const fatherTempId = individualsForAI.find(i => i.role === "father")?.tempId;
                if (fatherTempId && idMap[fatherTempId]) member.parentId = idMap[fatherTempId];
                break;
            case "father":
                member.generation = -1; member.side = "paternal";
                const pgfTempId = individualsForAI.find(i => i.role === "paternalGrandfather")?.tempId;
                if (pgfTempId && idMap[pgfTempId]) member.parentId = idMap[pgfTempId];
                break;
            case "mother":
                member.generation = -1; member.side = "maternal";
                const mgfTempId = individualsForAI.find(i => i.role === "maternalGrandfather")?.tempId;
                if (mgfTempId && idMap[mgfTempId]) member.parentId = idMap[mgfTempId];
                break;
            case "paternalGrandfather": member.generation = -2; member.side = "paternal"; break;
            case "paternalGrandmother":
                member.generation = -2; member.side = "paternal";
                const paternalGrandfatherTempId = individualsForAI.find(i => i.role === "paternalGrandfather")?.tempId;
                if (paternalGrandfatherTempId && idMap[paternalGrandfatherTempId]) member.parentId = idMap[paternalGrandfatherTempId];
                break;
            case "maternalGrandfather": member.generation = -2; member.side = "maternal"; break;
            case "maternalGrandmother":
                member.generation = -2; member.side = "maternal";
                const maternalGrandfatherTempId = individualsForAI.find(i => i.role === "maternalGrandfather")?.tempId;
                if (maternalGrandfatherTempId && idMap[maternalGrandfatherTempId]) member.parentId = idMap[maternalGrandfatherTempId];
                break;
            case "spouse": member.generation = 0; break;
            case "sibling":
                member.generation = 0;
                const fatherForSiblingTempId = individualsForAI.find(i => i.role === "father")?.tempId;
                if (fatherForSiblingTempId && idMap[fatherForSiblingTempId]) member.parentId = idMap[fatherForSiblingTempId];
                else { 
                    const motherForSiblingTempId = individualsForAI.find(i => i.role === "mother")?.tempId;
                    if (motherForSiblingTempId && idMap[motherForSiblingTempId]) member.parentId = idMap[motherForSiblingTempId];
                }
                break;
            case "child":
                member.generation = 1;
                if (idMap[mainPersonTempId]) member.parentId = idMap[mainPersonTempId];
                break;
            case "clanElder":
                member.generation = -3; member.isElder = true; member.status = 'deceased';
                break;
        }
    });
    console.log(`[${new Date().toISOString()}] ${invocationId} Deterministic structuring complete. Final members count: ${finalMembers.length}`);

    const treeUuid = crypto.randomUUID(); 
    const responsePayload = {
        id: treeUuid, surname, tribe, clan, 
        members: finalMembers, 
        createdAt: new Date().toISOString(), source,
    };

    const functionEndTime = Date.now();
    const functionDuration = functionEndTime - functionStartTime;
    console.log(`[${new Date(functionEndTime).toISOString()}] ${invocationId} Preparing to send response (NEW APPROACH). Duration: ${functionDuration}ms. Payload members: ${responsePayload.members.length}.`);
    if (responsePayload.members.length > 0) {
      console.log(`[${new Date().toISOString()}] ${invocationId} First member in new response:`, JSON.stringify(responsePayload.members[0]));
    } else {
      console.warn(`[${new Date().toISOString()}] ${invocationId} Sending response with ZERO members.`);
    }
    
    if (functionDuration > configuredTimeout - FUNCTION_TIMEOUT_GRACE_PERIOD_MS) { 
        console.warn(`[${new Date().toISOString()}] ${invocationId} Function approaching configured timeout of ${configuredTimeout}ms (duration: ${functionDuration}ms).`);
    }

    return new Response(JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    // --- END Re-inserted logic ---

  } catch (error) { 
    const errorTime = Date.now();
    console.error(`[${new Date(errorTime).toISOString()}] ${invocationId} UNHANDLED error in Edge Function:`, error.message, error.stack ? error.stack.substring(0, 500) : "No stack");
    return new Response(JSON.stringify({ error: error.message || "Unexpected error in Edge Function." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
