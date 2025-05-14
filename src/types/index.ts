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

export interface TreeFormData {
  surname: string;
  tribe: string;
  clan: string;
  extendedFamily: {
    familyName?: string;
    gender?: string;
    birthYear?: string;
    birthPlace?: string;
    siblings?: Array<{name: string; gender: string; birthYear: string}>;
    spouse?: {name: string; birthYear: string};
    selectedElders?: ElderReference[];
    parents?: {
      father?: {name: string; birthYear: string; deathYear?: string};
      mother?: {name: string; birthYear: string; deathYear?: string};
    };
    grandparents?: {
      paternal?: {
        grandfather?: {name: string; birthYear: string; deathYear?: string};
        grandmother?: {name: string; birthYear: string; deathYear?: string};
      };
      maternal?: {
        grandfather?: {name: string; birthYear: string; deathYear?: string};
        grandmother?: {name: string; birthYear: string; deathYear?: string};
      };
    };
    children?: Array<{name: string; gender: string; birthYear: string}>;
  };
}

export interface ElderReference {
  id: string;
  name: string;
  approximateEra: string;
  familyUnits: string[];
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

// --- New Interface for Tribal Ancestor Information ---
export interface TribalAncestorInfo {
  id: string; // e.g., "TA_baganda", this ID will be used in ClanElder.parentId
  name: string; // e.g., "Kintu, The Progenitor of Baganda"
  approximateEra: string; // e.g., "Ancient Past", "Mythological Era"
  description?: string; // A brief description or story
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
  conceptualAncestor?: TribalAncestorInfo; // <<<< NEW OPTIONAL FIELD
}

export interface Clan {
  id: string;
  name: string;
  tribeId: string;
  tribeName?: string;
  totem?: string;
  description?: string;
  elders?: ClanElder[];
  origin?: string;
  families?: number;
  traditions?: Tradition[];
  culturalPractices?: string[];
  historicalNotes?: string[];
}

export interface ClanElder {
  id: string;
  name: string;
  clanId?: string;
  clanName?: string;
  approximateEra: string;
  birthYear?: string;
  deathYear?: string;
  significance?: string;
  verificationScore: number;
  familyUnits: string[];
  familyConnections?: string[];
  era?: string;
  notes?: string;
  gender?: 'male' | 'female';
  parentId?: string; // Can be ID of another ClanElder or a TribalAncestorInfo.id
  spouseIds?: string[]; // Business rule: IDs should point to elders of a different gender.
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
