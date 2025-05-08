
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

export const DEFAULT_USERS = {
  seeker: {
    username: "DefaultSeeker",
    password: "Test@2025",
    role: "user",
    permissions: ["view", "create", "connect"]
  },
  expert: {
    username: "DefaultExpert",
    password: "Test@2025",
    role: "expert",
    permissions: ["view", "create", "connect", "verify"]
  },
  admin: {
    username: "DefaultAdmin",
    password: "Test@2025",
    role: "admin",
    permissions: ["all"]
  }
};
