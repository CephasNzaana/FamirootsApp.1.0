
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

export const ugandaTribesData: Tribe[] = [
  {
    id: "baganda",
    name: "Baganda",
    region: "Central Uganda",
    population: "5.5 million",
    language: "Luganda",
    description: "The Baganda are the largest ethnic group in Uganda, making up approximately 16% of the population. They are known for their rich cultural heritage and sophisticated political organization under the Kabaka (king).",
    clans: [
      {
        id: "ffumbe",
        name: "Ffumbe (Lung Fish Clan)",
        totem: "Lung Fish",
        origin: "The clan originated from Ssese Islands on Lake Victoria",
        elders: [
          {
            id: "walusimbi",
            name: "Walusimbi",
            approximateEra: "18th century",
            verificationScore: 95,
            notes: "One of the most respected clan heads in Buganda kingdom history"
          },
          {
            id: "kaboggoza",
            name: "Kaboggoza",
            approximateEra: "19th century",
            verificationScore: 90
          }
        ],
        culturalPractices: [
          "Clan members traditionally avoid eating lungfish",
          "Responsible for fishing and water activities in traditional Buganda"
        ]
      },
      {
        id: "ngonge",
        name: "Ngonge (Otter Clan)",
        totem: "Otter",
        elders: [
          {
            id: "kayima",
            name: "Kayima",
            approximateEra: "Late 18th century",
            verificationScore: 88
          },
          {
            id: "luswaata",
            name: "Luswaata",
            approximateEra: "Early 19th century",
            verificationScore: 85
          }
        ]
      },
      {
        id: "nnyonyi",
        name: "Nnyonyi (Bird Clan)",
        totem: "Bird",
        elders: [
          {
            id: "mukiibi",
            name: "Mukiibi",
            approximateEra: "19th century",
            verificationScore: 92
          }
        ]
      },
      {
        id: "mmamba",
        name: "Mmamba (Lungfish Clan)",
        totem: "Lungfish",
        elders: [
          {
            id: "lwomwa",
            name: "Lwomwa",
            approximateEra: "19th century",
            verificationScore: 89
          }
        ]
      },
      {
        id: "butiko",
        name: "Butiko (Mushroom Clan)",
        totem: "Mushroom",
        elders: [
          {
            id: "namukadde",
            name: "Namukadde",
            approximateEra: "18th century",
            verificationScore: 86
          }
        ]
      }
    ]
  },
  {
    id: "banyankole",
    name: "Banyankole",
    region: "Western Uganda",
    population: "3.0 million",
    language: "Runyankole",
    description: "The Banyankole are cattle herders and farmers from western Uganda, known for their long-horned Ankole cattle and complex social structure with two main social classes: the Bahima (pastoralists) and Bairu (agriculturalists).",
    clans: [
      {
        id: "bashambo",
        name: "Bashambo",
        totem: "Lion",
        elders: [
          {
            id: "kahinda",
            name: "Kahinda",
            approximateEra: "19th century",
            verificationScore: 90
          },
          {
            id: "rutahaba",
            name: "Rutahaba",
            approximateEra: "Early 20th century",
            verificationScore: 87
          }
        ],
        culturalPractices: ["Traditional cattle keeping", "Complex marriage ceremonies"]
      },
      {
        id: "bahinda",
        name: "Bahinda",
        totem: "Monkey",
        elders: [
          {
            id: "mbaguta",
            name: "Mbaguta",
            approximateEra: "Late 19th century",
            verificationScore: 94,
            notes: "Key figure in Ankole kingdom history"
          }
        ]
      },
      {
        id: "bagahe",
        name: "Bagahe",
        totem: "Buffalo",
        elders: [
          {
            id: "kihembe",
            name: "Kihembe",
            approximateEra: "19th century",
            verificationScore: 85
          }
        ]
      }
    ]
  },
  {
    id: "basoga",
    name: "Basoga",
    region: "Eastern Uganda",
    population: "2.7 million",
    language: "Lusoga",
    description: "The Basoga are the third largest ethnic group in Uganda. They are known for their agricultural practices and unique political organization of multiple chiefdoms.",
    clans: [
      {
        id: "balamogi",
        name: "Balamogi",
        elders: [
          {
            id: "namutamba",
            name: "Namutamba",
            approximateEra: "19th century",
            verificationScore: 87
          }
        ]
      },
      {
        id: "bagabula",
        name: "Bagabula",
        totem: "Leopard",
        elders: [
          {
            id: "ngobi",
            name: "Ngobi",
            approximateEra: "Late 19th century",
            verificationScore: 89
          },
          {
            id: "lubogo",
            name: "Lubogo",
            approximateEra: "Early 20th century",
            verificationScore: 92,
            notes: "Significant contributor to Basoga cultural preservation"
          }
        ]
      }
    ]
  },
  {
    id: "banyoro",
    name: "Banyoro",
    region: "Western Uganda",
    population: "1.1 million",
    language: "Runyoro",
    description: "The Banyoro people established one of the most powerful kingdoms in East Africa. They are known for their monarchy, the Bunyoro-Kitara Kingdom.",
    clans: [
      {
        id: "babito",
        name: "Babito",
        totem: "Crested Crane",
        elders: [
          {
            id: "kabalega",
            name: "Omukama Kabalega",
            approximateEra: "19th century",
            verificationScore: 96,
            notes: "Legendary king who resisted colonial rule"
          }
        ],
        culturalPractices: ["Advanced iron working", "Traditional medicine"]
      },
      {
        id: "babiito",
        name: "Babiito",
        totem: "Lion",
        elders: [
          {
            id: "byabacwezi",
            name: "Byabacwezi",
            approximateEra: "18th century",
            verificationScore: 85
          }
        ]
      }
    ]
  },
  {
    id: "iteso",
    name: "Iteso",
    region: "Eastern Uganda",
    population: "3.6 million",
    language: "Ateso",
    description: "The Iteso are the second largest ethnic group in Uganda. They are primarily agriculturalists, growing crops like millet, sorghum, and sweet potatoes.",
    clans: [
      {
        id: "ikaribwok",
        name: "Ikaribwok",
        elders: [
          {
            id: "emudong",
            name: "Emudong",
            approximateEra: "Early 20th century",
            verificationScore: 83
          }
        ]
      },
      {
        id: "ingoratok",
        name: "Ingoratok",
        elders: [
          {
            id: "okalany",
            name: "Okalany",
            approximateEra: "19th century",
            verificationScore: 84
          }
        ]
      }
    ]
  },
  {
    id: "acholi",
    name: "Acholi",
    region: "Northern Uganda",
    population: "1.7 million",
    language: "Acholi",
    description: "The Acholi people are known for their rich oral traditions, poetry, music, and dance. Historically, they have been organized into chiefdoms.",
    clans: [
      {
        id: "payira",
        name: "Payira",
        elders: [
          {
            id: "awich",
            name: "Rwot Awich",
            approximateEra: "Late 19th century",
            verificationScore: 91,
            notes: "Important leader during colonial period"
          }
        ],
        culturalPractices: ["Traditional justice system (Mato Oput)", "Rich oral poetry"]
      },
      {
        id: "patiko",
        name: "Patiko",
        elders: [
          {
            id: "olanya",
            name: "Olanya",
            approximateEra: "19th century",
            verificationScore: 86
          }
        ]
      }
    ]
  },
  {
    id: "bakiga",
    name: "Bakiga",
    region: "Southwestern Uganda",
    population: "1.7 million",
    language: "Rukiga",
    description: "The Bakiga are known as 'people of the mountains' due to their home in the highlands of southwestern Uganda. They have traditionally been known for their egalitarian social organization.",
    clans: [
      {
        id: "abagahe",
        name: "Abagahe",
        elders: [
          {
            id: "makobore",
            name: "Makobore",
            approximateEra: "Early 20th century",
            verificationScore: 88
          }
        ]
      },
      {
        id: "abaheesi",
        name: "Abaheesi",
        elders: [
          {
            id: "karwemera",
            name: "Karwemera",
            approximateEra: "20th century",
            verificationScore: 85
          }
        ]
      }
    ]
  },
  {
    id: "lugbara",
    name: "Lugbara",
    region: "Northwestern Uganda",
    population: "1.0 million",
    language: "Lugbara",
    description: "The Lugbara inhabit the northwestern corner of Uganda. Their society is patrilineal and organized around a segmentary lineage system.",
    clans: [
      {
        id: "maracha",
        name: "Maracha",
        elders: [
          {
            id: "drajoa",
            name: "Drajoa",
            approximateEra: "Early 20th century",
            verificationScore: 82
          }
        ]
      }
    ]
  },
  {
    id: "banyarwanda",
    name: "Banyarwanda",
    region: "Southwestern Uganda",
    population: "0.8 million",
    language: "Kinyarwanda",
    description: "The Banyarwanda in Uganda share cultural ties with people from Rwanda. They are primarily divided into three social groups: Hutu, Tutsi, and Twa.",
    clans: [
      {
        id: "abega",
        name: "Abega",
        elders: [
          {
            id: "kanyarengwe",
            name: "Kanyarengwe",
            approximateEra: "20th century",
            verificationScore: 80
          }
        ]
      }
    ]
  }
];
