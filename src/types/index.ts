
export interface FamilyMember {
  id: string;
  name: string;
  relationship?: string;
  birthYear?: string;
  deathYear?: string;
  generation: number;
  parentId?: string;
  isElder: boolean;
  gender?: string;
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
  extendedFamily?: {
    familyName?: string;
    gender?: string;
    siblings?: Array<{name: string, gender: string, birthYear: string}>;
    spouse?: {name: string, birthYear: string};
    selectedElders?: ElderReference[];
    parents?: {
      father?: {name: string, birthYear: string};
      mother?: {name: string, birthYear: string};
    };
    grandparents?: {
      paternalGrandfather?: {name: string, birthYear: string};
      paternalGrandmother?: {name: string, birthYear: string};
      maternalGrandfather?: {name: string, birthYear: string};
      maternalGrandmother?: {name: string, birthYear: string};
    };
    children?: Array<{name: string, gender: string, birthYear: string}>;
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
