
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
  familyName: string; // New field for user's full name
  gender: string; // New field for user's gender
  side: 'maternal' | 'paternal'; // Which side of family to focus on
  siblings: SiblingInfo[]; // Array of siblings
  spouse: SpouseInfo; // Spouse information
  selectedElders: string[]; // IDs of selected clan elders
}

// Family Tree Types
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthYear?: string;
  generation: number;
  parentId?: string;
  isElder: boolean;
  gender?: string; // Added gender field
  marriedTo?: string; // ID of spouse
  clanConnectionId?: string; // Reference to a specific clan elder
  side?: 'maternal' | 'paternal'; // Which side of family
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
}

export interface SpouseInfo {
  name: string;
  birthYear: string;
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
