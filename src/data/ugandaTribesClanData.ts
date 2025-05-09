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
    id: "bakiga",
    name: "Bakiga",
    region: "Southwestern Uganda",
    population: "1.9 million",
    language: "Rukiga",
    description: "The Bakiga, known as 'people of the mountains', inhabit the highlands of southwestern Uganda. They are renowned for their terraced farming techniques on steep hillsides and strong cultural traditions.",
    clans: [
      {
        id: "basigi",
        name: "Basigi",
        totem: "Elephant",
        origin: "Originally from the mountainous regions of Kigezi",
        elders: [
          {
            id: "rwamatungi",
            name: "Rwamatungi",
            approximateEra: "Mid-19th century",
            verificationScore: 89,
            notes: "Known for establishing key settlement patterns"
          },
          {
            id: "kakuru",
            name: "Kakuru",
            approximateEra: "Late 19th century",
            verificationScore: 87
          },
          {
            id: "kansiime",
            name: "Kansiime",
            approximateEra: "Early 20th century",
            verificationScore: 85
          },
          {
            id: "beyendeza",
            name: "Beyendeza",
            approximateEra: "Mid-20th century",
            verificationScore: 84
          },
          {
            id: "rwabuhinga",
            name: "Rwabuhinga",
            approximateEra: "Early 19th century",
            verificationScore: 83
          },
          {
            id: "kyomukama",
            name: "Kyomukama",
            approximateEra: "Mid-19th century",
            verificationScore: 86
          },
          {
            id: "kembabazi",
            name: "Kembabazi",
            approximateEra: "Late 19th century",
            verificationScore: 82,
            notes: "Female elder respected for agricultural knowledge"
          },
          {
            id: "mutabazi",
            name: "Mutabazi",
            approximateEra: "Early 20th century",
            verificationScore: 81
          },
          {
            id: "rukundo",
            name: "Rukundo",
            approximateEra: "Mid-20th century",
            verificationScore: 80
          },
          {
            id: "turyamureeba",
            name: "Turyamureeba",
            approximateEra: "Late 20th century",
            verificationScore: 79
          }
        ],
        culturalPractices: [
          "Terraced farming on hillsides",
          "Elaborate marriage ceremonies",
          "Traditional brewing of sorghum beer (Omuramba)"
        ]
      },
      {
        id: "bazigaba",
        name: "Bazigaba",
        totem: "Buffalo",
        origin: "Migrated from the northern regions of Rwanda",
        elders: [
          {
            id: "baryomunsi",
            name: "Baryomunsi",
            approximateEra: "Late 19th century",
            verificationScore: 88
          },
          {
            id: "tugumisirize",
            name: "Tugumisirize",
            approximateEra: "Early 20th century",
            verificationScore: 86
          },
          {
            id: "kwatampora",
            name: "Kwatampora",
            approximateEra: "Mid-20th century",
            verificationScore: 85
          },
          {
            id: "kamugisha",
            name: "Kamugisha",
            approximateEra: "Early 19th century",
            verificationScore: 84
          },
          {
            id: "tumwebaze",
            name: "Tumwebaze",
            approximateEra: "Mid-19th century",
            verificationScore: 83
          },
          {
            id: "nyinabarongo",
            name: "Nyinabarongo",
            approximateEra: "Late 19th century",
            verificationScore: 82,
            notes: "Female elder known for medicinal knowledge"
          },
          {
            id: "kyarimpa",
            name: "Kyarimpa",
            approximateEra: "Early 20th century",
            verificationScore: 81
          },
          {
            id: "rubahamya",
            name: "Rubahamya",
            approximateEra: "Mid-20th century",
            verificationScore: 80
          },
          {
            id: "kanyesigye",
            name: "Kanyesigye",
            approximateEra: "Late 19th century",
            verificationScore: 79
          },
          {
            id: "muhumuza",
            name: "Muhumuza",
            approximateEra: "Early 20th century",
            verificationScore: 78
          }
        ],
        culturalPractices: [
          "Traditional beekeeping",
          "Elaborate funeral ceremonies"
        ]
      },
      {
        id: "baheesi",
        name: "Baheesi",
        totem: "Leopard",
        elders: [
          {
            id: "rwamafunzi",
            name: "Rwamafunzi",
            approximateEra: "19th century",
            verificationScore: 85
          },
          {
            id: "bitarabeho",
            name: "Bitarabeho",
            approximateEra: "Late 19th century",
            verificationScore: 83
          },
          {
            id: "turyatemba",
            name: "Turyatemba",
            approximateEra: "Early 20th century",
            verificationScore: 86
          },
          {
            id: "ruhimbana",
            name: "Ruhimbana",
            approximateEra: "Mid-20th century",
            verificationScore: 84
          },
          {
            id: "nkurunziza",
            name: "Nkurunziza",
            approximateEra: "Early 19th century",
            verificationScore: 82
          },
          {
            id: "bishangabyinshi",
            name: "Bishangabyinshi",
            approximateEra: "Mid-19th century",
            verificationScore: 81
          },
          {
            id: "kyomunuufu",
            name: "Kyomunuufu",
            approximateEra: "Late 19th century",
            verificationScore: 80
          },
          {
            id: "arinaitwe",
            name: "Arinaitwe",
            approximateEra: "Early 20th century",
            verificationScore: 79
          },
          {
            id: "mwesigwa",
            name: "Mwesigwa",
            approximateEra: "Mid-20th century",
            verificationScore: 78
          },
          {
            id: "twesigomwe",
            name: "Twesigomwe",
            approximateEra: "Late 20th century",
            verificationScore: 77
          }
        ],
        culturalPractices: [
          "Specialized hunting techniques",
          "Traditional forest conservation practices"
        ]
      },
      {
        id: "banyangabo",
        name: "Banyangabo",
        totem: "Crane",
        elders: [
          {
            id: "kabagambe",
            name: "Kabagambe",
            approximateEra: "19th century",
            verificationScore: 87
          },
          {
            id: "rutahigwa",
            name: "Rutahigwa",
            approximateEra: "Late 19th century",
            verificationScore: 85
          },
          {
            id: "twinomuhangi",
            name: "Twinomuhangi",
            approximateEra: "Early 20th century",
            verificationScore: 83
          },
          {
            id: "beinomugisha",
            name: "Beinomugisha",
            approximateEra: "Mid-20th century",
            verificationScore: 82
          },
          {
            id: "asiimwe",
            name: "Asiimwe",
            approximateEra: "Early 19th century",
            verificationScore: 81
          },
          {
            id: "kyarisiima",
            name: "Kyarisiima",
            approximateEra: "Mid-19th century",
            verificationScore: 80,
            notes: "Female elder known for conflict resolution"
          },
          {
            id: "akankwasa",
            name: "Akankwasa",
            approximateEra: "Late 19th century",
            verificationScore: 79
          },
          {
            id: "twinomujuni",
            name: "Twinomujuni",
            approximateEra: "Early 20th century",
            verificationScore: 78
          },
          {
            id: "bantebya",
            name: "Bantebya",
            approximateEra: "Mid-20th century",
            verificationScore: 77
          },
          {
            id: "tibandebage",
            name: "Tibandebage",
            approximateEra: "Late 20th century",
            verificationScore: 76
          }
        ],
        culturalPractices: [
          "Rain-making ceremonies",
          "Complex irrigation systems"
        ]
      }
    ]
  },
  {
    id: "bafumbira",
    name: "Bafumbira",
    region: "Southwestern Uganda (Kisoro District)",
    population: "850,000",
    language: "Rufumbira",
    description: "The Bafumbira people are closely related to the Banyarwanda and inhabit the Kisoro district in southwestern Uganda, near the borders with Rwanda and DRC. They are known for their agricultural practices and vibrant cultural traditions.",
    clans: [
      {
        id: "abasinga",
        name: "Abasinga",
        totem: "Crane",
        elders: [
          {
            id: "ndangira",
            name: "Ndangira",
            approximateEra: "Late 19th century",
            verificationScore: 88
          },
          {
            id: "mugisha",
            name: "Mugisha",
            approximateEra: "Early 20th century",
            verificationScore: 86
          },
          {
            id: "karwanyi",
            name: "Karwanyi",
            approximateEra: "Mid-20th century",
            verificationScore: 85
          },
          {
            id: "bucyanayandi",
            name: "Bucyanayandi",
            approximateEra: "Late 19th century",
            verificationScore: 84
          },
          {
            id: "munyanziza",
            name: "Munyanziza",
            approximateEra: "Early 20th century",
            verificationScore: 83
          },
          {
            id: "habyalimana",
            name: "Habyalimana",
            approximateEra: "Mid-20th century",
            verificationScore: 82
          },
          {
            id: "nsabimana",
            name: "Nsabimana",
            approximateEra: "Early 19th century",
            verificationScore: 81
          },
          {
            id: "nyiransengimana",
            name: "Nyiransengimana",
            approximateEra: "Mid-19th century",
            verificationScore: 80,
            notes: "Female elder known for storytelling"
          },
          {
            id: "sezibera",
            name: "Sezibera",
            approximateEra: "Late 19th century",
            verificationScore: 79
          },
          {
            id: "muhawenimana",
            name: "Muhawenimana",
            approximateEra: "Early 20th century",
            verificationScore: 78
          }
        ],
        culturalPractices: [
          "Traditional storytelling (Ibitekerezo)",
          "Dance performances (Intore)"
        ]
      },
      {
        id: "abagesera",
        name: "Abagesera",
        totem: "Antelope",
        elders: [
          {
            id: "kayihura",
            name: "Kayihura",
            approximateEra: "19th century",
            verificationScore: 87
          },
          {
            id: "byabagamba",
            name: "Byabagamba",
            approximateEra: "Late 19th century",
            verificationScore: 85
          },
          {
            id: "rudasingwa",
            name: "Rudasingwa",
            approximateEra: "Early 20th century",
            verificationScore: 84
          },
          {
            id: "sebineza",
            name: "Sebineza",
            approximateEra: "Mid-20th century",
            verificationScore: 86
          },
          {
            id: "bisengimana",
            name: "Bisengimana",
            approximateEra: "Early 19th century",
            verificationScore: 83
          },
          {
            id: "rusanganwa",
            name: "Rusanganwa",
            approximateEra: "Mid-19th century",
            verificationScore: 82
          },
          {
            id: "mudacumura",
            name: "Mudacumura",
            approximateEra: "Late 19th century",
            verificationScore: 81
          },
          {
            id: "nyirahabimana",
            name: "Nyirahabimana",
            approximateEra: "Early 20th century",
            verificationScore: 80,
            notes: "Female elder renowned for traditional healing"
          },
          {
            id: "nteziryayo",
            name: "Nteziryayo",
            approximateEra: "Mid-20th century",
            verificationScore: 79
          },
          {
            id: "bimenyimana",
            name: "Bimenyimana",
            approximateEra: "Late 20th century",
            verificationScore: 78
          }
        ],
        culturalPractices: [
          "Traditional medicine using highland herbs",
          "Beekeeping and honey production"
        ]
      },
      {
        id: "abanyiginya",
        name: "Abanyiginya",
        totem: "Buffalo",
        elders: [
          {
            id: "serugendo",
            name: "Serugendo",
            approximateEra: "19th century",
            verificationScore: 86
          },
          {
            id: "munyarugerero",
            name: "Munyarugerero",
            approximateEra: "Late 19th century",
            verificationScore: 84
          },
          {
            id: "rwagasore",
            name: "Rwagasore",
            approximateEra: "Early 20th century",
            verificationScore: 85
          },
          {
            id: "bizimungu",
            name: "Bizimungu",
            approximateEra: "Mid-20th century",
            verificationScore: 83
          },
          {
            id: "turatsinze",
            name: "Turatsinze",
            approximateEra: "Early 19th century",
            verificationScore: 82
          },
          {
            id: "habineza",
            name: "Habineza",
            approximateEra: "Mid-19th century",
            verificationScore: 81
          },
          {
            id: "niyonzima",
            name: "Niyonzima",
            approximateEra: "Late 19th century",
            verificationScore: 80
          },
          {
            id: "mukagasana",
            name: "Mukagasana",
            approximateEra: "Early 20th century",
            verificationScore: 79,
            notes: "Female elder known for diplomatic skills"
          },
          {
            id: "rwakazina",
            name: "Rwakazina",
            approximateEra: "Mid-20th century",
            verificationScore: 78
          },
          {
            id: "munyarukiko",
            name: "Munyarukiko",
            approximateEra: "Late 20th century",
            verificationScore: 77
          }
        ],
        culturalPractices: [
          "Traditional astronomy and calendar keeping",
          "Elaborate ceremonies for childbirth"
        ]
      }
    ]
  },
  {
    id: "bahima",
    name: "Bahima",
    region: "Western Uganda (Ankole region)",
    population: "750,000",
    language: "Runyankole",
    description: "The Bahima are traditionally pastoralists in western Uganda, known for their cattle-keeping culture and distinctive social structure. They were historically the pastoralist class within the Ankole kingdom.",
    clans: [
      {
        id: "abahinda",
        name: "Abahinda",
        totem: "Lion",
        origin: "The royal clan of traditional Ankole kingdom",
        elders: [
          {
            id: "rushakoza",
            name: "Rushakoza",
            approximateEra: "19th century",
            verificationScore: 92,
            notes: "Royal lineage elder with significant historical knowledge"
          },
          {
            id: "nimukama",
            name: "Nimukama",
            approximateEra: "Late 19th century",
            verificationScore: 89
          },
          {
            id: "buningwire",
            name: "Buningwire",
            approximateEra: "Early 20th century",
            verificationScore: 87
          },
          {
            id: "katongole",
            name: "Katongole",
            approximateEra: "Mid-20th century",
            verificationScore: 86
          },
          {
            id: "rubambansi",
            name: "Rubambansi",
            approximateEra: "Early 19th century",
            verificationScore: 85
          },
          {
            id: "kaihura",
            name: "Kaihura",
            approximateEra: "Mid-19th century",
            verificationScore: 84
          },
          {
            id: "kahigiriza",
            name: "Kahigiriza",
            approximateEra: "Late 19th century",
            verificationScore: 83
          },
          {
            id: "kamuturaki",
            name: "Kamuturaki",
            approximateEra: "Early 20th century",
            verificationScore: 82
          },
          {
            id: "rwakikyara",
            name: "Rwakikyara",
            approximateEra: "Mid-20th century",
            verificationScore: 81
          },
          {
            id: "barungi",
            name: "Barungi",
            approximateEra: "Late 20th century",
            verificationScore: 80,
            notes: "Female elder revered for pastoral knowledge"
          }
        ],
        culturalPractices: [
          "Complex cattle breeding traditions",
          "Royal ceremonies and rituals",
          "Traditional pastoral songs (Ebyevugo)"
        ]
      },
      {
        id: "abaishekatwa",
        name: "Abaishekatwa",
        totem: "Sheep",
        elders: [
          {
            id: "komuhangi",
            name: "Komuhangi",
            approximateEra: "19th century",
            verificationScore: 88
          },
          {
            id: "karamagi",
            name: "Karamagi",
            approximateEra: "Late 19th century",
            verificationScore: 86
          },
          {
            id: "bitariho",
            name: "Bitariho",
            approximateEra: "Early 20th century",
            verificationScore: 85
          },
          {
            id: "rubaihayo",
            name: "Rubaihayo",
            approximateEra: "Mid-20th century",
            verificationScore: 87
          },
          {
            id: "kagyenda",
            name: "Kagyenda",
            approximateEra: "Early 19th century",
            verificationScore: 84
          },
          {
            id: "mutembei",
            name: "Mutembei",
            approximateEra: "Mid-19th century",
            verificationScore: 83
          },
          {
            id: "rwabwera",
            name: "Rwabwera",
            approximateEra: "Late 19th century",
            verificationScore: 82
          },
          {
            id: "mulindwa",
            name: "Mulindwa",
            approximateEra: "Early 20th century",
            verificationScore: 81
          },
          {
            id: "tusiime",
            name: "Tusiime",
            approximateEra: "Mid-20th century",
            verificationScore: 80,
            notes: "Known for innovations in cattle disease treatment"
          },
          {
            id: "kyaruhanga",
            name: "Kyaruhanga",
            approximateEra: "Late 20th century",
            verificationScore: 79
          }
        ],
        culturalPractices: [
          "Traditional cattle herding techniques",
          "Specialized milk preservation methods"
        ]
      },
      {
        id: "abashambo",
        name: "Abashambo",
        totem: "Antelope",
        elders: [
          {
            id: "rubahimbya",
            name: "Rubahimbya",
            approximateEra: "19th century",
            verificationScore: 86
          },
          {
            id: "ndinawe",
            name: "Ndinawe",
            approximateEra: "Late 19th century",
            verificationScore: 84
          },
          {
            id: "rwankangi",
            name: "Rwankangi",
            approximateEra: "Early 20th century",
            verificationScore: 85
          },
          {
            id: "ndyanabo",
            name: "Ndyanabo",
            approximateEra: "Mid-20th century",
            verificationScore: 83
          },
          {
            id: "bashasha",
            name: "Bashasha",
            approximateEra: "Early 19th century",
            verificationScore: 82
          },
          {
            id: "kashaija",
            name: "Kashaija",
            approximateEra: "Mid-19th century",
            verificationScore: 81
          },
          {
            id: "tuhumwire",
            name: "Tuhumwire",
            approximateEra: "Late 19th century",
            verificationScore: 80,
            notes: "Female elder known for cattle wealth"
          },
          {
            id: "kabareebe",
            name: "Kabareebe",
            approximateEra: "Early 20th century",
            verificationScore: 79
          },
          {
            id: "rwobusisi",
            name: "Rwobusisi",
            approximateEra: "Mid-20th century",
            verificationScore: 78
          },
          {
            id: "nuwagaba",
            name: "Nuwagaba",
            approximateEra: "Late 20th century",
            verificationScore: 77
          }
        ],
        culturalPractices: [
          "Traditional cattle markings and identification",
          "Ceremonies for protecting livestock"
        ]
      },
      {
        id: "abagahe",
        name: "Abagahe",
        totem: "Crested Crane",
        elders: [
          {
            id: "nkwasibwe",
            name: "Nkwasibwe",
            approximateEra: "19th century",
            verificationScore: 87
          },
          {
            id: "katureebe",
            name: "Katureebe",
            approximateEra: "Late 19th century",
            verificationScore: 85
          },
          {
            id: "rumanyika",
            name: "Rumanyika",
            approximateEra: "Early 20th century",
            verificationScore: 86
          },
          {
            id: "katukunda",
            name: "Katukunda",
            approximateEra: "Mid-20th century",
            verificationScore: 84,
            notes: "Female elder renowned for leadership"
          },
          {
            id: "baitwabaruhanga",
            name: "Baitwabaruhanga",
            approximateEra: "Early 19th century",
            verificationScore: 83
          },
          {
            id: "tumusiime",
            name: "Tumusiime",
            approximateEra: "Mid-19th century",
            verificationScore: 82
          },
          {
            id: "kabarungyi",
            name: "Kabarungyi",
            approximateEra: "Late 19th century",
            verificationScore: 81
          },
          {
            id: "kangwagye",
            name: "Kangwagye",
            approximateEra: "Early 20th century",
            verificationScore: 80
          },
          {
            id: "ngabirano",
            name: "Ngabirano",
            approximateEra: "Mid-20th century",
            verificationScore: 79
          },
          {
            id: "rwankwenda",
            name: "Rwankwenda",
            approximateEra: "Late 20th century",
            verificationScore: 78
          }
        ],
        culturalPractices: [
          "Traditional cattle-based wealth exchange",
          "Elaborate milk processing techniques",
          "Age-set system of social organization"
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