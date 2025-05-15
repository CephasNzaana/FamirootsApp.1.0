// supabase/functions/analyze-relationships/index.ts

import { serve } from "std/http/server.ts"; // Using import map alias
// import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill likely not needed with modern Deno fetch for OpenAI

// Using new import map aliases
import { ClanElder, Tribe, Clan, FamilyMember as FrontendFamilyMember } from "@/types";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_TIMEOUT_SECONDS_CONFIG = Deno.env.get("FUNCTION_TIMEOUT_SECONDS");
const FUNCTION_TIMEOUT_GRACE_PERIOD_MS = 5000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, restrict this to your frontend's URL
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PersonAnalysisInput {
  name: string;
  tribe?: string;
  clan?: string;
  selectedElderIds?: string[];
}

interface RelationshipAnalysisRequest {
  person1: PersonAnalysisInput;
  person2: PersonAnalysisInput;
}

interface RelationshipAnalysisResponse {
  aiSummary: string;
  potentialRelationshipCategory?: string;
  confidenceScore?: number;
  culturalConsiderations?: string[];
  furtherResearchSuggestions?: string[];
  rawAiResponseForDebugging?: any;
}

const getFullClanElderById = (elderId: string): FullClanElderType | undefined => {
    for (const tribe of ugandaTribesData) {
        for (const clan of tribe.clans) {
            const found = clan.elders?.find(e => e.id === elderId);
            if (found) {
                // Make sure the object returned matches FullClanElderType from your shared types
                const tribeNameForContext = ugandaTribesData.find(t => t.id === clan.tribeId)?.name;
                return { 
                    ...found, 
                    clanName: clan.name, 
                    clanId: clan.id, 
                    tribeName: tribeNameForContext || tribe.name, // Add tribeName if available
                    tribeId: tribe.id 
                } as FullClanElderType;
            }
        }
    }
    return undefined;
};

const getElderContextForPrompt = (elderIds?: string[]): string => {
    if (!elderIds || elderIds.length === 0) return "No specific historical elders provided for context by the user for this individual.";
    
    const contexts: string[] = [];
    for (const id of elderIds.slice(0, 3)) { 
        const elder = getFullClanElderById(id);
        if (elder) {
            let context = `${elder.name} (approx. era: ${elder.approximateEra || elder.era || 'N/A'}, clan: ${elder.clanName || 'N/A'})`;
            if (elder.parentId) {
                const parent = getFullClanElderById(elder.parentId);
                if (parent) {
                    context += `, parent in historical records: ${parent.name}`;
                } else if (elder.parentId.startsWith("TA_")) {
                    const tribeIdForTA = elder.parentId.substring(3);
                    const tribeOfTA = ugandaTribesData.find(t => t.id === tribeIdForTA || t.name.toLowerCase().includes(tribeIdForTA.toLowerCase()));
                    const tribeName = tribeOfTA ? tribeOfTA.name : tribeIdForTA.replace(/_/g, ' ');
                    context += `, descended from Tribal Progenitor of ${tribeName}`;
                } else {
                    context += `, parent ID in records: ${elder.parentId}`;
                }
            }
            contexts.push(context);
        }
    }
    return contexts.length > 0 ? "Associated historical elders: " + contexts.join("; ") : "No specific historical elders processed/found for context for this individual.";
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
    console.error(`[${new Date().toISOString()}] ${invocationId} OpenAI API key not configured on server.`);
    return new Response(JSON.stringify({ error: "AI service not configured." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    if (!req.body) {
        return new Response(JSON.stringify({ error: "Request body is missing." }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    const requestData: RelationshipAnalysisRequest = await req.json();
    const { person1, person2 } = requestData;

    console.log(`[${new Date().toISOString()}] ${invocationId} Received P1: ${person1.name} (Tribe: ${person1.tribe}, Clan: ${person1.clan}), P2: ${person2.name} (Tribe: ${person2.tribe}, Clan: ${person2.clan})`);

    if (!person1?.name?.trim() || !person2?.name?.trim()) {
      return new Response(JSON.stringify({ error: 'Names for both persons are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const person1ElderContext = getElderContextForPrompt(person1.selectedElderIds);
    const person2ElderContext = getElderContextForPrompt(person2.selectedElderIds);

    const prompt = `
You are a genealogical assistant with expertise in Ugandan cultural heritage, kinship systems, and clan exogamy rules.
Analyze the potential familial relationship between Person 1 and Person 2 based on the Ugandan context. Your response should be informative and neutral.

Person 1 Information:
- Name: "${person1.name}"
- Tribe: ${person1.tribe || "Not specified"}
- Clan: ${person1.clan || "Not specified"}
- Associated Historical Elders Context: ${person1ElderContext}

Person 2 Information:
- Name: "${person2.name}"
- Tribe: ${person2.tribe || "Not specified"}
- Clan: ${person2.clan || "Not specified"}
- Associated Historical Elders Context: ${person2ElderContext}

Analysis Task:
1.  Assess the likelihood of a familial relationship (close to distant).
2.  If Person 1 and Person 2 are from the SAME CLAN and SAME TRIBE, explain the cultural implication (e.g., "Individuals from the same clan and tribe are traditionally considered to be of the same lineage, implying close kinship.").
3.  If they belong to the same tribe but different clans, comment on potential distant shared heritage.
4.  If associated historical elders are provided, consider if any known links between these elders (based on the provided context about them or general knowledge if you have it from your training about Ugandan clans) could indicate a connection between Person 1 and Person 2.
5.  Provide a brief summary of your findings.
6.  Suggest what further information or research could clarify the relationship (e.g., specific family details, tracing back more generations, DNA if appropriate).

Output your response as a JSON object with the following structure:
{
  "aiSummary": "string (Overall summary of the potential relationship and its basis)",
  "potentialRelationshipCategory": "string (e.g., 'Same Clan - Strong Kinship Indicated', 'Shared Tribal Heritage - Distant Connection Possible', 'Different Tribal Backgrounds - Relation Unlikely via Clan/Tribe', 'Insufficient Data for Assessment')",
  "confidenceScore": "number (A score from 0.0 to 1.0 representing your confidence in the assessment, where 1.0 is very high)",
  "culturalConsiderations": ["string (Array of 1-2 brief cultural notes, e.g., about clan exogamy if applicable, framed neutrally. E.g., 'Individuals of the same clan are traditionally considered part of one extended family.')"],
  "furtherResearchSuggestions": ["string (Array of 1-2 brief, actionable suggestions for the users, e.g., 'Compare detailed family oral histories.', 'Explore specific elder lineage connections further.')"]
}

Be concise and clear. If data is insufficient for a strong conclusion, state that.
`;

    console.log(`[${new Date().toISOString()}] ${invocationId} Sending prompt to OpenAI for relationship analysis. Prompt length: ${prompt.length}`);
    const openAICallStartTime = Date.now();

    const aiRequestPayload = {
      model: "gpt-4o", 
      messages: [
        { role: "system", content: "You are a genealogical assistant specializing in Ugandan kinship. Respond ONLY with the specified valid JSON object structure." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3, 
      max_tokens: 1000,
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
      throw new Error(`AI service error: ${openaiResponse.status}`);
    }

    const responseData = await openaiResponse.json();
    const aiContent = responseData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("Empty content in AI response.");
    }

    console.log(`[${new Date().toISOString()}] ${invocationId} RAW AI RESPONSE:\n${aiContent}`);
    let parsedAiResponse: RelationshipAnalysisResponse;
    try {
      const aiJsonObject = JSON.parse(aiContent);
      if ('aiSummary' in aiJsonObject && 'potentialRelationshipCategory' in aiJsonObject) {
          parsedAiResponse = aiJsonObject as RelationshipAnalysisResponse;
          parsedAiResponse.rawAiResponseForDebugging = responseData; 
      } else {
          console.error(`[${new Date().toISOString()}] ${invocationId} Parsed AI JSON object does not match expected structure. Object keys:`, Object.keys(aiJsonObject));
          throw new Error("AI response was a JSON object, but not the expected structure.");
      }
    } catch (e) {
      console.error(`[${new Date().toISOString()}] ${invocationId} Failed to parse AI JSON response: ${e.message}. Raw content: ${aiContent}`);
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedAiResponse = JSON.parse(jsonMatch[1]) as RelationshipAnalysisResponse;
          parsedAiResponse.rawAiResponseForDebugging = responseData;
           console.log(`[${new Date().toISOString()}] ${invocationId} Successfully parsed JSON from markdown block.`);
        } catch (nestedError) {
           console.error(`[${new Date().toISOString()}] ${invocationId} Markdown JSON block parse failed: ${nestedError.message}`);
           throw new Error("AI returned an invalid JSON format, even within markdown.");
        }
      } else {
        throw new Error("AI returned an invalid JSON format.");
      }
    }
    
    return new Response(JSON.stringify(parsedAiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ${invocationId} Error in analyze-relationships function:`, error.message, error.stack ? error.stack.substring(0, 800): '');
    return new Response(JSON.stringify({ error: error.message || "Failed to analyze relationship due to an internal error." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
