// src/types.ts

export interface FamilyMember {
  id: string;
  name: string;
  relationship?: string;
  birthYear?: string;
  deathYear?: string;
  generation: number;
  parentId?: string;
  spouseId?: string; // Business rule: if populated, represents a spouse of a different gender.
  isElder: boolean;
  gender?: 'male' | 'female';
  side?: 'maternal' | 'paternal';
  status: 'living' | 'deceased';
  photoUrl?: string;
}

export interface FamilyTree {
  id: string;
  userId: string;
  surname: string;
  tribe: string;
  clan: string;
  createdAt: string;
  members: FamilyMember[];
}

export interface ElderReference { // This type is for storing a reference to a selected elder
  id: string;
  name: string;
  approximateEra: string;
  familyUnits: string[]; // Kept as per your original type
  // You might add clanId and tribeId here if it simplifies data passing
}

export interface TreeFormData {
  surname: string;
  tribe: string; // Main tribe affiliation of the family/user
  clan: string;  // Main clan affiliation of the family/user
  extendedFamily: {
    familyName?: string; // Main person's name
    gender?: string;     // Main person's gender (form input type)
    birthYear?: string;
    birthPlace?: string;
    notes?: string; 
    
    siblings?: Array<{name: string; gender: string; birthYear?: string; notes?: string}>;
    spouse?: {name: string; birthYear?: string; gender?: string; notes?: string};
    children?: Array<{name: string; gender: string; birthYear?: string; notes?: string}>;
    
    parents?: {
      father?: {name: string; birthYear?: string; deathYear?: string; notes?: string};
      mother?: {name: string; birthYear?: string; deathYear?: string; notes?: string};
    };
    grandparents?: {
      paternal?: {
        grandfather?: {name: string; birthYear?: string; deathYear?: string; notes?: string};
        grandmother?: {name: string; birthYear?: string; deathYear?: string; notes?: string};
      };
      maternal?: {
        grandfather?: {name: string; birthYear?: string; deathYear?: string; notes?: string};
        grandmother?: {name: string; birthYear?: string; deathYear?: string; notes?: string};
      };
    };

    // --- Updated Elder Lineage Connection ---
    // Paternal Lineage Elder Connection (Optional)
    paternalLineageElderTribe?: string;
    paternalLineageElderClan?: string;
    paternalLineageElderRef?: ElderReference; // Stores the selected paternal elder

    // Maternal Lineage Elder Connection (Optional)
    maternalLineageElderTribe?: string;
    maternalLineageElderClan?: string;
    maternalLineageElderRef?: ElderReference; // Stores the selected maternal elder
    
    // Optional: General notable elders (if still needed, separate from direct lineage)
    // associatedNotableElders?: ElderReference[]; 

    // Aunts/Uncles
    paternalAuntsUncles?: Array<{ name: string; gender: string; birthYear?: string; notes?: string }>;
    maternalAuntsUncles?: Array<{ name: string; gender: string; birthYear?: string; notes?: string }>;
  };
}


export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  tribe?: string;
  clan?: string;
  birthYear?: string;
  birthPlace?: string;
  biography?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  photoUrl?: string;
  biography?: string;
  birthYear?: string;
  birthPlace?: string;
  tribe?: string;
  clan?: string;
}

export interface DNATestResult {
  id: string;
  userId: string;
  dateSubmitted: string;
  status: 'ordered' | 'received' | 'processing' | 'completed';
  ethnicityBreakdown?: Record<string, number>;
}

export interface TribalAncestorInfo {
  id: string; 
  name: string; 
  approximateEra: string; 
  description?: string; 
  notes?: string;
}

export interface Tribe {
  id: string;
  name: string;
  region: string;
  population: string | number;
  description: string;
  clans: Clan[];
  traditions?: Tradition[];
  conceptualAncestor?: TribalAncestorInfo; 
}

export interface Clan {
  id: string;
  name: string;
  tribeId: string; // Link back to Tribe
  tribeName?: string; // Denormalized for convenience
  totem?: string;
  description?: string;
  elders?: ClanElder[]; // Uses the full ClanElder type
  origin?: string;
  families?: number;
  traditions?: Tradition[];
  culturalPractices?: string[];
  historicalNotes?: string[];
}

export interface ClanElder { // This is the full elder data structure from ugandaTribesData
  id: string;
  name: string;
  clanId?: string; // The ID of the clan this elder belongs to
  clanName?: string; // The name of the clan this elder belongs to
  approximateEra: string;
  birthYear?: string; // Kept as string, consistent with FamilyMember
  deathYear?: string; // Kept as string
  significance?: string;
  verificationScore: number;
  familyUnits: string[];
  familyConnections?: string[];
  era?: string; // Can be same as approximateEra or more specific
  notes?: string;
  gender?: 'male' | 'female';
  parentId?: string; 
  spouseIds?: string[]; 
}

export interface Tradition {
  id: string;
  name: string;
  description: string;
  associatedWith: 'tribe' | 'clan' | 'both';
  tribeId?: string;
  clanId?: string;
  category: 'ceremony' | 'ritual' | 'practice' | 'story' | 'other';
  importance: 'critical' | 'major' | 'significant' | 'minor';
  stillPracticed: boolean;
}
