
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestData {
  surname: string;
  tribe: string;
  clan: string;
  familyData: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for API key
  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get user ID from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized request' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create Supabase client
    const supabase = createClient(
      supabaseUrl || '',
      supabaseServiceKey || '',
      { auth: { persistSession: false } }
    );
    
    // Validate the token to get userId
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = user.id;
    
    // Parse request body
    const { surname, tribe, clan, ...familyData } = await req.json() as RequestData;

    if (!surname || !tribe || !clan) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: surname, tribe, clan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare user data to send to OpenAI
    const userData = {
      surname,
      tribe,
      clan,
      ...familyData
    };

    console.log("Sending data to OpenAI:", JSON.stringify(userData));

    // Call OpenAI to generate a family tree based on the user's input
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert genealogist specializing in Ugandan family trees and clan structures.
            
            Your task is to create a family tree structure based on the provided information about a user's family.
            
            Follow these strict rules:
            1. ONLY use the information explicitly provided by the user. DO NOT invent or add any fictitious family members.
            2. If a family connection wasn't explicitly mentioned, DO NOT create it.
            3. Use generation numbers to represent the family hierarchy (0 for the main user, -1 for parents, -2 for grandparents, 1 for children).
            4. The response should be a valid JSON object that includes an array of family members, each with unique IDs.
            5. Make the user the central person in the family tree.
            6. Include all relationships that can be directly inferred from the provided data.
            7. Never add placeholder or fictional members. Only include members that were explicitly mentioned in the input data.
            
            Each family member should include:
            - id: a unique string identifier (like "member1", "member2", etc.)
            - name: the person's name as provided in the input
            - relationship: their relationship to the main user (e.g., "self", "father", "paternal grandfather")
            - birthYear: birth year if provided
            - deathYear: death year if provided
            - generation: numeric generation relative to main user (0 for self, -1 for parents, 1 for children, etc.)
            - parentId: the ID of this person's parent in the tree (if applicable)
            - isElder: boolean indicating if this person is a clan elder
            - gender: "male" or "female" if provided
            
            Return only the valid JSON with no additional explanations or text outside the JSON. Make sure to never include invented family members.`
          },
          {
            role: 'user',
            content: `Please create a family tree structure strictly based on only this information, with no invented members: ${JSON.stringify(userData)}`
          }
        ],
        temperature: 0.3,
      }),
    });

    const openAIData = await openAIResponse.json();
    
    // Error handling for OpenAI response
    if (!openAIData.choices || openAIData.choices.length === 0) {
      console.error("Invalid OpenAI response:", openAIData);
      throw new Error("Failed to generate family tree from OpenAI");
    }

    // Parse the OpenAI response to get the family tree structure
    const aiResponseText = openAIData.choices[0].message.content;
    console.log("OpenAI response:", aiResponseText);
    
    let familyTreeData;
    try {
      // Try to parse the response as JSON
      familyTreeData = JSON.parse(aiResponseText);
    } catch (jsonError) {
      console.error("Error parsing AI response:", jsonError);
      
      // Create a default family tree with just the user
      familyTreeData = {
        members: [
          {
            id: "member1",
            name: familyData.familyName || surname,
            relationship: "self",
            generation: 0,
            isElder: false,
            gender: familyData.gender || "unknown"
          }
        ]
      };
    }

    // Create a new family tree record in the database
    const { data: treeData, error: treeError } = await supabase
      .from('family_trees')
      .insert({
        user_id: userId,
        surname,
        tribe,
        clan
      })
      .select()
      .single();
    
    if (treeError) {
      throw new Error(`Failed to create family tree: ${treeError.message}`);
    }
    
    const treeId = treeData.id;
    
    // Insert family members with the tree ID
    const familyMembers = familyTreeData.members.map((member: any) => ({
      family_tree_id: treeId,
      name: member.name,
      relationship: member.relationship,
      birth_year: member.birthYear,
      death_year: member.deathYear,
      generation: member.generation,
      parent_id: member.parentId,
      is_elder: member.isElder,
      gender: member.gender,
      side: member.side
    }));
    
    const { error: membersError } = await supabase
      .from('family_members')
      .insert(familyMembers);
    
    if (membersError) {
      throw new Error(`Failed to create family members: ${membersError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        treeId,
        members: familyTreeData.members
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-family-tree function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        fallback: true,
        treeId: "fallback-tree-id",
        members: [
          {
            id: "member1",
            name: "You",
            relationship: "self",
            generation: 0,
            isElder: false,
            gender: "unknown"
          }
        ]
      }),
      { 
        status: 200, // Return 200 even with fallback data
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
