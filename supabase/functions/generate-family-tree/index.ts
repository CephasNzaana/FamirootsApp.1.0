
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { OpenAI } from "https://esm.sh/openai@4.11.0";

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
    const { surname, tribe, clan, familyName, gender, side, siblings, spouse, selectedElders } = await req.json();

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
    console.log("Authenticated user:", userId);

    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: openaiApiKey
      });

      // Build a prompt with all the information we have
      let prompt = `Generate a realistic Ugandan family tree based on the following information:
      
      Surname: ${surname}
      Tribe: ${tribe}
      Clan: ${clan}
      User's Name: ${familyName || surname}
      User's Gender: ${gender || "male"}
      Family Side: ${side || "paternal"}`;

      // Add siblings information if available
      if (siblings && siblings.length > 0) {
        prompt += `\n\nSiblings:`;
        siblings.forEach((sibling: any, index: number) => {
          if (sibling.name) {
            prompt += `\n${index + 1}. ${sibling.name} (${sibling.gender}, born: ${sibling.birthYear || "unknown"})`;
          }
        });
      }
      
      // Add spouse information if available
      if (spouse && spouse.name) {
        prompt += `\n\nSpouse: ${spouse.name} (born: ${spouse.birthYear || "unknown"})`;
      }
      
      // Add selected elders if available
      if (selectedElders && selectedElders.length > 0) {
        prompt += `\n\nThe family is connected to these clan elders (use these as ancestral points):`;
        selectedElders.forEach((elderId: string) => {
          prompt += `\n- Elder ID: ${elderId}`;
        });
      }

      prompt += `\n\nCreate a family tree with multiple generations including:
      
      1. The user (${familyName}) should be included in the tree as an important node
      2. Include the siblings and spouse exactly as provided
      3. Include at least 2-3 elders who are the ancestral figures of the clan
      4. Several branches of the family with different relationships (parents, children, siblings, cousins)
      5. Include traditional Ugandan naming conventions appropriate for the specific tribe
      6. Include birth years for context (between 1900-2010)
      7. Include death years for some deceased family members
      8. Structure the family across 3-4 generations with clear parent-child relationships
      9. Make sure each person has a "relationship" description (e.g., "Father", "Maternal Grandmother", "Eldest Son")
      10. Create logical family connections, not just based on similar names

      Please return the family tree as a JSON array with this exact format for each family member:
      [
        {
          "id": "unique-string", // A unique string ID for each person
          "name": "Full Name",
          "relationship": "Father/Mother/etc",
          "birthYear": "YYYY", // Optional, can be null
          "deathYear": "YYYY", // Optional, for deceased members
          "generation": 1, // Number indicating generation (1 for oldest, 2 for their children, etc)
          "parentId": "parent-unique-string", // ID of parent, null for first generation
          "isElder": true/false, // Whether this person is considered a clan elder
          "gender": "male/female", // Gender of the person
          "side": "maternal/paternal" // Which side of the family
        },
        ...more family members
      ]

      Only return valid JSON with no additional text or explanations. The array should be culturally appropriate and accurate to Ugandan ${tribe} tribal traditions and ${clan} clan customs.`;

      console.log("Calling OpenAI to generate family tree");
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using a faster model
        messages: [
          {"role": "system", "content": "You are an expert in Ugandan family structures, tribal customs, and clan traditions. You create accurate family trees based on tribal and clan customs."},
          {"role": "user", "content": prompt}
        ],
        temperature: 0.7,
      });

      console.log("OpenAI API response received");
      let familyTreeData;
      
      try {
        // Try to parse the OpenAI response
        const responseText = completion.choices[0].message.content || '';
        console.log("Response content preview:", responseText.substring(0, 100) + "...");
        
        // Clean the response text to ensure it's valid JSON
        const jsonText = responseText.trim().replace(/```json|```/g, '');
        familyTreeData = JSON.parse(jsonText);
        
        // Basic validation to ensure it's an array of family members
        if (!Array.isArray(familyTreeData)) {
          throw new Error('Response is not an array');
        }
        
        // Ensure the current user is in the tree
        const userInTree = familyTreeData.some(member => 
          member.name.toLowerCase().includes(familyName.toLowerCase()) || 
          member.relationship.toLowerCase() === "self"
        );
        
        if (!userInTree && familyName) {
          // If user is not in the tree, add them
          const userGeneration = Math.max(...familyTreeData.map(m => m.generation)) - 1;
          const possibleParentIds = familyTreeData
            .filter(m => m.generation === userGeneration - 1)
            .map(m => m.id);
          
          const parentId = possibleParentIds.length > 0 ? possibleParentIds[0] : undefined;
          
          familyTreeData.push({
            id: "user-self",
            name: familyName,
            relationship: "Self",
            birthYear: (new Date().getFullYear() - 30).toString(), // Approximate
            generation: userGeneration,
            parentId: parentId,
            isElder: false,
            gender: gender || "male",
            side: side || "paternal"
          });
        }
        
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        
        // Use fallback data
        familyTreeData = generateFallbackFamilyTree(
          surname, 
          tribe, 
          clan, 
          familyName, 
          gender, 
          siblings, 
          spouse, 
          side
        );
        console.log("Using fallback data due to parse error");
      }

      console.log("Inserting tree into database with normalized schema");
      // Insert family tree into database - modified to work with actual schema
      const { data: treeData, error: treeError } = await supabaseAdmin
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
        throw treeError;
      }

      // Insert family members
      for (const member of familyTreeData) {
        const { error: memberError } = await supabaseAdmin
          .from('family_members')
          .insert({
            family_tree_id: treeData.id,
            name: member.name,
            relationship: member.relationship,
            birth_year: member.birthYear,
            death_year: member.deathYear,
            generation: member.generation,
            parent_id: member.parentId,
            is_elder: member.isElder || false,
            gender: member.gender,
            side: member.side
          });
          
        if (memberError) {
          console.error('Error inserting family member:', memberError);
        }
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
      const fallbackData = generateFallbackFamilyTree(
        surname, 
        tribe, 
        clan, 
        familyName, 
        gender, 
        siblings, 
        spouse, 
        side
      );
      
      // Insert fallback family tree into database - modified to work with actual schema
      const { data: treeData, error: treeError } = await supabaseAdmin
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
        throw treeError;
      }

      // Insert family members
      for (const member of fallbackData) {
        await supabaseAdmin
          .from('family_members')
          .insert({
            family_tree_id: treeData.id,
            name: member.name,
            relationship: member.relationship,
            birth_year: member.birthYear,
            death_year: member.deathYear || null,
            generation: member.generation,
            parent_id: member.parentId,
            is_elder: member.isElder || false,
            gender: member.gender || (member.relationship.includes("Mother") || 
                   member.relationship.includes("Sister") || 
                   member.relationship.includes("Daughter") || 
                   member.relationship.includes("Aunt") || 
                   member.relationship.includes("Grandmother") ? "female" : "male"),
            side: member.side || "paternal"
          });
      }

      return new Response(
        JSON.stringify({ 
          members: fallbackData, 
          treeId: treeData.id,
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
function generateFallbackFamilyTree(
  surname: string, 
  tribe: string, 
  clan: string, 
  familyName?: string, 
  gender?: string,
  siblings?: any[],
  spouse?: any,
  side?: string
) {
  // Create some culturally appropriate first names based on tribe
  const maleNames = {
    "Baganda": ["Mukasa", "Ssentamu", "Muwonge", "Kiwanuka", "Ssekitoleko"],
    "Banyankole": ["Tumusiime", "Asiimwe", "Twinamatsiko", "Mugisha", "Turyatemba"],
    "Basoga": ["Waiswa", "Isabirye", "Kirunda", "Balikowa", "Ngobi"],
    "Bakiga": ["Byaruhanga", "Tumwebaze", "Kamugisha", "Turyamureeba", "Turinawe"],
    "default": ["John", "Robert", "David", "Michael", "James"]
  };
  
  const femaleNames = {
    "Baganda": ["Nakato", "Namugwanya", "Nansubuga", "Nalweyiso", "Namuddu"],
    "Banyankole": ["Kyomuhendo", "Atuhaire", "Ninsiima", "Kemigisha", "Komugisha"],
    "Basoga": ["Namukose", "Nabirye", "Nawudo", "Naigaga", "Nabiryo"],
    "Bakiga": ["Kyomugisha", "Atwine", "Kebirungi", "Kobusingye", "Kenyangi"],
    "default": ["Mary", "Sarah", "Ruth", "Rebecca", "Elizabeth"]
  };
  
  // Get tribe-specific names or default if tribe not found
  const maleNamesForTribe = maleNames[tribe as keyof typeof maleNames] || maleNames.default;
  const femaleNamesForTribe = femaleNames[tribe as keyof typeof femaleNames] || femaleNames.default;
  
  // Random name selection functions
  const getRandomMaleName = () => maleNamesForTribe[Math.floor(Math.random() * maleNamesForTribe.length)];
  const getRandomFemaleName = () => femaleNamesForTribe[Math.floor(Math.random() * femaleNamesForTribe.length)];
  
  // Generate a random year between min and max
  const randomYear = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const randomDeathYear = (birthYear: string | undefined, probability: number) => {
    if (!birthYear || Math.random() > probability) return undefined;
    const birthYearNum = parseInt(birthYear);
    if (isNaN(birthYearNum)) return undefined;
    const minDeathAge = 50;
    const maxDeathAge = 90;
    const deathYear = birthYearNum + Math.floor(Math.random() * (maxDeathAge - minDeathAge)) + minDeathAge;
    return deathYear > new Date().getFullYear() ? undefined : deathYear.toString();
  };
  
  // Create the family tree structure
  const familyTree = [
    // First generation (grandparents)
    {
      id: "elder-1",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Clan Elder (Paternal Grandfather)",
      birthYear: randomYear(1900, 1930).toString(),
      deathYear: randomYear(1970, 1990).toString(),
      generation: 1,
      parentId: null,
      isElder: true,
      gender: "male",
      side: "paternal"
    },
    {
      id: "elder-wife",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Paternal Grandmother",
      birthYear: randomYear(1905, 1935).toString(),
      deathYear: randomYear(1975, 1995).toString(),
      generation: 1,
      parentId: null,
      isElder: false,
      gender: "female",
      side: "paternal"
    },
    {
      id: "elder-2",
      name: `${getRandomMaleName()} Mutabazi`,
      relationship: "Clan Elder (Maternal Grandfather)",
      birthYear: randomYear(1905, 1935).toString(),
      deathYear: randomYear(1975, 1995).toString(),
      generation: 1,
      parentId: null,
      isElder: true,
      gender: "male",
      side: "maternal"
    },
    {
      id: "elder-2-wife",
      name: `${getRandomFemaleName()} Mutabazi`,
      relationship: "Maternal Grandmother",
      birthYear: randomYear(1910, 1940).toString(),
      deathYear: randomYear(1980, 2000).toString(),
      generation: 1,
      parentId: null,
      isElder: false,
      gender: "female",
      side: "maternal"
    },
    
    // Second generation (parents)
    {
      id: "father",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Father",
      birthYear: randomYear(1940, 1960).toString(),
      deathYear: randomDeathYear(randomYear(1940, 1960).toString(), 0.3),
      generation: 2,
      parentId: "elder-1",
      isElder: false,
      gender: "male",
      side: "paternal"
    },
    {
      id: "mother",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Mother",
      birthYear: randomYear(1945, 1965).toString(),
      deathYear: randomDeathYear(randomYear(1945, 1965).toString(), 0.2),
      generation: 2,
      parentId: "elder-2",
      isElder: false,
      gender: "female",
      side: "maternal"
    },
    {
      id: "uncle-1",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Paternal Uncle",
      birthYear: randomYear(1942, 1962).toString(),
      deathYear: randomDeathYear(randomYear(1942, 1962).toString(), 0.3),
      generation: 2,
      parentId: "elder-1",
      isElder: false,
      gender: "male",
      side: "paternal"
    },
    {
      id: "aunt-1",
      name: `${getRandomFemaleName()} Kalema`,
      relationship: "Paternal Aunt",
      birthYear: randomYear(1944, 1964).toString(),
      deathYear: randomDeathYear(randomYear(1944, 1964).toString(), 0.2),
      generation: 2,
      parentId: "elder-1",
      isElder: false,
      gender: "female",
      side: "paternal"
    },
  ];
  
  // Add the self user
  const userEntry = {
    id: "self",
    name: familyName || `${surname}`,
    relationship: "Self",
    birthYear: randomYear(1970, 1990).toString(),
    generation: 3,
    parentId: "father",
    isElder: false,
    gender: gender || "male",
    side: side || "paternal"
  };
  familyTree.push(userEntry);
  
  // Add siblings if provided
  if (siblings && siblings.length > 0) {
    siblings.forEach((sibling, index) => {
      if (sibling.name) {
        familyTree.push({
          id: `sibling-${index + 1}`,
          name: sibling.name,
          relationship: sibling.gender === "female" ? "Sister" : "Brother",
          birthYear: sibling.birthYear || randomYear(1965, 1995).toString(),
          deathYear: sibling.deathYear,
          generation: 3,
          parentId: "father",
          isElder: false,
          gender: sibling.gender || "male",
          side: side || "paternal"
        });
      }
    });
  } else {
    // Add default siblings
    familyTree.push({
      id: "brother",
      name: `${getRandomMaleName()} ${surname}`,
      relationship: "Brother",
      birthYear: randomYear(1972, 1992).toString(),
      generation: 3,
      parentId: "father",
      isElder: false,
      gender: "male",
      side: side || "paternal"
    });
    
    familyTree.push({
      id: "sister",
      name: `${getRandomFemaleName()} ${surname}`,
      relationship: "Sister",
      birthYear: randomYear(1974, 1994).toString(),
      generation: 3,
      parentId: "father",
      isElder: false,
      gender: "female",
      side: side || "paternal"
    });
  }
  
  // Add spouse if provided
  if (spouse && spouse.name) {
    familyTree.push({
      id: "spouse",
      name: spouse.name,
      relationship: gender === "female" ? "Husband" : "Wife",
      birthYear: spouse.birthYear || randomYear(1970, 1990).toString(),
      deathYear: spouse.deathYear,
      generation: 3, // Same generation as self
      parentId: null, // No parent in this tree
      isElder: false,
      gender: gender === "female" ? "male" : "female", // Opposite of self
      side: "marriage"
    });
  }
  
  // Add cousins, children, and other relatives to complete the tree
  familyTree.push({
    id: "cousin-1",
    name: `${getRandomMaleName()} ${surname}`,
    relationship: "Cousin (Paternal)",
    birthYear: randomYear(1971, 1991).toString(),
    generation: 3,
    parentId: "uncle-1",
    isElder: false,
    gender: "male",
    side: "paternal"
  });
  
  familyTree.push({
    id: "cousin-2",
    name: `${getRandomFemaleName()} ${surname}`,
    relationship: "Cousin (Paternal)",
    birthYear: randomYear(1973, 1993).toString(),
    generation: 3,
    parentId: "uncle-1",
    isElder: false,
    gender: "female",
    side: "paternal"
  });
  
  // Add children
  familyTree.push({
    id: "child-1",
    name: `${getRandomMaleName()} ${surname}`,
    relationship: "Son",
    birthYear: randomYear(1995, 2010).toString(),
    generation: 4,
    parentId: "self",
    isElder: false,
    gender: "male",
    side: side || "paternal"
  });
  
  familyTree.push({
    id: "child-2",
    name: `${getRandomFemaleName()} ${surname}`,
    relationship: "Daughter",
    birthYear: randomYear(1997, 2012).toString(),
    generation: 4,
    parentId: "self",
    isElder: false,
    gender: "female",
    side: side || "paternal"
  });
  
  // Add nieces and nephews
  familyTree.push({
    id: "nephew",
    name: `${getRandomMaleName()} ${surname}`,
    relationship: "Nephew",
    birthYear: randomYear(1996, 2011).toString(),
    generation: 4,
    parentId: "brother",
    isElder: false,
    gender: "male",
    side: side || "paternal"
  });
  
  familyTree.push({
    id: "niece",
    name: `${getRandomFemaleName()} ${surname}`,
    relationship: "Niece",
    birthYear: randomYear(1998, 2013).toString(),
    generation: 4,
    parentId: "sister",
    isElder: false,
    gender: "female",
    side: side || "paternal"
  });
  
  return familyTree;
}
