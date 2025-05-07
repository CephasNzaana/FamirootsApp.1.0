
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    // Get the user's ID from the JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      familyMembers = generateFallbackMembers(surname);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response",
          fallback: true,
          members: familyMembers
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a new family tree in the database
    const { data: familyTree, error: familyTreeError } = await supabaseClient
      .from('family_trees')
      .insert({
        user_id: user.id,
        surname,
        tribe,
        clan
      })
      .select()
      .single();

    if (familyTreeError) {
      console.error("Error creating family tree:", familyTreeError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to save family tree to database",
          message: familyTreeError.message,
          members: familyMembers
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save all family members to the database
    const familyMembersToInsert = familyMembers.map(member => ({
      family_tree_id: familyTree.id,
      name: member.name,
      relationship: member.relationship,
      birth_year: member.birthYear,
      generation: member.generation,
      parent_id: member.parentId
    }));

    const { error: familyMembersError } = await supabaseClient
      .from('family_members')
      .insert(familyMembersToInsert);

    if (familyMembersError) {
      console.error("Error creating family members:", familyMembersError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to save family members to database",
          message: familyMembersError.message,
          members: familyMembers
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        members: familyMembers,
        treeId: familyTree.id
      }),
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
