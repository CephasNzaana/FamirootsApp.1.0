
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TreeFormData {
  surname: string;
  tribe: string;
  clan: string;
  familyName?: string;
  gender?: string;
  extendedFamily?: any;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthYear?: string;
  deathYear?: string;
  generation: number;
  parentId?: string;
  isElder: boolean;
  gender?: string;
  side?: 'maternal' | 'paternal';
  status: 'living' | 'deceased';
}

interface FamilyTree {
  id: string;
  userId: string;
  surname: string;
  tribe: string;
  clan: string;
  members: FamilyMember[];
}

// Fallback data in case API fails
const fallbackMembers: FamilyMember[] = [
  {
    id: "self-1",
    name: "Cephas Nzaana",
    relationship: "self",
    birthYear: "1997",
    generation: 0,
    isElder: false,
    status: "living",
    gender: "male",
  },
  {
    id: "father-1",
    name: "Henry Turihaihi Nzaana",
    relationship: "father",
    birthYear: "1969",
    generation: -1,
    parentId: "grandfather-1",
    isElder: false,
    status: "living",
    gender: "male",
    side: "paternal",
  },
  {
    id: "mother-1",
    name: "Emily Ndyagumanawe",
    relationship: "mother",
    birthYear: "1973",
    deathYear: "2016",
    generation: -1,
    parentId: "grandmother-2",
    isElder: false,
    status: "deceased",
    gender: "female",
    side: "maternal",
  },
  {
    id: "grandfather-1",
    name: "Fredrick Nzaana",
    relationship: "grandfather",
    birthYear: "1945",
    deathYear: "2005",
    generation: -2,
    isElder: true,
    status: "deceased",
    gender: "male",
    side: "paternal",
  },
  {
    id: "grandmother-1",
    name: "Zeridah",
    relationship: "grandmother",
    birthYear: "1948",
    deathYear: "2010",
    generation: -2,
    isElder: false,
    status: "deceased",
    gender: "female",
    side: "paternal",
  },
  {
    id: "grandfather-2",
    name: "Kanoni",
    relationship: "grandfather",
    birthYear: "1950",
    deathYear: "2012",
    generation: -2,
    isElder: true,
    status: "deceased",
    gender: "male",
    side: "maternal",
  },
  {
    id: "grandmother-2",
    name: "Lillian",
    relationship: "grandmother",
    birthYear: "1952",
    generation: -2,
    isElder: false,
    status: "living",
    gender: "female",
    side: "maternal",
  },
  {
    id: "sibling-1",
    name: "Patrick Mugisha",
    relationship: "brother",
    birthYear: "1995",
    generation: 0,
    parentId: "father-1",
    isElder: false,
    status: "living",
    gender: "male",
  },
  {
    id: "sibling-2",
    name: "Grace Kyohairwe",
    relationship: "sister",
    birthYear: "2000",
    generation: 0,
    parentId: "father-1",
    isElder: false,
    status: "living",
    gender: "female",
  },
  {
    id: "uncle-1",
    name: "Moses Tusiime",
    relationship: "uncle",
    birthYear: "1972",
    generation: -1,
    parentId: "grandfather-1",
    isElder: false,
    status: "living",
    gender: "male",
    side: "paternal",
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the form data from the request
    const { surname, tribe, clan } = await req.json();

    if (!surname || !tribe || !clan) {
      return new Response(
        JSON.stringify({ error: 'Missing required form data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let members: FamilyMember[] = [];
    let fallback = false;

    try {
      if (!OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured.");
      }

      // Create a prompt for the AI
      const prompt = `Generate family tree data for a Ugandan family with the surname ${surname} from the ${tribe} tribe and ${clan} clan.
        The family tree should include at least 10 family members across 3 generations, with:
        - A main person at generation 0
        - Parents at generation -1
        - Grandparents at generation -2
        - Siblings at generation 0
        - Some may have children at generation 1
        - Some elders (mark isElder as true) who are respected in the clan
        
        For each member include:
        - Unique id
        - Full name (appropriate Ugandan names)
        - Relationship to main person (father, mother, brother, sister, etc.)
        - Birth year (between 1930-2005)
        - Death year for deceased members (leave empty for living)
        - Generation number (negative for ancestors, 0 for main person and siblings, positive for descendants)
        - Parent ID reference where appropriate
        - Whether they are a clan elder (isElder)
        - Gender (male/female)
        - Side (maternal/paternal) where applicable
        - Status (living/deceased)
        
        Return ONLY valid JSON that I can parse directly. Format it as an array of family member objects.`;

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a family tree generator for Ugandan families. Return only valid JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        members = JSON.parse(jsonString);
        
        // Validate the structure of the returned data
        if (!Array.isArray(members) || members.length === 0) {
          throw new Error("Invalid response format from AI");
        }
        
        // Ensure all required fields are present
        members = members.map(member => ({
          id: member.id || `member-${Math.random().toString(36).substr(2, 9)}`,
          name: member.name || "Unknown",
          relationship: member.relationship || "",
          birthYear: member.birthYear || undefined,
          deathYear: member.deathYear || undefined,
          generation: member.generation || 0,
          parentId: member.parentId || undefined,
          isElder: member.isElder || false,
          gender: member.gender || undefined,
          side: member.side as 'maternal' | 'paternal' | undefined,
          status: member.deathYear ? 'deceased' : 'living'
        }));
      } else {
        throw new Error("Could not extract JSON from AI response");
      }
    } catch (aiError) {
      console.error("Error generating family tree with AI:", aiError);
      
      // Use fallback data
      members = fallbackMembers;
      fallback = true;
      
      // Adjust fallback data to match request
      members = members.map(member => {
        if (member.relationship === 'self') {
          return { ...member, name: `${surname} ${member.name.split(' ')[0]}` };
        }
        return member;
      });
    }

    // Generate a unique ID for the tree
    const treeId = crypto.randomUUID();

    // Return the generated family tree
    return new Response(
      JSON.stringify({
        treeId,
        surname,
        tribe,
        clan,
        members,
        fallback,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-family-tree function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
