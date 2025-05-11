
export type User = {
  id: string;
  email: string;
  role?: 'user' | 'expert' | 'admin';
};

// Form Data Types
export interface TreeFormData {
  surname: string;
  tribe: string;
  clan: string;
  familyName: string; // User's full name
  gender: string; // User's gender
  birthYear?: string; // User's birth year
  birthPlace?: string; // User's birth place
  siblings: SiblingInfo[]; // Array of siblings
  spouse: SpouseInfo; // Spouse information
  selectedElders: string[]; // IDs of selected clan elders
  parents: {
    father: ParentInfo;
    mother: ParentInfo;
  };
  grandparents: {
    paternal: {
      grandfather: ParentInfo;
      grandmother: ParentInfo;
    };
    maternal: {
      grandfather: ParentInfo;
      grandmother: ParentInfo;
    };
  };
  children: ChildInfo[]; // Array of children
}

// Family Tree Types
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthYear?: string;
  deathYear?: string;
  generation: number;
  parentId?: string;
  isElder: boolean;
  gender?: string;
  marriedTo?: string; // ID of spouse
  clanConnectionId?: string; // Reference to a specific clan elder
  side?: 'maternal' | 'paternal';
  status?: 'living' | 'deceased';
}

export type FamilyTree = {
  id: string;
  userId: string;
  surname: string;
  tribe: string;
  clan: string;
  createdAt: string;
  members: FamilyMember[];
};

export interface SiblingInfo {
  name: string;
  gender: string;
  birthYear: string;
  deathYear?: string;
  status?: 'living' | 'deceased';
}

export interface SpouseInfo {
  name: string;
  birthYear: string;
  deathYear?: string;
  status?: 'living' | 'deceased';
}

export interface ParentInfo {
  name: string;
  birthYear: string;
  deathYear?: string;
  status?: 'living' | 'deceased';
}

export interface ChildInfo {
  name: string;
  gender: string;
  birthYear: string;
  deathYear?: string;
  status?: 'living' | 'deceased';
}

export interface Cultural {
  tribe: string;
  clan: string;
  practices: string[];
  ceremonies: string[];
  elders: string[];
}

export interface ElderReference {
  id: string;
  name: string;
  approximateEra: string;
  verificationScore: number;
  familyConnections: string[];
}

export interface RelationshipResult {
  isRelated: boolean;
  relationshipType?: string;
  commonElder?: ElderReference;
  generationalDistance?: number;
  clanContext: string;
  confidenceScore: number;
}

export interface ClanElder {
  id: string;
  name: string;
  approximateEra: string;
  verificationScore: number;
  notes?: string;
  deathYear?: string;
  status?: 'deceased'; // Elders are typically deceased
}

export interface Clan {
  id: string;
  name: string;
  totem?: string;
  origin?: string;
  elders: ClanElder[];
  culturalPractices?: string[];
  historicalNotes?: string[];
}

export interface Tribe {
  id: string;
  name: string;
  region: string;
  population?: string;
  language?: string;
  description: string;
  clans: Clan[];
}

export const DEFAULT_USERS = {
  seeker: {
    username: "DefaultSeeker",
    email: "seeker@famiroots.test",
    password: "Test@2025",
    role: "user",
    permissions: ["view", "create", "connect"]
  },
  expert: {
    username: "DefaultExpert",
    email: "expert@famiroots.test",
    password: "Test@2025",
    role: "expert",
    permissions: ["view", "create", "connect", "verify"]
  },
  admin: {
    username: "DefaultAdmin",
    email: "admin@famiroots.test",
    password: "Test@2025",
    role: "admin",
    permissions: ["all"]
  }
};
