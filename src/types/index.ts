
export type User = {
  id: string;
  email: string;
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
