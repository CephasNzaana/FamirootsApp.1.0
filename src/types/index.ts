
export type User = {
  id: string;
  email: string;
  role?: 'user' | 'expert' | 'admin';
};

export type TreeFormData = {
  surname: string;
  tribe: string;
  clan: string;
};

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  birthYear?: string;
  generation: number;
  parentId?: string | null;
  isElder?: boolean;
};

export type FamilyTree = {
  id: string;
  userId: string;
  surname: string;
  tribe: string;
  clan: string;
  createdAt: string;
  members: FamilyMember[];
};

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
