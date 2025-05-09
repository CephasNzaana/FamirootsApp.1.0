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
          },
          {
            id: "ssentamu",
            name: "Ssentamu",
            approximateEra: "Mid-19th century",
            verificationScore: 87,
            notes: "Known for establishing important fishing traditions"
          },
          {
            id: "lubega",
            name: "Lubega",
            approximateEra: "Late 19th century",
            verificationScore: 84
          },
          {
            id: "wasswa",
            name: "Wasswa",
            approximateEra: "Early 20th century",
            verificationScore: 89,
            notes: "Helped preserve clan customs during colonial period"
          },
          {
            id: "kyewalabye",
            name: "Kyewalabye",
            approximateEra: "Mid-20th century",
            verificationScore: 91
          },
          {
            id: "ssemaganda",
            name: "Ssemaganda",
            approximateEra: "Mid-18th century",
            verificationScore: 82
          },
          {
            id: "nsubuga",
            name: "Nsubuga",
            approximateEra: "Early 19th century",
            verificationScore: 86
          },
          {
            id: "mulumba",
            name: "Mulumba",
            approximateEra: "Late 19th century",
            verificationScore: 85
          },
          {
            id: "sembuusi",
            name: "Sembuusi",
            approximateEra: "Early 20th century",
            verificationScore: 88
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
          },
          {
            id: "ssebuggwawo",
            name: "Ssebuggwawo",
            approximateEra: "Mid-19th century",
            verificationScore: 83
          },
          {
            id: "namisango",
            name: "Namisango",
            approximateEra: "Late 19th century",
            verificationScore: 87,
            notes: "First female elder recognized in the clan"
          },
          {
            id: "katende",
            name: "Katende",
            approximateEra: "Early 20th century",
            verificationScore: 89
          },
          {
            id: "nankinga",
            name: "Nankinga",
            approximateEra: "Mid-20th century",
            verificationScore: 84
          },
          {
            id: "musambwa",
            name: "Musambwa",
            approximateEra: "18th century",
            verificationScore: 80
          },
          {
            id: "kalungi",
            name: "Kalungi",
            approximateEra: "Mid-19th century",
            verificationScore: 82
          },
          {
            id: "bbosa",
            name: "Bbosa",
            approximateEra: "Late 19th century",
            verificationScore: 85
          },
          {
            id: "kinene",
            name: "Kinene",
            approximateEra: "Early 20th century",
            verificationScore: 86
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
          },
          {
            id: "nampijja",
            name: "Nampijja",
            approximateEra: "Late 19th century",
            verificationScore: 87
          },
          {
            id: "kibuuka",
            name: "Kibuuka",
            approximateEra: "Early 20th century",
            verificationScore: 85,
            notes: "Known for preserving bird clan rituals"
          },
          {
            id: "ssenkungu",
            name: "Ssenkungu",
            approximateEra: "Mid-20th century",
            verificationScore: 89
          },
          {
            id: "kazibwe",
            name: "Kazibwe",
            approximateEra: "Early 19th century",
            verificationScore: 83
          },
          {
            id: "kakeeto",
            name: "Kakeeto",
            approximateEra: "Mid-19th century",
            verificationScore: 86
          },
          {
            id: "ntambi",
            name: "Ntambi",
            approximateEra: "Late 19th century",
            verificationScore: 84
          },
          {
            id: "namulondo",
            name: "Namulondo",
            approximateEra: "Early 20th century",
            verificationScore: 88
          },
          {
            id: "mugagga",
            name: "Mugagga",
            approximateEra: "Mid-20th century",
            verificationScore: 82
          },
          {
            id: "ssemanda",
            name: "Ssemanda",
            approximateEra: "Late 20th century",
            verificationScore: 81
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
          },
          {
            id: "namubiru",
            name: "Namubiru",
            approximateEra: "Late 19th century",
            verificationScore: 86
          },
          {
            id: "ssalongo",
            name: "Ssalongo",
            approximateEra: "Early 20th century",
            verificationScore: 88
          },
          {
            id: "nalwoga",
            name: "Nalwoga",
            approximateEra: "Mid-20th century",
            verificationScore: 85
          },
          {
            id: "kigozi",
            name: "Kigozi",
            approximateEra: "Early 19th century",
            verificationScore: 83
          },
          {
            id: "bbumba",
            name: "Bbumba",
            approximateEra: "Mid-19th century",
            verificationScore: 87
          },
          {
            id: "kawuki",
            name: "Kawuki",
            approximateEra: "Late 19th century",
            verificationScore: 84
          },
          {
            id: "ssebutembe",
            name: "Ssebutembe",
            approximateEra: "Early 20th century",
            verificationScore: 82
          },
          {
            id: "kirigwajjo",
            name: "Kirigwajjo",
            approximateEra: "Mid-20th century",
            verificationScore: 80
          },
          {
            id: "magoba",
            name: "Magoba",
            approximateEra: "Late 20th century",
            verificationScore: 79
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
          },
          {
            id: "kisitu",
            name: "Kisitu",
            approximateEra: "Early 19th century",
            verificationScore: 84
          },
          {
            id: "kasozi",
            name: "Kasozi",
            approximateEra: "Mid-19th century",
            verificationScore: 87
          },
          {
            id: "nakayiza",
            name: "Nakayiza",
            approximateEra: "Late 19th century",
            verificationScore: 85
          },
          {
            id: "ssempala",
            name: "Ssempala",
            approximateEra: "Early 20th century",
            verificationScore: 83
          },
          {
            id: "nakabugo",
            name: "Nakabugo",
            approximateEra: "Mid-20th century",
            verificationScore: 82
          },
          {
            id: "lukwago",
            name: "Lukwago",
            approximateEra: "18th century",
            verificationScore: 80
          },
          {
            id: "ssekamwa",
            name: "Ssekamwa",
            approximateEra: "Early 19th century",
            verificationScore: 81
          },
          {
            id: "najjemba",
            name: "Najjemba",
            approximateEra: "Late 19th century",
            verificationScore: 79
          },
          {
            id: "ssebugwawo",
            name: "Ssebugwawo",
            approximateEra: "Early 20th century",
            verificationScore: 78
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
          },
          {
            id: "okello",
            name: "Okello",
            approximateEra: "Early 20th century",
            verificationScore: 88
          },
          {
            id: "ocen",
            name: "Ocen",
            approximateEra: "Mid-20th century",
            verificationScore: 86
          },
          {
            id: "labongo",
            name: "Labongo",
            approximateEra: "18th century",
            verificationScore: 85,
            notes: "Legendary ancestral figure"
          },
          {
            id: "ongom",
            name: "Ongom",
            approximateEra: "Early 19th century",
            verificationScore: 84
          },
          {
            id: "akena",
            name: "Akena",
            approximateEra: "Mid-19th century",
            verificationScore: 87
          },
          {
            id: "acaye",
            name: "Acaye",
            approximateEra: "Late 19th century",
            verificationScore: 83
          },
          {
            id: "lamony",
            name: "Lamony",
            approximateEra: "Early 20th century",
            verificationScore: 82
          },
          {
            id: "akera",
            name: "Akera",
            approximateEra: "Mid-20th century",
            verificationScore: 81
          },
          {
            id: "odong",
            name: "Odong",
            approximateEra: "Late 20th century",
            verificationScore: 80
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
          },
          {
            id: "opiyo",
            name: "Opiyo",
            approximateEra: "Late 19th century",
            verificationScore: 84
          },
          {
            id: "otim",
            name: "Otim",
            approximateEra: "Early 20th century",
            verificationScore: 85
          },
          {
            id: "abonga",
            name: "Abonga",
            approximateEra: "Mid-20th century",
            verificationScore: 82
          },
          {
            id: "lakony",
            name: "Lakony",
            approximateEra: "Early 19th century",
            verificationScore: 83
          },
          {
            id: "amone",
            name: "Amone",
            approximateEra: "Mid-19th century",
            verificationScore: 81
          },
          {
            id: "alanyo",
            name: "Alanyo",
            approximateEra: "Late 19th century",
            verificationScore: 80,
            notes: "Female elder respected for conflict resolution"
          },
          {
            id: "laker",
            name: "Laker",
            approximateEra: "Early 20th century",
            verificationScore: 79
          },
          {
            id: "ojok",
            name: "Ojok",
            approximateEra: "Mid-20th century",
            verificationScore: 78
          },
          {
            id: "obwona",
            name: "Obwona",
            approximateEra: "Late 20th century",
            verificationScore: 77
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
          },
          {
            id: "mugyenyi",
            name: "Mugyenyi",
            approximateEra: "Mid-19th century",
            verificationScore: 85
          },
          {
            id: "byaruhanga",
            name: "Byaruhanga",
            approximateEra: "Late 19th century",
            verificationScore: 88
          },
          {
            id: "rukara",
            name: "Rukara",
            approximateEra: "Early 20th century",
            verificationScore: 86
          },
          {
            id: "karwemera",
            name: "Karwemera",
            approximateEra: "Mid-20th century",
            verificationScore: 84
          },
          {
            id: "barumumba",
            name: "Barumumba",
            approximateEra: "Early 19th century",
            verificationScore: 82
          },
          {
            id: "kebirungi",
            name: "Kebirungi",
            approximateEra: "Mid-19th century",
            verificationScore: 80,
            notes: "Rare female elder within the clan"
          },
          {
            id: "nkundiye",
            name: "Nkundiye",
            approximateEra: "Late 19th century",
            verificationScore: 83
          },
          {
            id: "mpirirwe",
            name: "Mpirirwe",
            approximateEra: "Early 20th century",
            verificationScore: 81
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
          },
          {
            id: "rwakabooga",
            name: "Rwakabooga",
            approximateEra: "Early 20th century",
            verificationScore: 88
          },
          {
            id: "bugingo",
            name: "Bugingo",
            approximateEra: "Mid-19th century",
            verificationScore: 86
          },
          {
            id: "kairu",
            name: "Kairu",
            approximateEra: "Late 19th century",
            verificationScore: 85
          },
          {
            id: "batuma",
            name: "Batuma",
            approximateEra: "Early 20th century",
            verificationScore: 87
          },
          {
            id: "kamugisha",
            name: "Kamugisha",
            approximateEra: "Mid-20th century",
            verificationScore: 83
          },
          {
            id: "rwekigyira",
            name: "Rwekigyira",
            approximateEra: "Early 19th century",
            verificationScore: 82
          },
          {
            id: "muhoozi",
            name: "Muhoozi",
            approximateEra: "Mid-19th century",
            verificationScore: 80
          },
          {
            id: "kwatiraho",
            name: "Kwatiraho",
            approximateEra: "Late 19th century",
            verificationScore: 81
          },
          {
            id: "kahangire",
            name: "Kahangire",
            approximateEra: "Early 20th century",
            verificationScore: 79
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
          },
          {
            id: "tukahirwa",
            name: "Tukahirwa",
            approximateEra: "Late 19th century",
            verificationScore: 83
          },
          {
            id: "banturaki",
            name: "Banturaki",
            approximateEra: "Early 20th century",
            verificationScore: 86
          },
          {
            id: "kasigazi",
            name: "Kasigazi",
            approximateEra: "Mid-20th century",
            verificationScore: 84
          },
          {
            id: "mwebaze",
            name: "Mwebaze",
            approximateEra: "Early 19th century",
            verificationScore: 81
          },
          {
            id: "rutega",
            name: "Rutega",
            approximateEra: "Mid-19th century",
            verificationScore: 82
          },
          {
            id: "kabuzire",
            name: "Kabuzire",
            approximateEra: "Late 19th century",
            verificationScore: 80
          },
          {
            id: "komunda",
            name: "Komunda",
            approximateEra: "Early 20th century",
            verificationScore: 79
          },
          {
            id: "rurwaheru",
            name: "Rurwaheru",
            approximateEra: "Mid-20th century",
            verificationScore: 78
          },
          {
            id: "banyenzaki",
            name: "Banyenzaki",
            approximateEra: "Late 20th century",
            verificationScore: 77
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
          },
          {
            id: "kirunda",
            name: "Kirunda",
            approximateEra: "Late 19th century",
            verificationScore: 85
          },
          {
            id: "bakoye",
            name: "Bakoye",
            approximateEra: "Early 20th century",
            verificationScore: 88
          },
          {
            id: "nabirye",
            name: "Nabirye",
            approximateEra: "Mid-20th century",
            verificationScore: 86
          },
          {
            id: "mugoya",
            name: "Mugoya",
            approximateEra: "Early 19th century",
            verificationScore: 84
          },
          {
            id: "zirimenya",
            name: "Zirimenya",
            approximateEra: "Mid-19th century",
            verificationScore: 83
          },
          {
            id: "kagoda",
            name: "Kagoda",
            approximateEra: "Late 19th century",
            verificationScore: 82
          },
          {
            id: "namwase",
            name: "Namwase",
            approximateEra: "Early 20th century",
            verificationScore: 81
          },
          {
            id: "waiswa",
            name: "Waiswa",
            approximateEra: "Mid-20th century",
            verificationScore: 80
          },
          {
            id: "batambuze",
            name: "Batambuze",
            approximateEra: "Late 20th century",
            verificationScore: 79
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
          },
          {
            id: "muwanguzi",
            name: "Muwanguzi",
            approximateEra: "Mid-19th century",
            verificationScore: 85
          },
          {
            id: "kalikwani",
            name: "Kalikwani",
            approximateEra: "Late 19th century",
            verificationScore: 87
          },
          {
            id: "mpalanyi",
            name: "Mpalanyi",
            approximateEra: "Early 20th century",
            verificationScore: 86
          },
          {
            id: "nawangwe",
            name: "Nawangwe",
            approximateEra: "Mid-20th century",
            verificationScore: 84
          },
          {
            id: "mutebe",
            name: "Mutebe",
            approximateEra: "Early 19th century",
            verificationScore: 82
          },
          {
            id: "mudiope",
            name: "Mudiope",
            approximateEra: "Mid-19th century",
            verificationScore: 83
          },
          {
            id: "kikonyogo",
            name: "Kikonyogo",
            approximateEra: "Late 19th century",
            verificationScore: 81
          },
          {
            id: "batuwa",
            name: "Batuwa",
            approximateEra: "Early 20th century",
            verificationScore: 80
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
          },
          {
            id: "kyomya",
            name: "Kyomya",
            approximateEra: "Late 19th century",
            verificationScore: 88
          },
          {
            id: "kabagambe",
            name: "Kabagambe",
            approximateEra: "Early 20th century",
            verificationScore: 87
          },
          {
            id: "rubonga",
            name: "Rubonga",
            approximateEra: "Mid-20th century",
            verificationScore: 85
          },
          {
            id: "kabumba",
            name: "Kabumba",
            approximateEra: "Early 19th century",
            verificationScore: 86
          },
          {
            id: "tibamwenda",
            name: "Tibamwenda",
            approximateEra: "Mid-19th century",
            verificationScore: 84
          },
          {
            id: "mugenyi",
            name: "Mugenyi",
            approximateEra: "Late 19th century",
            verificationScore: 83
          },
          {
            id: "nyakaisiki",
            name: "Nyakaisiki",
            approximateEra: "Early 20th century",
            verificationScore: 82,
            notes: "Female elder recognized for medicinal knowledge"
          },
          {
            id: "rurangira",
            name: "Rurangira",
            approximateEra: "Mid-20th century",
            verificationScore: 81
          },
          {
            id: "basigara",
            name: "Basigara",
            approximateEra: "Late 20th century",
            verificationScore: 80
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
          },
          {
            id: "karubanga",
            name: "Karubanga",
            approximateEra: "Early 19th century",
            verificationScore: 83
          },
          {
            id: "nyamangyezi",
            name: "Nyamangyezi",
            approximateEra: "Mid-19th century",
            verificationScore: 86
          },
          {
            id: "kiiza",
            name: "Kiiza",
            approximateEra: "Late 19th century",
            verificationScore: 84
          },
          {
            id: "nyamaizi",
            name: "Nyamaizi",
            approximateEra: "Early 20th century",
            verificationScore: 82
          },
          {
            id: "tibakanya",
            name: "Tibakanya",
            approximateEra: "Mid-20th century",
            verificationScore: 81
          },
          {
            id: "isingoma",
            name: "Isingoma",
            approximateEra: "18th century",
            verificationScore: 80
          },
          {
            id: "kasaija",
            name: "Kasaija",
            approximateEra: "Early 19th century",
            verificationScore: 79
          },
          {
            id: "rukidi",
            name: "Rukidi",
            approximateEra: "Mid-19th century",
            verificationScore: 78
          },
          {
            id: "rwakaikara",
            name: "Rwakaikara",
            approximateEra: "Late 19th century",
            verificationScore: 77
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
          },
          {
            id: "opolot",
            name: "Opolot",
            approximateEra: "Mid-20th century",
            verificationScore: 85
          },
          {
            id: "okiria",
            name: "Okiria",
            approximateEra: "Late 19th century",
            verificationScore: 82
          },
          {
            id: "amodoi",
            name: "Amodoi",
            approximateEra: "Early 20th century",
            verificationScore: 84
          },
          {
            id: "okurut",
            name: "Okurut",
            approximateEra: "Mid-20th century",
            verificationScore: 81
          },
          {
            id: "engole",
            name: "Engole",
            approximateEra: "Late 19th century",
            verificationScore: 80
          },
          {
            id: "akello",
            name: "Akello",
            approximateEra: "Early 20th century",
            verificationScore: 79,
            notes: "Female elder known for agricultural innovations"
          },
          {
            id: "omoding",
            name: "Omoding",
            approximateEra: "Mid-20th century",
            verificationScore: 78
          },
          {
            id: "edopu",
            name: "Edopu",
            approximateEra: "Late 19th century",
            verificationScore: 77
          },
          {
            id: "ojilong",
            name: "Ojilong",
            approximateEra: "Early 20th century",
            verificationScore: 76
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
          },
          {
            id: "ebaju",
            name: "Ebaju",
            approximateEra: "Late 19th century",
            verificationScore: 82
          },
          {
            id: "acom",
            name: "Acom",
            approximateEra: "Early 20th century",
            verificationScore: 85
          },
          {
            id: "okiror",
            name: "Okiror",
            approximateEra: "Mid-20th century",
            verificationScore: 83
          },
          {
            id: "otim",
            name: "Otim",
            approximateEra: "Late 19th century",
            verificationScore: 81
          },
          {
            id: "egunyu",
            name: "Egunyu",
            approximateEra: "Early 20th century",
            verificationScore: 80
          },
          {
            id: "amuge",
            name: "Amuge",
            approximateEra: "Mid-20th century",
            verificationScore: 79
          },
          {
            id: "odongo",
            name: "Odongo",
            approximateEra: "Early 19th century",
            verificationScore: 78
          },
          {
            id: "etesot",
            name: "Etesot",
            approximateEra: "Mid-19th century",
            verificationScore: 77
          },
          {
            id: "adeke",
            name: "Adeke",
            approximateEra: "Late 20th century",
            verificationScore: 76
          }
        ]
      }
    ]
  }
]