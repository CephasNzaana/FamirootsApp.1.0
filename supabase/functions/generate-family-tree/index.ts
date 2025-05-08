
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
            content: `You are an AI specialized in Ugandan family history, tribal structures, and clan systems. 
            You have deep knowledge about how Ugandan family trees are organized, including:
            - The importance of clan elders and their role as ancestral anchors
            - The proper naming conventions for different tribes
            - How family relationships are structured within clans
            - Traditional roles and relationships in Ugandan family systems
            
            Focus on creating historically plausible and culturally accurate family trees.`
          },
          {
            role: "user",
            content: `Generate a detailed Ugandan family tree for the ${surname} family of the ${tribe} tribe and ${clan} clan.
            
            Create 10-15 family members across 3-4 generations, including:
            - Proper relationship designations according to ${tribe} cultural norms
            - Historically appropriate birth years (1920-2010)
            - Generation numbers (starting with 1 for oldest)
            - Clear parent-child relationships with parentId references
            - At least 1-2 clan elders of significance
            - Typical naming patterns for the ${tribe} tribe
            
            Format the response as a JSON array of objects, each with:
            - id (UUID)  
            - name (following ${tribe} naming conventions)
            - relationship (in English, but culturally appropriate)
            - birthYear (string)  
            - generation (number)
            - parentId (null for first generation, or reference to another member's id)
            - isElder (boolean, true for significant clan elders)
            
            Return ONLY the JSON array with no explanations or additional text.`
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
      
      // Validate the structure of family members
      familyMembers = familyMembers.map(member => {
        // Ensure all required fields are present
        return {
          id: member.id || crypto.randomUUID(),
          name: member.name || `${surname} Unknown`,
          relationship: member.relationship || "Unknown",
          birthYear: member.birthYear || "Unknown",
          generation: member.generation || 1,
          parentId: member.parentId || null,
          isElder: member.isElder || false
        };
      });
      
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      console.log("Raw response:", openAIData.choices[0].message.content);
      
      // Return fallback data
      familyMembers = generateFallbackMembers(surname, tribe, clan);
      
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
      parent_id: member.parentId,
      is_elder: member.isElder || false
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

function generateFallbackMembers(surname: string, tribe: string, clan: string) {
  // Create more culturally appropriate fallback data
  const currentYear = new Date().getFullYear();
  const elderGeneration = currentYear - 90; // Elders born around 90 years ago
  const parentGeneration = currentYear - 60; // Parents born around 60 years ago
  const adultGeneration = currentYear - 35; // Adults born around 35 years ago
  const youngGeneration = currentYear - 15; // Young people born around 15 years ago
  
  const elder1Id = crypto.randomUUID();
  const elder2Id = crypto.randomUUID();
  const parent1Id = crypto.randomUUID();
  const parent2Id = crypto.randomUUID();
  const adult1Id = crypto.randomUUID();
  
  return [
    {
      id: elder1Id,
      name: `${surname} Mukasa`,
      relationship: "Clan Elder",
      birthYear: elderGeneration.toString(),
      generation: 1,
      parentId: null,
      isElder: true
    },
    {
      id: elder2Id,
      name: `${surname} Nakami`,
      relationship: "Elder's Spouse",
      birthYear: (elderGeneration + 2).toString(),
      generation: 1,
      parentId: null,
      isElder: false
    },
    {
      id: parent1Id,
      name: `${surname} Kato`,
      relationship: "Family Head",
      birthYear: parentGeneration.toString(),
      generation: 2,
      parentId: elder1Id,
      isElder: false
    },
    {
      id: parent2Id,
      name: `${surname} Nantongo`,
      relationship: "Family Head's Spouse",
      birthYear: (parentGeneration + 3).toString(),
      generation: 2,
      parentId: null,
      isElder: false
    },
    {
      id: adult1Id,
      name: `${surname} Wasswa`,
      relationship: "First Born Son",
      birthYear: adultGeneration.toString(),
      generation: 3,
      parentId: parent1Id,
      isElder: false
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Nakato`,
      relationship: "First Born Daughter",
      birthYear: (adultGeneration + 2).toString(),
      generation: 3,
      parentId: parent1Id,
      isElder: false
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Kizza`,
      relationship: "Second Born Son",
      birthYear: (adultGeneration + 4).toString(),
      generation: 3,
      parentId: parent1Id,
      isElder: false
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Babirye`,
      relationship: "Third Born Daughter",
      birthYear: (adultGeneration + 6).toString(),
      generation: 3,
      parentId: parent1Id,
      isElder: false
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Okello`,
      relationship: "First Grandchild",
      birthYear: youngGeneration.toString(),
      generation: 4,
      parentId: adult1Id,
      isElder: false
    },
    {
      id: crypto.randomUUID(),
      name: `${surname} Auma`,
      relationship: "Second Grandchild",
      birthYear: (youngGeneration + 2).toString(),
      generation: 4,
      parentId: adult1Id,
      isElder: false
    }
  ];
}
