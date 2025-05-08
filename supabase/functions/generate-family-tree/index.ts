
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@4.11.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { surname, tribe, clan } = await req.json();

    // Authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Get user ID from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: userError?.message || 'Failed to authenticate user' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const userId = user.id;

    try {
      // Initialize OpenAI
      const configuration = new Configuration({
        apiKey: openaiApiKey,
      });
      
      const openai = new OpenAIApi(configuration);

      const prompt = `Generate a realistic Ugandan family tree based on the following information:
      
      Surname: ${surname}
      Tribe: ${tribe}
      Clan: ${clan}

      Create a family tree with multiple generations including:
      
      1. At least 2-3 elders who are the ancestral figures of the clan
      2. Several branches of the family with different relationships (parents, children, siblings, cousins)
      3. Include traditional Ugandan naming conventions appropriate for the specific tribe
      4. Include some birth years for context (between 1900-2010)
      5. Structure the family across 3-4 generations with clear parent-child relationships
      6. Make sure each person has a "relationship" description (e.g., "Father", "Maternal Grandmother", "Eldest Son")

      Please return the family tree as a JSON array with this exact format for each family member:
      [
        {
          "id": "unique-string", // A unique string ID for each person
          "name": "Full Name",
          "relationship": "Father/Mother/etc",
          "birthYear": "YYYY", // Optional, can be null
          "generation": 1, // Number indicating generation (1 for oldest, 2 for their children, etc)
          "parentId": "parent-unique-string", // ID of parent, null for first generation
          "isElder": true/false // Whether this person is considered a clan elder
        },
        ...more family members
      ]

      Only return valid JSON with no additional text or explanations. The array should be culturally appropriate and accurate to Ugandan ${tribe} tribal traditions and ${clan} clan customs.`;
      
      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {"role": "system", "content": "You are an expert in Ugandan family structures, tribal customs, and clan traditions. You create accurate family trees based on tribal and clan customs."},
          {"role": "user", "content": prompt}
        ],
      });

      let familyTreeData;
      
      try {
        // Try to parse the OpenAI response
        const responseText = completion.data.choices[0].message?.content || '';
        familyTreeData = JSON.parse(responseText);
        
        // Basic validation to ensure it's an array of family members
        if (!Array.isArray(familyTreeData)) {
          throw new Error('Response is not an array');
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        
        // Use fallback data
        familyTreeData = generateFallbackFamilyTree(surname, tribe, clan);
        
        // Insert family tree into database with fallback flag
        const { data: treeData, error: treeError } = await supabaseAdmin
          .from('family_trees')
          .insert({
            user_id: userId,
            surname,
            tribe,
            clan,
            members: familyTreeData,
            fallback: true
          })
          .select()
          .single();
          
        if (treeError) {
          throw treeError;
        }

        return new Response(
          JSON.stringify({ 
            members: familyTreeData, 
            treeId: treeData.id,
            fallback: true 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Insert family tree into database
      const { data: treeData, error: treeError } = await supabaseAdmin
        .from('family_trees')
        .insert({
          user_id: userId,
          surname,
          tribe,
          clan,
          members: familyTreeData
        })
        .select()
        .single();
        
      if (treeError) {
        throw treeError;
      }

      // Return the generated family tree
      return new Response(
        JSON.stringify({ 
          members: familyTreeData, 
          treeId: treeData.id 
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
      
    } catch (error) {
      console.error('Error generating family tree:', error);
      
      // Use fallback data
      const fallbackData = generateFallbackFamilyTree(surname, tribe, clan);
      
      // Insert fallback family tree into database
      const { data: treeData, error: treeError } = await supabaseAdmin
        .from('family_trees')
        .insert({
          user_id: userId,
          surname,
          tribe,
          clan,
          members: fallbackData,
          fallback: true
        })
        .select()
        .single();
        
      if (treeError) {
        throw treeError;
      }

      return new Response(
        JSON.stringify({ 
          members: fallbackData, 
          treeId: treeData.id,
          fallback: true 
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

// Fallback function to generate a basic family tree when OpenAI fails
function generateFallbackFamilyTree(surname: string, tribe: string, clan: string) {
  // Create some culturally appropriate first names based on tribe
  const maleNames = {
    "Baganda": ["Mukasa", "Ssentamu", "Muwonge", "Kiwanuka", "Ssekitoleko"],
    "Banyankole": ["Tumusiime", "Asiimwe", "Twinamatsiko", "Mugisha", "Turyatemba"],
    "Basoga": ["Waiswa", "Isabirye", "Kirunda", "Balikowa", "Ngobi"],
    "default": ["John", "Robert", "David", "Michael", "James"]
  };
  
  const femaleNames = {
    "Baganda": ["Nakato", "Namugwanya", "Nansubuga", "Nalweyiso", "Namuddu"],
    "Banyankole": ["Kyomuhendo", "Atuhaire", "Ninsiima", "Kemigisha", "Komugisha"],
    "Basoga": ["Namukose", "Nabirye", "Nawudo", "Naigaga", "Nabiryo"],
    "default": ["Mary", "Sarah", "Ruth", "Rebecca", "Elizabeth"]
  };
  
  // Get tribe-specific names or default if tribe not found
  const maleNamesForTribe = maleNames[tribe] || maleNames.default;
  const femaleNamesForTribe = femaleNames[tribe] || femaleNames.default;
  
  // Random name selection functions
  const getRandomMaleName = () => maleNamesForTribe[Math.floor(Math.random() * maleNamesForTribe.length)];
  const getRandomFemaleName = () => femaleNamesForTribe[Math.floor(Math.random() * femaleNamesForTribe.length)];
  
  // Generate a random year between min and max
  const randomYear = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Create the family tree structure
  return [
    // First generation (grandparents)
    {
      id: "elder-1",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Clan Elder (Paternal Grandfather)",
      birthYear: randomYear(1900, 1930).toString(),
      generation: 1,
      parentId: null,
      isElder: true
    },
    {
      id: "elder-wife",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Paternal Grandmother",
      birthYear: randomYear(1905, 1935).toString(),
      generation: 1,
      parentId: null,
      isElder: false
    },
    {
      id: "elder-2",
      name: `${getRandomMaleName()} Mutabazi`,
      relationship: "Clan Elder (Maternal Grandfather)",
      birthYear: randomYear(1905, 1935).toString(),
      generation: 1,
      parentId: null,
      isElder: true
    },
    {
      id: "elder-2-wife",
      name: `${getRandomFemaleName()} Mutabazi`,
      relationship: "Maternal Grandmother",
      birthYear: randomYear(1910, 1940).toString(),
      generation: 1,
      parentId: null,
      isElder: false
    },
    
    // Second generation (parents)
    {
      id: "father",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Father",
      birthYear: randomYear(1940, 1960).toString(),
      generation: 2,
      parentId: "elder-1",
      isElder: false
    },
    {
      id: "mother",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Mother",
      birthYear: randomYear(1945, 1965).toString(),
      generation: 2,
      parentId: "elder-2",
      isElder: false
    },
    {
      id: "uncle-1",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Paternal Uncle",
      birthYear: randomYear(1942, 1962).toString(),
      generation: 2,
      parentId: "elder-1",
      isElder: false
    },
    {
      id: "aunt-1",
      name: `${getRandomFemaleName()} Kalema`,
      relationship: "Paternal Aunt",
      birthYear: randomYear(1944, 1964).toString(),
      generation: 2,
      parentId: "elder-1",
      isElder: false
    },
    
    // Third generation (self, siblings, cousins)
    {
      id: "self",
      name: `${surname}`,
      relationship: "Self",
      birthYear: randomYear(1970, 1990).toString(),
      generation: 3,
      parentId: "father",
      isElder: false
    },
    {
      id: "brother",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Brother",
      birthYear: randomYear(1972, 1992).toString(),
      generation: 3,
      parentId: "father",
      isElder: false
    },
    {
      id: "sister",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Sister",
      birthYear: randomYear(1974, 1994).toString(),
      generation: 3,
      parentId: "father",
      isElder: false
    },
    {
      id: "cousin-1",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Cousin (Paternal)",
      birthYear: randomYear(1971, 1991).toString(),
      generation: 3,
      parentId: "uncle-1",
      isElder: false
    },
    {
      id: "cousin-2",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Cousin (Paternal)",
      birthYear: randomYear(1973, 1993).toString(),
      generation: 3,
      parentId: "uncle-1",
      isElder: false
    },
    
    // Fourth generation (children)
    {
      id: "child-1",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Son",
      birthYear: randomYear(1995, 2010).toString(),
      generation: 4,
      parentId: "self",
      isElder: false
    },
    {
      id: "child-2",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Daughter",
      birthYear: randomYear(1997, 2012).toString(),
      generation: 4,
      parentId: "self",
      isElder: false
    },
    {
      id: "nephew",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Nephew",
      birthYear: randomYear(1996, 2011).toString(),
      generation: 4,
      parentId: "brother",
      isElder: false
    },
    {
      id: "niece",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Niece",
      birthYear: randomYear(1998, 2013).toString(),
      generation: 4,
      parentId: "sister",
      isElder: false
    }
  ];
}
