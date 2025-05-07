
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surname, tribe, clan } = await req.json();
    
    if (!surname || !tribe || !clan) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Generating family tree for surname: ${surname}, tribe: ${tribe}, clan: ${clan}`);
    
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI specialized in African family history and genealogy. Generate realistic family trees based on provided information."
          },
          {
            role: "user",
            content: `Generate a realistic Ugandan family tree for the ${surname} family of the ${tribe} tribe and ${clan} clan. Create 8-12 family members across 3-4 generations, including their relationships, birth years, and generation numbers. Format the response as a JSON array of objects, each with id (UUID), name, relationship, birthYear, generation (number), and parentId (can be null for first generation or reference another member's id for children). No explanations, just the JSON array.`
          }
        ]
      })
    });

    const openAIData = await openAIResponse.json();
    let familyMembers;

    try {
      const contentString = openAIData.choices[0].message.content;
      // Parse the JSON from the response content
      familyMembers = JSON.parse(contentString);
      
      // Ensure it's an array
      if (!Array.isArray(familyMembers)) {
        throw new Error("Response is not an array");
      }
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      console.log("Raw response:", openAIData.choices[0].message.content);
      
      // Return fallback data
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response",
          fallback: true,
          members: generateFallbackMembers(surname)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ members: familyMembers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error generating family tree:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate family tree",
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackMembers(surname: string) {
  return [
    {
      id: crypto.randomUUID(),
      name: `${surname} John`,
      relationship: "Great Grandfather",
      birthYear: "1920",
      generation: 1,
      parentId: null,
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Mary`,
      relationship: "Great Grandmother",
      birthYear: "1925",
      generation: 1,
      parentId: null,
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Robert`,
      relationship: "Grandfather",
      birthYear: "1950",
      generation: 2,
      parentId: null,
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Sarah`,
      relationship: "Grandmother",
      birthYear: "1952",
      generation: 2,
      parentId: null,
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Michael`,
      relationship: "Father",
      birthYear: "1975",
      generation: 3,
      parentId: null,
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Lisa`,
      relationship: "Mother",
      birthYear: "1978",
      generation: 3,
      parentId: null,
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} David`,
      relationship: "Brother",
      birthYear: "2000",
      generation: 4,
      parentId: null,
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Emma`,
      relationship: "Sister",
      birthYear: "2002",
      generation: 4,
      parentId: null,
    },
  ];
}
