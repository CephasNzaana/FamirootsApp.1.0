// supabase/functions/analyze-relationships/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill if needed by dependencies

// Assuming your types and data are in a shared directory accessible by Edge Functions
// Adjust the path as per your project structure.
// You might need to create a supabase/_shared/ directory and place these files there,
// or ensure your import map in supabase/config.toml handles these paths.
import { ClanElder, Tribe, Clan } from "../_shared/types.ts"; // Example path
import { ugandaTribesData } from "../_shared/ugandaTribesData.ts"; // Example path

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_TIMEOUT_SECONDS_CONFIG = Deno.env.get("FUNCTION_TIMEOUT_SECONDS");
const FUNCTION_TIMEOUT_GRACE_PERIOD_MS = 5000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Use your specific frontend URL in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PersonAnalysisInput {
  name: string;
  tribe?: string;
  clan?: string;
  selectedElderIds?: string[]; // IDs of FullClanElderType
  // Optional: If person is from user's tree, their known relationship to proband in that tree
  // knownRelationshipToProband?: string; 
  // birthYear?: string; // Could be useful context for AI
}

interface RelationshipAnalysisRequest {
  person1: PersonAnalysisInput;
  person2: PersonAnalysisInput;
  // You could also pass any preliminary findings from the client-side rule-based check
  // ruleBasedPreliminaryFindings?: string; 
}

interface RelationshipAnalysisResponse {
  aiSummary: string;
  potentialRelationshipCategory?: string; // e.g., "Possible Clan Kinship", "Shared Tribal Heritage", "Low Likelihood of Close Relation"
  confidenceScore?: number; // AI's confidence (0-1), if it can provide one
  culturalConsiderations?: string[];
  furtherResearchSuggestions?: string[];
  rawAiResponse?: any; // Optional: for debugging
}

const getFullClanElderById = (elderId: string): FullClanElderType | undefined => {
    for (const tribe of ugandaTribesData) {
        for (const clan of tribe.clans) {
            const found = clan.elders?.find(e => e.id === elderId);
            if (found) return { ...found, clanName: clan.name, tribeId: tribe.id, tribeName: tribe.name };
        }
    }
    return undefined;
};

// Helper to get some ancestral context for selected elders
const getElderContext = (elderIds?: string[]): string => {
    if (!elderIds || elderIds.length === 0) return "No specific historical elders provided for context.";
    
    const contexts: string[] = [];
    for (const id of elderIds.slice(0, 3)) { // Limit to 3 elders for brevity in prompt
        const elder = getFullClanElderById(id);
        if (elder) {
            let context = `${elder.name} (approx. era: ${elder.approximateEra || elder.era || 'N/A'}, clan: ${elder.clanName || 'N/A'})`;
            if (elder.parentId) {
                const parent = getFullClanElderById(elder.parentId);
                if (parent) {
                    context += `, parent in historical records: ${parent.name}`;
                } else if (elder.parentId.startsWith("TA_")) {
                    const tribeId = elder.parentId.substring(3);
                    const tribeName = ugandaTribesData.find(t => t.id === tribeId)?.name || tribeId.replace(/_/g, ' ');
                    context += `, descended from Tribal Progenitor of ${tribeName}`;
                }
            }
            contexts.push(context);
        }
    }
    return contexts.length > 0 ? "Associated historical elders: " + contexts.join("; ") : "No specific historical elders processed for context.";
};


serve(async (req: Request) => {
  const functionStartTime = Date.now();
  const configuredTimeout = FUNCTION_TIMEOUT_SECONDS_CONFIG ? parseInt(FUNCTION_TIMEOUT_SECONDS_CONFIG) * 1000 : 55000;
  const invocationId = `fn_${functionStartTime % 100000}`;
  console.log(`[${new Date().toISOString()}] ${invocationId} analyze-relationships invoked. Method: ${req.method}.`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    console.error(`[${new Date().toISOString()}] ${invocationId} OpenAI API key not configured.`);
    return new Response(JSON.stringify({ error: "AI service not configured on server." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const requestData: RelationshipAnalysisRequest = await req.json();
    const { person1, person2 } = requestData;

    console.log(`[${new Date().toISOString()}] ${invocationId} Received P1: ${person1.name}, P2: ${person2.name}`);

    if (!person1?.name || !person2?.name) {
      return new Response(JSON.stringify({ error: 'Names for both persons are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const person1ElderContext = getElderContext(person1.selectedElderIds);
    const person2ElderContext = getElderContext(person2.selectedElderIds);

    const prompt = `
You are a genealogical assistant with expertise in Ugandan cultural heritage, kinship systems, and clan structures.
Your task is to analyze the potential relationship between two individuals based on the information provided.
Provide your analysis in a neutral, informative tone. Focus on likelihoods and cultural contexts. Avoid definitive statements about marriage suitability unless it's a direct and widely known cultural absolute (e.g., same immediate clan).

Person 1:
- Name: ${person1.name}
- Tribe: ${person1.tribe || "Not specified"}
- Clan: ${person1.clan || "Not specified"}
- Associated Historical Elders Context: ${person1ElderContext}

Person 2:
- Name: ${person2.name}
- Tribe: ${person2.tribe || "Not specified"}
- Clan: ${person2.clan || "Not specified"}
- Associated Historical Elders Context: ${person2ElderContext}

Analysis Task:
1.  Assess the likelihood of a familial relationship (close to distant).
2.  If they belong to the same clan and tribe, explain the cultural implication (e.g., "Individuals from the same clan and tribe are traditionally considered to be of the same lineage, implying close kinship.").
3.  If they belong to the same tribe but different clans, comment on potential distant shared heritage.
4.  If associated historical elders are provided, consider if any known links between these elders (based on the provided context about them or general knowledge if you have it from your training about Ugandan clans) could indicate a connection between Person 1 and Person 2.
5.  Provide a brief summary of your findings.
6.  Suggest what further information or research could clarify the relationship (e.g., specific family details, tracing back more generations, DNA if appropriate).

Output your response as a JSON object with the following structure:
{
  "aiSummary": "string (Overall summary of the potential relationship and its basis)",
  "potentialRelationshipCategory": "string (e.g., 'Same Clan - Close Kinship Likely', 'Shared Tribal Heritage - Distant', 'Unlikely Direct Relation', 'Insufficient Data for Assessment')",
  "confidenceScore": "number (A score from 0.0 to 1.0 representing your confidence in the assessment, where 1.0 is very high)",
  "culturalConsiderations": ["string (Array of brief cultural notes, e.g., about clan exogamy if applicable)"],
  "furtherResearchSuggestions": ["string (Array of suggestions for the users)"]
}

Be concise and clear. If data is insufficient for a strong conclusion, state that.
`;

    console.log(`[${new Date().toISOString()}] ${invocationId} Sending prompt to OpenAI for relationship analysis. Prompt length: ${prompt.length}`);
    const openAICallStartTime = Date.now();

    const aiRequestPayload = {
      model: "gpt-4o", // Or "gpt-3.5-turbo" for faster/cheaper, or your preferred model
      messages: [
        { role: "system", content: "You are a genealogical assistant specializing in Ugandan kinship. Respond with ONLY a valid JSON object matching the specified output structure." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4, // Moderately deterministic
      max_tokens: 800,  // Adjust as needed
      response_format: { type: "json_object" }
    };

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(aiRequestPayload),
    });
    const openAICallDuration = Date.now() - openAICallStartTime;
    console.log(`[${new Date().toISOString()}] ${invocationId} OpenAI API call finished. Status: ${openaiResponse.status}, Duration: ${openAICallDuration}ms`);

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      console.error(`[${new Date().toISOString()}] ${invocationId} OpenAI API Error ${openaiResponse.status}: ${errorBody}`);
      throw new Error(`AI service error: ${openaiResponse.status} ${errorBody}`);
    }

    const responseData = await openaiResponse.json();
    const aiContent = responseData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("Empty content in AI response.");
    }

    console.log(`[${new Date().toISOString()}] ${invocationId} RAW AI RESPONSE:\n${aiContent}`);
    let parsedAiResponse: RelationshipAnalysisResponse;
    try {
      parsedAiResponse = JSON.parse(aiContent);
    } catch (e) {
      console.error(`[${new Date().toISOString()}] ${invocationId} Failed to parse AI JSON response: ${e.message}. Raw content: ${aiContent}`);
      throw new Error("AI returned an invalid JSON format.");
    }
    
    // You might want to add your rule-based findings to the notes or combine confidence scores here
    // For now, we are primarily returning the AI's direct structured output.

    return new Response(JSON.stringify(parsedAiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ${invocationId} Error in analyze-relationships function:`, error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Failed to analyze relationship due to an internal error." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
