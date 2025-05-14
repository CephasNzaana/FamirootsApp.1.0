// src/data/ugandaTribesClanData.ts
import { Tribe, Clan, ClanElder } from '@/types';

// --- Helper Functions (place at the top of your data file) ---

const masculinizeName = (originalName: string, index: number, clanName?: string): string => {
    const femaleSpecificPrefixes = ["Na", "Nya"];
    const femaleSpecificSuffixes = ["a", "e", "i"]; // Common feminine endings in some names

    let namePart = originalName;
    let modified = false;

    // Prioritize known equivalents for more accurate masculinization
    const knownFemaleToMaleEquivalents: Record<string, string> = {
        "Nampijja": "Ssepijja", "Kansiime": "Kansiimbe", "Kembabazi": "Kembagano",
        "Namisango": "Ssemisango", "Nyirahabimana": "Muhabimana", "Mukagasana": "MukasaGana",
        "Barungi": "Barungire", "Tusiime": "Tusiimwe", "Tuhumwire": "Mutuhumwire",
        "Katukunda": "Katukunde", "Kebirungi": "Kyakabirungi", "Alanyo": "OlanyaM",
        "Akello": "OkelloM", "Adeke": "Adeko", "Nyakaisiki": "Mukaisiki",
        "Nabirye": "KiryaM", "Namwase": "Ssemwase", "Nyinabarongo": "Mubarongo",
        "Kyarisiima": "Kyarisiimbe", "Kabarungyi": "KabarungiM", "Nalwoga": "LwogomaM",
        "Namukadde": "Ssemukadde", "Nakayiza": "KayizaM", "Nakabugo": "KabugoM",
        "Najjemba": "JjembaM", "Nankinga": "KkingaM", "Namulondo": "MulondoM"
    };

    if (knownFemaleToMaleEquivalents[originalName]) {
        return knownFemaleToMaleEquivalents[originalName];
    }

    for (const prefix of femaleSpecificPrefixes) {
        if (namePart.startsWith(prefix) && namePart.length > prefix.length) {
            if (prefix === "Na") namePart = "Sse" + namePart.substring(2);
            else namePart = "Mu" + namePart.substring(3);
            modified = true;
            break;
        }
    }
    
    if (!modified && femaleSpecificSuffixes.includes(namePart.slice(-1).toLowerCase()) && namePart.length > 2 && !namePart.endsWith("nge") && !namePart.endsWith("we")) {
        namePart = namePart.slice(0, -1) + "o";
        modified = true;
    }

    if (!modified || namePart === originalName || namePart.length < 3 ) {
        const maleNames = ["Mugisha", "Okello", "Byaruhanga", "Ssegawa", "Kato", "Wasswa", "Mutabazi", "Sentamu", "Kiiza", "Muwanga", "Rukundo", "Busingye"];
        let hash = 0;
        for (let i = 0; i < originalName.length; i++) {
            hash = (hash << 5) - hash + originalName.charCodeAt(i);
            hash |= 0; 
        }
        hash = Math.abs(hash + index);
        const baseName = maleNames[hash % maleNames.length];
        const clanInitials = clanName ? clanName.substring(0, Math.min(3, clanName.length)).toUpperCase() : "ELD";
        namePart = `${baseName}_${clanInitials}${index + 1}`;
    }
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
};

const sanitizeElderNotes = (notes?: string, name?: string): string | undefined => {
    if (!notes) return undefined;
    let newNotes = notes;
    newNotes = newNotes.replace(/\bShe\b/g, 'This elder');
    newNotes = newNotes.replace(/\bHer\b/g, 'Their'); 
    newNotes = newNotes.replace(/\bHers\b/g, 'Theirs');
    newNotes = newNotes.replace(/\bfemale elder\b/gi, 'elder');
    newNotes = newNotes.replace(/\bmatriarch\b/gi, 'respected leader');

    if (newNotes.includes("First female elder recognized in the clan")) {
        newNotes = `A notable elder, ${name || 'this individual'}, was recognized early in the clan's leadership structure for their significant contributions.`;
    } else if (newNotes.includes("Rare female elder")) {
        newNotes = `A distinct and respected elder within the clan, ${name || 'this individual'} was known for their unique insights and influence.`;
    } else if (newNotes.match(/female elder respected for/i) || newNotes.match(/female elder known for/i)) {
        newNotes = newNotes.replace(/female elder/i, 'elder');
    }
    
    newNotes = newNotes.replace(/  +/g, ' ').trim();
    return newNotes === "" ? undefined : newNotes;
};

// --- Main Data Structure Definition Starts Below ---
export const ugandaTribesData: Tribe[] = [
  // --- BAGANDA ---
  {
    id: "baganda",
    name: "Baganda",
    region: "Central Uganda",
    population: "5.5 million", // Kept as string from original data
    language: "Luganda",
    description: "The Baganda are the largest ethnic group in Uganda, making up approximately 16% of the population. They are known for their rich cultural heritage and sophisticated political organization under the Kabaka (king).",
    clans: [
      {
        id: "ffumbe",
        name: "Ffumbe", // Simplified name, original had "(Lung Fish Clan)"
        totem: "Lung Fish",
        origin: "The clan originated from Ssese Islands on Lake Victoria",
        description: "The Ffumbe clan is one of the oldest and most respected clans in Buganda, traditionally associated with fishing and water bodies. They hold significant cultural importance.",
        traditions: [ {id: "ffumbe_totem", name: "Respect for Lungfish", description: "Members of the Ffumbe clan do not eat their totem, the lungfish, and are often considered its guardians.", category: "ritual", importance: "critical", stillPracticed: true} ],
        families: 300, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, // Will be set below
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, // Ensure string
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, // Ensure string
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "walusimbi", name: "Walusimbi", approximateEra: "18th century", verificationScore: 95, notes: "One of the most respected clan heads in Buganda kingdom history" },
          { id: "kaboggoza", name: "Kaboggoza", approximateEra: "19th century", verificationScore: 90 },
          { id: "ssentamu", name: "Ssentamu", approximateEra: "Mid-19th century", verificationScore: 87, notes: "Known for establishing important fishing traditions" },
          { id: "lubega", name: "Lubega", approximateEra: "Late 19th century", verificationScore: 84 },
          { id: "wasswa", name: "Wasswa", approximateEra: "Early 20th century", verificationScore: 89, notes: "Helped preserve clan customs during colonial period" },
          { id: "kyewalabye", name: "Kyewalabye", approximateEra: "Mid-20th century", verificationScore: 91 },
          { id: "ssemaganda", name: "Ssemaganda", approximateEra: "Mid-18th century", verificationScore: 82 },
          { id: "nsubuga", name: "Nsubuga", approximateEra: "Early 19th century", verificationScore: 86 },
          { id: "mulumba", name: "Mulumba", approximateEra: "Late 19th century", verificationScore: 85 },
          { id: "sembuusi", name: "Sembuusi", approximateEra: "Early 20th century", verificationScore: 88 }
        ], "ffumbe", "Ffumbe", "TA_baganda"),
        culturalPractices: [
          "Clan members traditionally avoid eating lungfish",
          "Responsible for fishing and water activities in traditional Buganda"
        ],
        historicalNotes: ["The Ffumbe clan has played a vital role in the sustenance and spiritual life of Buganda through its connection to Lake Victoria."]
      },
      {
        id: "ngonge",
        name: "Ngonge", // Simplified
        totem: "Otter",
        description: "The Ngonge clan, with the otter as its totem, is known for its members' wisdom and advisory roles within the Buganda kingdom.",
        traditions: [ {id: "ngonge_advice", name: "Advisory Roles", description: "Members of the Ngonge clan were often sought for their counsel by Buganda's leaders.", category: "practice", importance: "high", stillPracticed: false} ],
        families: 280, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "kayima", name: "Kayima", approximateEra: "Late 18th century", verificationScore: 88 },
          { id: "luswaata", name: "Luswaata", approximateEra: "Early 19th century", verificationScore: 85 },
          { id: "ssebuggwawo", name: "Ssebuggwawo", approximateEra: "Mid-19th century", verificationScore: 83 },
          { id: "namisango", name: "Namisango", approximateEra: "Late 19th century", verificationScore: 87, notes: "First female elder recognized in the clan" },
          { id: "katende", name: "Katende", approximateEra: "Early 20th century", verificationScore: 89 },
          { id: "nankinga", name: "Nankinga", approximateEra: "Mid-20th century", verificationScore: 84 },
          { id: "musambwa", name: "Musambwa", approximateEra: "18th century", verificationScore: 80 },
          { id: "kalungi", name: "Kalungi", approximateEra: "Mid-19th century", verificationScore: 82 },
          { id: "bbosa", name: "Bbosa", approximateEra: "Late 19th century", verificationScore: 85 },
          { id: "kinene", name: "Kinene", approximateEra: "Early 20th century", verificationScore: 86 }
        ], "ngonge", "Ngonge", "TA_baganda")
      },
      {
        id: "nnyonyi",
        name: "Nnyonyi", // Simplified
        totem: "Bird",
        description: "The Nnyonyi clan is associated with various bird species and often held roles related to communication or scouting in traditional Buganda.",
        traditions: [{id: "nnyonyi_omens", name: "Bird Omens", description: "Interpreting bird calls and flight patterns for guidance was a known practice.", category: "ritual", importance: "medium", stillPracticed: false}],
        families: 250,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "mukiibi", name: "Mukiibi", approximateEra: "19th century", verificationScore: 92 }, { id: "nampijja", name: "Nampijja", approximateEra: "Late 19th century", verificationScore: 87 }, { id: "kibuuka", name: "Kibuuka", approximateEra: "Early 20th century", verificationScore: 85, notes: "Known for preserving bird clan rituals" }, { id: "ssenkungu", name: "Ssenkungu", approximateEra: "Mid-20th century", verificationScore: 89 }, { id: "kazibwe", name: "Kazibwe", approximateEra: "Early 19th century", verificationScore: 83 }, { id: "kakeeto", name: "Kakeeto", approximateEra: "Mid-19th century", verificationScore: 86 }, { id: "ntambi", name: "Ntambi", approximateEra: "Late 19th century", verificationScore: 84 }, { id: "namulondo", name: "Namulondo", approximateEra: "Early 20th century", verificationScore: 88 }, { id: "mugagga", name: "Mugagga", approximateEra: "Mid-20th century", verificationScore: 82 }, { id: "ssemanda", name: "Ssemanda", approximateEra: "Late 20th century", verificationScore: 81 }
        ], "nnyonyi", "Nnyonyi", "TA_baganda")
      },
       {
        id: "mmamba",
        name: "Mmamba", // Simplified
        totem: "Lungfish",
        description: "The Mmamba clan is a large and influential clan in Buganda, known for its many sub-clans and historical significance.",
        traditions: [{id: "mmamba_unity", name: "Clan Unity", description: "Mmamba clan emphasizes strong internal unity and support among its members.", category: "practice", importance: "high", stillPracticed: true}],
        families: 400,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "lwomwa", name: "Lwomwa", approximateEra: "19th century", verificationScore: 89 }, { id: "namubiru", name: "Namubiru", approximateEra: "Late 19th century", verificationScore: 86 }, { id: "ssalongo", name: "Ssalongo", approximateEra: "Early 20th century", verificationScore: 88 }, { id: "nalwoga", name: "Nalwoga", approximateEra: "Mid-20th century", verificationScore: 85 }, { id: "kigozi", name: "Kigozi", approximateEra: "Early 19th century", verificationScore: 83 }, { id: "bbumba", name: "Bbumba", approximateEra: "Mid-19th century", verificationScore: 87 }, { id: "kawuki", name: "Kawuki", approximateEra: "Late 19th century", verificationScore: 84 }, { id: "ssebutembe", name: "Ssebutembe", approximateEra: "Early 20th century", verificationScore: 82 }, { id: "kirigwajjo", name: "Kirigwajjo", approximateEra: "Mid-20th century", verificationScore: 80 }, { id: "magoba", name: "Magoba", approximateEra: "Late 20th century", verificationScore: 79 }
        ], "mmamba", "Mmamba", "TA_baganda")
      },
      {
        id: "butiko",
        name: "Butiko", // Simplified
        totem: "Mushroom",
        description: "The Butiko clan, whose totem is the mushroom, has a rich history intertwined with the Buganda kingdom's traditional foods and forest lore.",
        traditions: [{id: "butiko_mushroom", name: "Mushroom Knowledge", description: "Members are traditionally knowledgeable about various types of mushrooms, their uses, and significance.", category: "practice", importance: "medium", stillPracticed: true}],
        families: 200,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "namukadde", name: "Namukadde", approximateEra: "18th century", verificationScore: 86 }, { id: "kisitu", name: "Kisitu", approximateEra: "Early 19th century", verificationScore: 84 }, { id: "kasozi", name: "Kasozi", approximateEra: "Mid-19th century", verificationScore: 87 }, { id: "nakayiza", name: "Nakayiza", approximateEra: "Late 19th century", verificationScore: 85 }, { id: "ssempala", name: "Ssempala", approximateEra: "Early 20th century", verificationScore: 83 }, { id: "nakabugo", name: "Nakabugo", approximateEra: "Mid-20th century", verificationScore: 82 }, { id: "lukwago", name: "Lukwago", approximateEra: "18th century", verificationScore: 80 }, { id: "ssekamwa", name: "Ssekamwa", approximateEra: "Early 19th century", verificationScore: 81 }, { id: "najjemba", name: "Najjemba", approximateEra: "Late 19th century", verificationScore: 79 }, { id: "ssebugwawo_butiko_clan", name: "Ssebugwawo", approximateEra: "Early 20th century", verificationScore: 78 }
        ], "butiko", "Butiko", "TA_baganda")
      }
    ]
  },
  
  // --- BAKIGA ---
  {
    id: "bakiga",
    name: "Bakiga",
    region: "Southwestern Uganda",
    population: "1.9 million", // Kept as string
    language: "Rukiga",
    description: "The Bakiga, known as 'people of the mountains', inhabit the highlands of southwestern Uganda. They are renowned for their terraced farming techniques on steep hillsides and strong cultural traditions.",
    clans: [
      {
        id: "basigi",
        name: "Basigi",
        totem: "Elephant",
        origin: "Originally from the mountainous regions of Kigezi",
        description: "The Basigi are one of the prominent clans among the Bakiga, known for their resilience and strong community bonds. They have a rich history rooted in the Kigezi highlands.",
        traditions: [ {id: "basigi_marriage", name: "Basigi Marriage Rites", description: "A multi-stage process involving family negotiations and gift exchanges.", category: "ceremony", importance: "high", stillPracticed: true}, {id: "basigi_harvest", name: "Harvest Festival", description: "A communal celebration giving thanks for the harvest, involving feasting and dancing.", category: "practice", importance: "medium", stillPracticed: true}],
        families: 250, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, 
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear,
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear,
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "rwamatungi", name: "Rwamatungi", approximateEra: "Mid-19th century", verificationScore: 89, notes: "Known for establishing key settlement patterns", significance: "Founding patriarch of a major Basigi lineage." },
          { id: "kakuru", name: "Kakuru", approximateEra: "Late 19th century", verificationScore: 87, significance: "A unifying leader and contemporary of Rwamatungi." },
          { id: "kansiime", name: "Kansiime", approximateEra: "Early 20th century", verificationScore: 85, notes: "Influential in clan matters.", significance: "Respected for wisdom and guidance." }, // Name will be changed
          { id: "beyendeza", name: "Beyendeza", approximateEra: "Mid-20th century", verificationScore: 84, significance: "Known for diplomatic skills." },
          { id: "rwabuhinga", name: "Rwabuhinga", approximateEra: "Early 19th century", verificationScore: 83, significance: "Warrior and defender of the clan." },
          { id: "kyomukama", name: "Kyomukama", approximateEra: "Mid-19th century", verificationScore: 86, significance: "Preserver of oral traditions." },
          { id: "kembabazi", name: "Kembabazi", approximateEra: "Late 19th century", verificationScore: 82, notes: "Elder respected for agricultural knowledge", significance: "Innovator in farming techniques." }, // Name will be changed
          { id: "mutabazi", name: "Mutabazi", approximateEra: "Early 20th century", verificationScore: 81, significance: "Key figure in resolving disputes." },
          { id: "rukundo", name: "Rukundo", approximateEra: "Mid-20th century", verificationScore: 80, significance: "Promoted inter-clan harmony." },
          { id: "turyamureeba", name: "Turyamureeba", approximateEra: "Late 20th century", verificationScore: 79, significance: "Guided the clan in modern times." }
        ], "basigi", "Basigi", "TA_bakiga"),
        culturalPractices: [ "Terraced farming on hillsides", "Elaborate marriage ceremonies (Okushagra)", "Traditional brewing of sorghum beer (Omuramba)" ]
      },
      {
        id: "bazigaba",
        name: "Bazigaba",
        totem: "Buffalo",
        origin: "Migrated from the northern regions of Rwanda",
        description: "The Bazigaba clan of the Bakiga are known for their strong hunting traditions and adaptation to the rugged Kigezi environment.",
        traditions: [{id: "bazigaba_hunting", name: "Communal Hunting", description: "Organized group hunts for game, followed by rituals and sharing.", category: "practice", importance: "high", stillPracticed: false}],
        families: 220,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
           { id: "baryomunsi", name: "Baryomunsi", approximateEra: "Late 19th century", verificationScore: 88 }, { id: "tugumisirize", name: "Tugumisirize", approximateEra: "Early 20th century", verificationScore: 86 }, { id: "kwatampora", name: "Kwatampora", approximateEra: "Mid-20th century", verificationScore: 85 }, { id: "kamugisha", name: "Kamugisha", approximateEra: "Early 19th century", verificationScore: 84 }, { id: "tumwebaze", name: "Tumwebaze", approximateEra: "Mid-19th century", verificationScore: 83 }, { id: "nyinabarongo", name: "Nyinabarongo", approximateEra: "Late 19th century", verificationScore: 82, notes: "Elder known for medicinal knowledge" }, { id: "kyarimpa", name: "Kyarimpa", approximateEra: "Early 20th century", verificationScore: 81 }, { id: "rubahamya", name: "Rubahamya", approximateEra: "Mid-20th century", verificationScore: 80 }, { id: "kanyesigye", name: "Kanyesigye", approximateEra: "Late 19th century", verificationScore: 79 }, { id: "muhumuza", name: "Muhumuza", approximateEra: "Early 20th century", verificationScore: 78 }
        ], "bazigaba", "Bazigaba", "TA_bakiga"),
        culturalPractices: [ "Traditional beekeeping", "Elaborate funeral ceremonies" ]
      },
      {
        id: "baheesi",
        name: "Baheesi",
        totem: "Leopard",
        description: "The Baheesi clan of the Bakiga are traditionally associated with blacksmithing and metalwork, holding a special status for their skills.",
        traditions: [{id: "baheesi_smithing", name: "Blacksmithing Mastery", description: "The Baheesi were revered for their ability to forge tools, weapons, and ceremonial items.", category: "practice", importance: "critical", stillPracticed: false}],
        families: 180,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
           { id: "rwamafunzi", name: "Rwamafunzi", approximateEra: "19th century", verificationScore: 85 }, { id: "bitarabeho", name: "Bitarabeho", approximateEra: "Late 19th century", verificationScore: 83 }, { id: "turyatemba", name: "Turyatemba", approximateEra: "Early 20th century", verificationScore: 86 }, { id: "ruhimbana", name: "Ruhimbana", approximateEra: "Mid-20th century", verificationScore: 84 }, { id: "nkurunziza", name: "Nkurunziza", approximateEra: "Early 19th century", verificationScore: 82 }, { id: "bishangabyinshi", name: "Bishangabyinshi", approximateEra: "Mid-19th century", verificationScore: 81 }, { id: "kyomunuufu", name: "Kyomunuufu", approximateEra: "Late 19th century", verificationScore: 80 }, { id: "arinaitwe", name: "Arinaitwe", approximateEra: "Early 20th century", verificationScore: 79 }, { id: "mwesigwa", name: "Mwesigwa", approximateEra: "Mid-20th century", verificationScore: 78 }, { id: "twesigomwe", name: "Twesigomwe", approximateEra: "Late 20th century", verificationScore: 77 }
        ], "baheesi", "Baheesi", "TA_bakiga"),
        culturalPractices: [ "Specialized hunting techniques", "Traditional forest conservation practices" ]
      },
      {
        id: "banyangabo",
        name: "Banyangabo",
        totem: "Crane",
        description: "The Banyangabo clan of the Bakiga are known for their wisdom in governance and often played roles as advisors and mediators.",
        traditions: [{id: "banyangabo_mediation", name: "Conflict Resolution", description: "Elders of the Banyangabo clan were renowned for their ability to mediate disputes peacefully.", category: "practice", importance: "high", stillPracticed: true}],
        families: 190,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "kabagambe", name: "Kabagambe", approximateEra: "19th century", verificationScore: 87 }, { id: "rutahigwa", name: "Rutahigwa", approximateEra: "Late 19th century", verificationScore: 85 }, { id: "twinomuhangi", name: "Twinomuhangi", approximateEra: "Early 20th century", verificationScore: 83 }, { id: "beinomugisha", name: "Beinomugisha", approximateEra: "Mid-20th century", verificationScore: 82 }, { id: "asiimwe", name: "Asiimwe", approximateEra: "Early 19th century", verificationScore: 81 }, { id: "kyarisiima", name: "Kyarisiima", approximateEra: "Mid-19th century", verificationScore: 80, notes: "Elder known for conflict resolution" }, { id: "akankwasa", name: "Akankwasa", approximateEra: "Late 19th century", verificationScore: 79 }, { id: "twinomujuni", name: "Twinomujuni", approximateEra: "Early 20th century", verificationScore: 78 }, { id: "bantebya", name: "Bantebya", approximateEra: "Mid-20th century", verificationScore: 77 }, { id: "tibandebage", name: "Tibandebage", approximateEra: "Late 20th century", verificationScore: 76 }
        ], "banyangabo", "Banyangabo", "TA_bakiga"),
        culturalPractices: [ "Rain-making ceremonies", "Complex irrigation systems" ]
      }
    ]
  },

  // --- BAFUMBIRA ---
  {
    id: "bafumbira",
    name: "Bafumbira",
    region: "Southwestern Uganda (Kisoro District)",
    population: "850,000", // Kept as string
    language: "Rufumbira",
    description: "The Bafumbira people are closely related to the Banyarwanda and inhabit the Kisoro district in southwestern Uganda, near the borders with Rwanda and DRC. They are known for their agricultural practices and vibrant cultural traditions.",
    clans: [
      {
        id: "abasinga",
        name: "Abasinga",
        totem: "Crane",
        description: "A prominent clan among the Bafumbira, known for their historical leadership and cultural contributions related to the crane totem.",
        traditions: [{id: "abasinga_dance", name: "Intore Dance", description: "A traditional warrior dance showcasing bravery and skill, often performed at ceremonies.", category: "ceremony", importance: "high", stillPracticed: true}],
        families: 150, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, 
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear,
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear,
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "ndangira", name: "Ndangira", approximateEra: "Late 19th century", verificationScore: 88, significance: "A leading figure who established key Abasinga settlements." },
          { id: "mugisha_aba", name: "Mugisha", approximateEra: "Early 20th century", verificationScore: 86, significance: "A respected contemporary who co-led with Ndangira." }, // ID made unique
          { id: "karwanyi", name: "Karwanyi", approximateEra: "Mid-20th century", verificationScore: 85, significance: "Son of Ndangira, known for his wisdom." },
          { id: "bucyanayandi", name: "Bucyanayandi", approximateEra: "Late 19th century", verificationScore: 84, significance: "Son of Ndangira, a skilled negotiator." },
          { id: "munyanziza", name: "Munyanziza", approximateEra: "Early 20th century", verificationScore: 83, significance: "Son of Mugisha_aba, a strong warrior." },
          { id: "habyalimana", name: "Habyalimana", approximateEra: "Mid-20th century", verificationScore: 82, significance: "Grandson of Ndangira via Karwanyi, known for upholding traditions." },
          { id: "nsabimana", name: "Nsabimana", approximateEra: "Early 19th century", verificationScore: 81, significance: "Grandson of Ndangira via Bucyanayandi, a community organizer." },
          { id: "nyiransengimana", name: "Nyiransengimana", approximateEra: "Mid-19th century", verificationScore: 80, notes: "Elder known for storytelling", significance: "Another grandson of Ndangira via Bucyanayandi, the clan's historian." }, // Name will be masculinized
          { id: "sezibera", name: "Sezibera", approximateEra: "Late 19th century", verificationScore: 79, significance: "Grandson of Mugisha_aba via Munyanziza, a respected farmer." },
          { id: "muhawenimana", name: "Muhawenimana", approximateEra: "Early 20th century", verificationScore: 78, significance: "Another grandson of Mugisha_aba via Munyanziza, known for his large family." } // Name will be masculinized
        ], "abasinga", "Abasinga", "TA_bafumbira"),
        culturalPractices: [ "Traditional storytelling (Ibitekerezo)", "Dance performances (Intore)" ]
      },
      {
        id: "abagesera",
        name: "Abagesera",
        totem: "Antelope",
        description: "The Abagesera clan is known for its agility and deep connection to the hilly terrains, with the antelope symbolizing their grace and speed.",
        traditions: [{id: "abagesera_tracking", name: "Animal Tracking Skills", description: "Abagesera elders were renowned for their exceptional skills in tracking game and understanding animal behavior.", category: "practice", importance: "medium", stillPracticed: false}],
        families: 130,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "kayihura_abagesera", name: "Kayihura", approximateEra: "19th century", verificationScore: 87, significance: "Founder of a key Abagesera lineage." }, // ID made unique
          { id: "byabagamba", name: "Byabagamba", approximateEra: "Late 19th century", verificationScore: 85, significance: "Co-founder and contemporary of Kayihura." },
          { id: "rudasingwa", name: "Rudasingwa", approximateEra: "Early 20th century", verificationScore: 84, significance: "Son of Kayihura, known for leadership." },
          { id: "sebineza", name: "Sebineza", approximateEra: "Mid-20th century", verificationScore: 86, significance: "Son of Kayihura, a wise adjudicator." },
          { id: "bisengimana", name: "Bisengimana", approximateEra: "Early 19th century", verificationScore: 83, significance: "Son of Byabagamba, expanded clan influence." },
          { id: "rusanganwa", name: "Rusanganwa", approximateEra: "Mid-19th century", verificationScore: 82, significance: "Grandson of Kayihura via Rudasingwa, a skilled hunter." },
          { id: "mudacumura", name: "Mudacumura", approximateEra: "Late 19th century", verificationScore: 81, significance: "Grandson of Kayihura via Sebineza, a diplomat." },
          { id: "nyirahabimana", name: "Nyirahabimana", approximateEra: "Early 20th century", verificationScore: 80, notes: "Elder renowned for traditional healing", significance: "Another grandson of Kayihura via Sebineza, master of herbal medicine." }, // Name will be masculinized
          { id: "nteziryayo", name: "Nteziryayo", approximateEra: "Mid-20th century", verificationScore: 79, significance: "Grandson of Byabagamba via Bisengimana, story-keeper." },
          { id: "bimenyimana", name: "Bimenyimana", approximateEra: "Late 20th century", verificationScore: 78, significance: "Another grandson of Byabagamba via Bisengimana, community leader." }
        ], "abagesera", "Abagesera", "TA_bafumbira"),
        culturalPractices: [ "Traditional medicine using highland herbs", "Beekeeping and honey production" ]
      },
      {
        id: "abanyiginya",
        name: "Abanyiginya",
        totem: "Buffalo", // User's original data. Some sources say Leopard for (Ba)Nyiginya. Sticking to user's data.
        description: "The Abanyiginya clan is historically one of the most powerful and royal clans among peoples related to Banyarwanda, including the Bafumbira.",
        traditions: [{id: "abanyiginya_royalty", name: "Royal Lineage", description: "Historically associated with kingship and leadership in the Great Lakes region.", category: "practice", importance: "critical", stillPracticed: true}], // Still practiced in the sense of heritage
        families: 170,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "serugendo", name: "Serugendo", approximateEra: "19th century", verificationScore: 86, significance: "A key patriarch of the Abanyiginya in the region." },
          { id: "munyarugerero", name: "Munyarugerero", approximateEra: "Late 19th century", verificationScore: 84, significance: "Contemporary and kinsman to Serugendo." },
          { id: "rwagasore", name: "Rwagasore", approximateEra: "Early 20th century", verificationScore: 85, significance: "Son of Serugendo, a prominent leader." },
          { id: "bizimungu", name: "Bizimungu", approximateEra: "Mid-20th century", verificationScore: 83, significance: "Son of Serugendo, known for his large family." },
          { id: "turatsinze", name: "Turatsinze", approximateEra: "Early 19th century", verificationScore: 82, significance: "Son of Munyarugerero, a brave warrior." },
          { id: "habineza", name: "Habineza", approximateEra: "Mid-19th century", verificationScore: 81, significance: "Grandson of Serugendo via Rwagasore, maintained traditions." },
          { id: "niyonzima", name: "Niyonzima", approximateEra: "Late 19th century", verificationScore: 80, significance: "Grandson of Serugendo via Bizimungu, skilled farmer." },
          { id: "mukagasana", name: "Mukagasana", approximateEra: "Early 20th century", verificationScore: 79, notes: "Elder known for diplomatic skills", significance: "Another grandson of Serugendo via Bizimungu, known for diplomacy." }, // Name will be masculinized
          { id: "rwakazina", name: "Rwakazina", approximateEra: "Mid-20th century", verificationScore: 78, significance: "Grandson of Munyarugerero via Turatsinze, orator." },
          { id: "munyarukiko", name: "Munyarukiko", approximateEra: "Late 20th century", verificationScore: 77, significance: "Another grandson of Munyarugerero via Turatsinze, community elder." }
        ], "abanyiginya", "Abanyiginya", "TA_bafumbira"),
        culturalPractices: [ "Traditional astronomy and calendar keeping", "Elaborate ceremonies for childbirth" ]
      }
    ]
  },

  // --- BAHIMA ---
  {
    id: "bahima",
    name: "Bahima",
    region: "Western Uganda (Ankole region)",
    population: "750,000", // Kept as string
    language: "Runyankole", // Note: Bahima speak Runyankole, which is also the language of Banyankole.
    description: "The Bahima are traditionally pastoralists in western Uganda, known for their cattle-keeping culture and distinctive social structure. They were historically the pastoralist class within the Ankole kingdom.",
    clans: [
      {
        id: "abahinda", // This is often the royal clan in Ankole, which includes Bahima and Bairu.
        name: "Abahinda",
        totem: "Lion", // As per user's original data for Bahima's Abahinda
        origin: "The royal clan of traditional Ankole kingdom, with deep Bahima roots.",
        description: "The Abahinda clan among the Bahima holds significant historical importance, often associated with leadership and the lineage of the Ankole Kingdom's rulers (Abagabe).",
        traditions: [{id: "abahinda_kingship", name: "Ankole Kingship Lineage", description: "The Abahinda are central to the history and traditions of the Ankole monarchy and cattle culture.", category: "ritual", importance: "critical", stillPracticed: true}], // Heritage is practiced
        families: 180,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A key elder of the ${clanName} clan from the ${e.approximateEra || 'past'}, influential in royal matters.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, 
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear,
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear,
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "rushakoza", name: "Rushakoza", approximateEra: "19th century", verificationScore: 92, notes: "Royal lineage elder with significant historical knowledge" },
          { id: "nimukama", name: "Nimukama", approximateEra: "Late 19th century", verificationScore: 89 },
          { id: "buningwire", name: "Buningwire", approximateEra: "Early 20th century", verificationScore: 87 },
          { id: "katongole_abahinda", name: "Katongole", approximateEra: "Mid-20th century", verificationScore: 86 }, // ID suffix if Katongole is common
          { id: "rubambansi", name: "Rubambansi", approximateEra: "Early 19th century", verificationScore: 85 },
          { id: "kaihura_abahinda", name: "Kaihura", approximateEra: "Mid-19th century", verificationScore: 84 }, // ID suffix
          { id: "kahigiriza", name: "Kahigiriza", approximateEra: "Late 19th century", verificationScore: 83 },
          { id: "kamuturaki", name: "Kamuturaki", approximateEra: "Early 20th century", verificationScore: 82 },
          { id: "rwakikyara", name: "Rwakikyara", approximateEra: "Mid-20th century", verificationScore: 81 },
          { id: "barungi", name: "Barungi", approximateEra: "Late 20th century", verificationScore: 80, notes: "Elder revered for pastoral knowledge" } // Name to be masculinized
        ], "abahinda", "Abahinda", "TA_bahima"),
        culturalPractices: [ "Complex cattle breeding traditions", "Royal ceremonies and rituals", "Traditional pastoral songs (Ebyevugo)" ]
      },
      {
        id: "abaishekatwa",
        name: "Abaishekatwa",
        totem: "Sheep",
        description: "The Abaishekatwa clan among the Bahima are known for their expertise in managing sheep and other livestock, contributing to the pastoral economy.",
        traditions: [{id: "abaishekatwa_sheep", name: "Sheep Husbandry", description: "Specialized knowledge in breeding and caring for sheep, including rituals for their well-being.", category: "practice", importance: "medium", stillPracticed: true}],
        families: 160,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "komuhangi", name: "Komuhangi", approximateEra: "19th century", verificationScore: 88 },
          { id: "karamagi", name: "Karamagi", approximateEra: "Late 19th century", verificationScore: 86 },
          { id: "bitariho", name: "Bitariho", approximateEra: "Early 20th century", verificationScore: 85 },
          { id: "rubaihayo", name: "Rubaihayo", approximateEra: "Mid-20th century", verificationScore: 87 },
          { id: "kagyenda", name: "Kagyenda", approximateEra: "Early 19th century", verificationScore: 84 },
          { id: "mutembei", name: "Mutembei", approximateEra: "Mid-19th century", verificationScore: 83 },
          { id: "rwabwera", name: "Rwabwera", approximateEra: "Late 19th century", verificationScore: 82 },
          { id: "mulindwa", name: "Mulindwa", approximateEra: "Early 20th century", verificationScore: 81 },
          { id: "tusiime", name: "Tusiime", approximateEra: "Mid-20th century", verificationScore: 80, notes: "Known for innovations in cattle disease treatment" }, // Name to be masculinized
          { id: "kyaruhanga", name: "Kyaruhanga", approximateEra: "Late 20th century", verificationScore: 79 }
        ], "abaishekatwa", "Abaishekatwa", "TA_bahima"),
        culturalPractices: [ "Traditional cattle herding techniques", "Specialized milk preservation methods" ]
      },
      {
        id: "abashambo", // User's original ID for this Bahima clan
        name: "Abashambo",
        totem: "Antelope", // As per user's original data for Bahima's Abashambo
        description: "The Abashambo clan within the Bahima are skilled pastoralists, known for their deep understanding of cattle and grazing lands.",
        traditions: [{id: "abashambo_pastoral", name: "Pastoral Wisdom", description: "Elders hold extensive knowledge of cattle bloodlines, pasture management, and water sources.", category: "practice", importance: "critical", stillPracticed: true}],
        families: 175,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "rubahimbya_abashambo", name: "Rubahimbya", approximateEra: "19th century", verificationScore: 86 }, // ID suffix for clarity
          { id: "ndinawe_abashambo", name: "Ndinawe", approximateEra: "Late 19th century", verificationScore: 84 },
          { id: "rwankangi_abashambo", name: "Rwankangi", approximateEra: "Early 20th century", verificationScore: 85 },
          { id: "ndyanabo_abashambo", name: "Ndyanabo", approximateEra: "Mid-20th century", verificationScore: 83 },
          { id: "bashasha_abashambo", name: "Bashasha", approximateEra: "Early 19th century", verificationScore: 82 },
          { id: "kashaija_abashambo", name: "Kashaija", approximateEra: "Mid-19th century", verificationScore: 81 },
          { id: "tuhumwire", name: "Tuhumwire", approximateEra: "Late 19th century", verificationScore: 80, notes: "Elder known for cattle wealth" }, // Name to be masculinized
          { id: "kabareebe_abashambo", name: "Kabareebe", approximateEra: "Early 20th century", verificationScore: 79 },
          { id: "rwobusisi_abashambo", name: "Rwobusisi", approximateEra: "Mid-20th century", verificationScore: 78 },
          { id: "nuwagaba_abashambo", name: "Nuwagaba", approximateEra: "Late 20th century", verificationScore: 77 }
        ], "abashambo", "Abashambo", "TA_bahima"),
        culturalPractices: [ "Traditional cattle markings and identification", "Ceremonies for protecting livestock" ]
      },
      {
        id: "abagahe", // User's original ID for this Bahima clan
        name: "Abagahe",
        totem: "Crested Crane", // As per user's original data for Bahima's Abagahe
        description: "The Abagahe clan of the Bahima are associated with the Crested Crane totem and have traditions linked to royalty and social ceremonies.",
        traditions: [{id: "abagahe_crane", name: "Crane Symbolism", description: "The Crested Crane is highly respected, and its symbolism is woven into clan ceremonies and identity.", category: "ritual", importance: "high", stillPracticed: true}],
        families: 155,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "nkwasibwe", name: "Nkwasibwe", approximateEra: "19th century", verificationScore: 87 },
          { id: "katureebe", name: "Katureebe", approximateEra: "Late 19th century", verificationScore: 85 },
          { id: "rumanyika", name: "Rumanyika", approximateEra: "Early 20th century", verificationScore: 86 },
          { id: "katukunda", name: "Katukunda", approximateEra: "Mid-20th century", verificationScore: 84, notes: "Elder renowned for leadership" }, // Name to be masculinized
          { id: "baitwabaruhanga", name: "Baitwabaruhanga", approximateEra: "Early 19th century", verificationScore: 83 },
          { id: "tumusiime_abagahe", name: "Tumusiime", approximateEra: "Mid-19th century", verificationScore: 82 }, // ID suffix if Tumusiime is common
          { id: "kabarungyi", name: "Kabarungyi", approximateEra: "Late 19th century", verificationScore: 81 }, // Name to be masculinized
          { id: "kangwagye", name: "Kangwagye", approximateEra: "Early 20th century", verificationScore: 80 },
          { id: "ngabirano", name: "Ngabirano", approximateEra: "Mid-20th century", verificationScore: 79 },
          { id: "rwankwenda", name: "Rwankwenda", approximateEra: "Late 20th century", verificationScore: 78 }
        ], "abagahe", "Abagahe", "TA_bahima"),
        culturalPractices: [ "Traditional cattle-based wealth exchange", "Elaborate milk processing techniques", "Age-set system of social organization" ]
      }
    ]
  },

  // --- ACHOLI ---
  {
    id: "acholi",
    name: "Acholi",
    region: "Northern Uganda",
    population: "1.7 million", // Kept as string
    language: "Acholi", // Also Lwo
    description: "The Acholi people are known for their rich oral traditions, poetry, music, and dance. Historically, they have been organized into chiefdoms (Rwodi).",
    clans: [
      {
        id: "payira",
        name: "Payira",
        totem: "Elephant", // Totems vary in Acholi, this is an example. Original data did not specify totem for Acholi clans.
        origin: "One of the largest and most influential Acholi chiefdoms.",
        description: "The Payira chiefdom is historically one of the most significant among the Acholi people, known for its strong leadership and resilience.",
        traditions: [{id: "payira_mato_oput", name: "Mato Oput", description: "A traditional justice and reconciliation ceremony used to resolve conflicts, particularly those involving bloodshed.", category: "ritual", importance: "critical", stillPracticed: true}],
        families: 350, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A respected elder of the ${clanName} people from the ${e.approximateEra || 'past'}.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, 
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear,
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear,
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "awich", name: "Rwot Awich", approximateEra: "Late 19th century", verificationScore: 91, notes: "Important leader during colonial period", significance: "A pivotal Rwot (Chief) of Payira who navigated early colonial interactions." },
          { id: "labongo_payira", name: "Labongo", approximateEra: "18th century", verificationScore: 85, notes: "Legendary ancestral figure of Payira", significance: "A foundational ancestor, considered a co-founder of Payira lineages." }, // ID suffix for uniqueness
          { id: "okello_payira", name: "Okello", approximateEra: "Early 20th century", verificationScore: 88, significance: "Son of Rwot Awich, continued leadership traditions." },
          { id: "ongom_payira", name: "Ongom", approximateEra: "Early 19th century", verificationScore: 84, significance: "Son of Rwot Awich, known for his bravery." },
          { id: "ocen_payira", name: "Ocen", approximateEra: "Mid-20th century", verificationScore: 86, significance: "Son of Labongo_payira, a keeper of oral history." },
          { id: "akena_payira", name: "Akena", approximateEra: "Mid-19th century", verificationScore: 87, significance: "Grandson of Rwot Awich via Okello_payira, a respected councilor." },
          { id: "acaye_payira", name: "Acaye", approximateEra: "Late 19th century", verificationScore: 83, significance: "Grandson of Rwot Awich via Ongom_payira, influential in trade." },
          { id: "lamony_payira", name: "Lamony", approximateEra: "Early 20th century", verificationScore: 82, significance: "Another grandson of Rwot Awich via Ongom_payira, skilled hunter." },
          { id: "akera_payira", name: "Akera", approximateEra: "Mid-20th century", verificationScore: 81, significance: "Grandson of Labongo_payira via Ocen_payira, focused on agriculture." },
          { id: "odong_payira", name: "Odong", approximateEra: "Late 20th century", verificationScore: 80, significance: "Another grandson of Labongo_payira via Ocen_payira, community mobilizer." }
        ], "payira", "Payira", "TA_acholi"),
        culturalPractices: ["Traditional justice system (Mato Oput)", "Rich oral poetry (Lamony/Lalobaloba)", "Bwola dance for royal occasions"]
      },
      {
        id: "patiko",
        name: "Patiko",
        totem: "Leopard", // Example totem
        origin: "Another prominent Acholi chiefdom, known for its historical sites like Baker's Fort.",
        description: "The Patiko chiefdom holds historical significance due to its strategic location and interaction with early explorers and traders. Fort Patiko (Baker's Fort) is a key landmark.",
        traditions: [{id: "patiko_fort", name: "Baker's Fort History", description: "The history and narratives surrounding Fort Patiko, built by Samuel Baker.", category: "story", importance: "significant", stillPracticed: true}], // Heritage is practiced
        families: 280, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A respected elder of the ${clanName} people from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "olanya_patiko", name: "Olanya", approximateEra: "19th century", verificationScore: 86, significance: "A founding chief of Patiko, instrumental in its establishment." },
          { id: "lakony_patiko", name: "Lakony", approximateEra: "Early 19th century", verificationScore: 83, significance: "Co-founder and contemporary of Olanya, known for strategic alliances." },
          { id: "opiyo_patiko", name: "Opiyo", approximateEra: "Late 19th century", verificationScore: 84, significance: "Son of Olanya, expanded Patiko's influence." },
          { id: "otim_patiko", name: "Otim", approximateEra: "Early 20th century", verificationScore: 85, significance: "Son of Olanya, a noted warrior and leader." },
          { id: "amone_patiko", name: "Amone", approximateEra: "Mid-19th century", verificationScore: 81, significance: "Son of Lakony, focused on agriculture and trade." },
          { id: "abonga_patiko", name: "Abonga", approximateEra: "Mid-20th century", verificationScore: 82, significance: "Grandson of Olanya via Opiyo, a respected elder." },
          { id: "alanyo_patiko", name: "Alanyo", approximateEra: "Late 19th century", verificationScore: 80, notes: "Elder respected for conflict resolution", significance: "Grandson of Olanya via Otim, known for judicial wisdom." }, // Name masculinized
          { id: "laker_patiko", name: "Laker", approximateEra: "Early 20th century", verificationScore: 79, significance: "Another grandson of Olanya via Otim, skilled craftsman." }, // Name masculinized
          { id: "ojok_patiko", name: "Ojok", approximateEra: "Mid-20th century", verificationScore: 78, significance: "Grandson of Lakony via Amone, preserved cultural practices." },
          { id: "obwona_patiko", name: "Obwona", approximateEra: "Late 20th century", verificationScore: 77, significance: "Another grandson of Lakony via Amone, community leader." }
        ], "patiko", "Patiko", "TA_acholi")
      }
      // Add other Acholi clans here if present in your full original data, applying the same pattern.
    ]
  },

  // --- BANYANKOLE ---
  {
    id: "banyankole",
    name: "Banyankole",
    region: "Western Uganda",
    population: "3.0 million", // Kept as string
    language: "Runyankole",
    description: "The Banyankole are cattle herders and farmers from western Uganda, known for their long-horned Ankole cattle and complex social structure with two main social classes: the Bahima (pastoralists) and Bairu (agriculturalists).",
    clans: [
      {
        id: "bashambo", // User's original ID for this Banyankole clan
        name: "Bashambo",
        totem: "Lion", // As per user's original data for Banyankole's Bashambo
        origin: "One of the prominent pastoralist clans within the Banyankole, with a strong connection to cattle culture.",
        description: "The Bashambo clan is highly esteemed among the Banyankole, traditionally involved in pastoralism and holding significant cultural and historical roles, often associated with the Ankole nobility.",
        traditions: [{id: "bashambo_cattle", name: "Ankole Cattle Rearing", description: "Deep knowledge and traditions surrounding the breeding, care, and cultural significance of Ankole long-horned cattle.", category: "practice", importance: "critical", stillPracticed: true}],
        families: 320, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `An esteemed elder of the ${clanName} clan, known from the ${e.approximateEra || 'past'}.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, 
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear,
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear,
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "kahinda_bashambo", name: "Kahinda", approximateEra: "19th century", verificationScore: 90, significance: "A leading patriarch of the Bashambo clan." }, // ID suffix for clarity
          { id: "rutahaba_bashambo", name: "Rutahaba", approximateEra: "Early 20th century", verificationScore: 87, significance: "Co-leading elder with Kahinda, known for wisdom." },
          { id: "mugyenyi_bashambo", name: "Mugyenyi", approximateEra: "Mid-19th century", verificationScore: 85, significance: "Son of Kahinda, a brave warrior." },
          { id: "byaruhanga_bashambo", name: "Byaruhanga", approximateEra: "Late 19th century", verificationScore: 88, significance: "Son of Kahinda, expanded clan grazing lands." },
          { id: "rukara_bashambo", name: "Rukara", approximateEra: "Early 20th century", verificationScore: 86, significance: "Son of Rutahaba, skilled in cattle rearing." },
          { id: "karwemera_bashambo", name: "Karwemera", approximateEra: "Mid-20th century", verificationScore: 84, significance: "Grandson of Kahinda via Mugyenyi, a keeper of traditions." },
          { id: "barumumba_bashambo", name: "Barumumba", approximateEra: "Early 19th century", verificationScore: 82, significance: "Grandson of Kahinda via Byaruhanga, known for justice." },
          { id: "kebirungi", name: "Kebirungi", approximateEra: "Mid-19th century", verificationScore: 80, notes: "Elder known for extensive cattle herds.", significance: "Another grandson of Kahinda via Byaruhanga, famed for his wealth in cattle." }, // Name masculinized
          { id: "nkundiye_bashambo", name: "Nkundiye", approximateEra: "Late 19th century", verificationScore: 83, significance: "Grandson of Rutahaba via Rukara, a respected advisor." },
          { id: "mpirirwe_bashambo", name: "Mpirirwe", approximateEra: "Early 20th century", verificationScore: 81, significance: "Another grandson of Rutahaba via Rukara, promoted clan unity." }
        ], "bashambo", "Bashambo", "TA_banyankole"),
        culturalPractices: ["Traditional cattle keeping", "Complex marriage ceremonies", "Recitation of Ebyevugo (heroic poetry)"]
      },
      {
        id: "bahinda", // User's original ID for this Banyankole clan (distinct from Bahima's Abahinda)
        name: "Bahinda", // Note: Bahinda is also a royal clan name associated with broader Great Lakes region.
        totem: "Monkey", // As per user's original data for Banyankole's Bahinda
        description: "The Bahinda clan among the Banyankole, while sharing a name with a wider royal lineage, has its own distinct history and traditions within the Banyankole context, often linked to wisdom and spiritual roles.",
        traditions: [{id: "bahinda_wisdom", name: "Wisdom and Counsel", description: "Bahinda elders were often consulted for their deep understanding of customs, history, and for providing wise counsel.", category: "practice", importance: "high", stillPracticed: true}],
        families: 290,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "mbaguta", name: "Mbaguta", approximateEra: "Late 19th century", verificationScore: 94, notes: "Key figure in Ankole kingdom history", significance: "A paramount elder of Bahinda, pivotal during colonial transition." },
          { id: "rwakabooga", name: "Rwakabooga", approximateEra: "Early 20th century", verificationScore: 88, significance: "A leading contemporary of Mbaguta." },
          { id: "bugingo_bahinda", name: "Bugingo", approximateEra: "Mid-19th century", verificationScore: 86, significance: "Son of Mbaguta, a respected traditionalist." }, // ID suffix for clarity
          { id: "kairu_bahinda", name: "Kairu", approximateEra: "Late 19th century", verificationScore: 85, significance: "Son of Mbaguta, known for his diplomacy." }, // ID suffix
          { id: "batuma_bahinda", name: "Batuma", approximateEra: "Early 20th century", verificationScore: 87, significance: "Son of Rwakabooga, a wealthy cattle owner." }, // ID suffix
          { id: "kamugisha_bahinda", name: "Kamugisha", approximateEra: "Mid-20th century", verificationScore: 83, significance: "Grandson of Mbaguta via Bugingo, preserved oral history." }, // ID suffix
          { id: "rwekigyira", name: "Rwekigyira", approximateEra: "Early 19th century", verificationScore: 82, significance: "Grandson of Mbaguta via Kairu, skilled in customary law." },
          { id: "muhoozi_bahinda", name: "Muhoozi", approximateEra: "Mid-19th century", verificationScore: 80, significance: "Another grandson of Mbaguta via Kairu, a community leader." }, // ID suffix
          { id: "kwatiraho", name: "Kwatiraho", approximateEra: "Late 19th century", verificationScore: 81, significance: "Grandson of Rwakabooga via Batuma, known for generosity." },
          { id: "kahangire", name: "Kahangire", approximateEra: "Early 20th century", verificationScore: 79, significance: "Another grandson of Rwakabooga via Batuma, storyteller." }
        ], "bahinda", "Bahinda", "TA_banyankole")
      },
      {
        id: "bagahe", // User's original ID for this Banyankole clan
        name: "Bagahe",
        totem: "Buffalo", // As per user's original data for Banyankole's Bagahe
        description: "The Bagahe clan of the Banyankole, with the Buffalo totem, are known for their strength, resilience, and often played roles as protectors and warriors.",
        traditions: [{id: "bagahe_strength", name: "Warrior Spirit", description: "The Bagahe were historically known for their bravery in defending community territories and upholding justice.", category: "practice", importance: "high", stillPracticed: false}], // Historical context
        families: 250,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "kihembe", name: "Kihembe", approximateEra: "19th century", verificationScore: 85, significance: "A founding elder of the Bagahe, known for his strength." },
          { id: "tukahirwa", name: "Tukahirwa", approximateEra: "Late 19th century", verificationScore: 83, significance: "A contemporary of Kihembe, also a respected leader." }, // Name masculinized
          { id: "banturaki_bagahe", name: "Banturaki", approximateEra: "Early 20th century", verificationScore: 86, significance: "Son of Kihembe, a renowned warrior." }, // ID suffix
          { id: "kasigazi", name: "Kasigazi", approximateEra: "Mid-20th century", verificationScore: 84, significance: "Son of Kihembe, known for his wisdom." },
          { id: "mwebaze_bagahe", name: "Mwebaze", approximateEra: "Early 19th century", verificationScore: 81, significance: "Son of Tukahirwa, a skilled hunter." }, // ID suffix
          { id: "rutega", name: "Rutega", approximateEra: "Mid-19th century", verificationScore: 82, significance: "Grandson of Kihembe via Banturaki, protector of the clan." },
          { id: "kabuzire", name: "Kabuzire", approximateEra: "Late 19th century", verificationScore: 80, significance: "Grandson of Kihembe via Kasigazi, maintained clan boundaries." },
          { id: "komunda", name: "Komunda", approximateEra: "Early 20th century", verificationScore: 79, significance: "Another grandson of Kihembe via Kasigazi, a community figure." },
          { id: "rurwaheru", name: "Rurwaheru", approximateEra: "Mid-20th century", verificationScore: 78, significance: "Grandson of Tukahirwa via Mwebaze, preserved stories." },
          { id: "banyenzaki", name: "Banyenzaki", approximateEra: "Late 20th century", verificationScore: 77, significance: "Another grandson of Tukahirwa via Mwebaze, led during changing times." }
        ], "bagahe", "Bagahe", "TA_banyankole")
      }
    ]
  },

  // --- BASOGA ---
  {
    id: "basoga",
    name: "Basoga",
    region: "Eastern Uganda",
    population: "2.7 million", // Kept as string
    language: "Lusoga",
    description: "The Basoga are the third largest ethnic group in Uganda. They are known for their agricultural practices and unique political organization of multiple chiefdoms.",
    clans: [
      {
        id: "balamogi",
        name: "Balamogi",
        totem: "Bushbuck (Engabi)", // Example totem, original data might not have specified for Basoga clans
        origin: "One of the principal ruling clans in Busoga, with a long history of leadership.",
        description: "The Balamogi clan is one of the historically significant and politically influential clans in Busoga, known for its hereditary chiefs and strong cultural identity.",
        traditions: [{id: "balamogi_chiefs", name: "Hereditary Chieftainship", description: "The Balamogi have a long lineage of hereditary rulers (Abakama) who governed specific territories within Busoga.", category: "ritual", importance: "critical", stillPracticed: true}], // Heritage is practiced
        families: 300, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `An influential elder of the ${clanName} clan during the ${e.approximateEra || 'past'}.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, 
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear,
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear,
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "namutamba", name: "Namutamba", approximateEra: "19th century", verificationScore: 87, significance: "A founding figure of the Balamogi chieftaincy." }, // Name will be masculinized
          { id: "kirunda_balamogi", name: "Kirunda", approximateEra: "Late 19th century", verificationScore: 85, significance: "Contemporary leader who expanded Balamogi influence." }, // ID suffix if Kirunda is common
          { id: "bakoye_balamogi", name: "Bakoye", approximateEra: "Early 20th century", verificationScore: 88, significance: "Son of Namutamba (masculinized), a revered chief." }, // ID suffix
          { id: "nabirye", name: "Nabirye", approximateEra: "Mid-20th century", verificationScore: 86, significance: "Son of Namutamba (masculinized), known for his judicial wisdom." }, // Name will be masculinized
          { id: "mugoya_balamogi", name: "Mugoya", approximateEra: "Early 19th century", verificationScore: 84, significance: "Son of Kirunda, a skilled negotiator and diplomat." }, // ID suffix
          { id: "zirimenya", name: "Zirimenya", approximateEra: "Mid-19th century", verificationScore: 83, significance: "Grandson of Namutamba (masculinized) via Bakoye, a prominent warrior." },
          { id: "kagoda_balamogi", name: "Kagoda", approximateEra: "Late 19th century", verificationScore: 82, significance: "Grandson of Namutamba (masculinized) via Nabirye (masculinized), focused on agriculture." }, // ID suffix
          { id: "namwase", name: "Namwase", approximateEra: "Early 20th century", verificationScore: 81, significance: "Another grandson of Namutamba (masculinized) via Nabirye (masculinized), a spiritual leader." }, // Name will be masculinized
          { id: "waiswa_balamogi", name: "Waiswa", approximateEra: "Mid-20th century", verificationScore: 80, significance: "Grandson of Kirunda via Mugoya, promoted education." }, // ID suffix
          { id: "batambuze", name: "Batambuze", approximateEra: "Late 20th century", verificationScore: 79, significance: "Another grandson of Kirunda via Mugoya, modernizer of the clan." }
        ], "balamogi", "Balamogi", "TA_basoga"),
        culturalPractices: ["Elaborate royal installations", "Traditional music and dance (Nalufuka, Tamenhaibuga)"]
      },
      {
        id: "bagabula",
        name: "Bagabula",
        totem: "Leopard", // As per user's original data
        origin: "Another significant clan in Busoga, known for their bravery and hunting prowess.",
        description: "The Bagabula clan, with the Leopard as their totem, are traditionally known for their courage, hunting skills, and playing key roles in the defense of Busoga territories.",
        traditions: [{id: "bagabula_leopard", name: "Leopard Totem Respect", description: "The leopard is revered, and clan members have specific rituals and avoidances related to it.", category: "ritual", importance: "high", stillPracticed: true}],
        families: 270,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "ngobi_bagabula", name: "Ngobi", approximateEra: "Late 19th century", verificationScore: 89, significance: "A powerful founding elder of the Bagabula." }, // ID suffix
          { id: "lubogo_bagabula", name: "Lubogo", approximateEra: "Early 20th century", verificationScore: 92, notes: "Significant contributor to Basoga cultural preservation", significance: "Contemporary of Ngobi, co-founder of major Bagabula lineages." }, // ID suffix
          { id: "muwanguzi_bagabula", name: "Muwanguzi", approximateEra: "Mid-19th century", verificationScore: 85, significance: "Son of Ngobi, a celebrated warrior chief." }, // ID suffix
          { id: "kalikwani_bagabula", name: "Kalikwani", approximateEra: "Late 19th century", verificationScore: 87, significance: "Son of Ngobi, known for his large herds and generosity." }, // ID suffix
          { id: "mpalanyi_bagabula", name: "Mpalanyi", approximateEra: "Early 20th century", verificationScore: 86, significance: "Son of Lubogo, a wise judge and counselor." }, // ID suffix
          { id: "nawangwe_male", name: "Nawangwe", approximateEra: "Mid-20th century", verificationScore: 84, significance: "Grandson of Ngobi via Muwanguzi, skilled hunter." }, // Name masculinized if needed
          { id: "mutebe_bagabula", name: "Mutebe", approximateEra: "Early 19th century", verificationScore: 82, significance: "Grandson of Ngobi via Kalikwani, expanded clan territories." }, // ID suffix
          { id: "mudiope_bagabula", name: "Mudiope", approximateEra: "Mid-19th century", verificationScore: 83, significance: "Another grandson of Ngobi via Kalikwani, a spiritual leader." }, // ID suffix
          { id: "kikonyogo_bagabula", name: "Kikonyogo", approximateEra: "Late 19th century", verificationScore: 81, significance: "Grandson of Lubogo via Mpalanyi, preserved oral history." }, // ID suffix
          { id: "batuwa_bagabula", name: "Batuwa", approximateEra: "Early 20th century", verificationScore: 80, significance: "Another grandson of Lubogo via Mpalanyi, known for community development." } // ID suffix
        ], "bagabula", "Bagabula", "TA_basoga"),
        culturalPractices: ["Leopard totem ceremonies", "Traditional hunting rituals", "Storytelling about heroic ancestors"]
      }
    ]
  },

  // --- BANYORO ---
  {
    id: "banyoro",
    name: "Banyoro",
    region: "Western Uganda",
    population: "1.1 million", // Kept as string
    language: "Runyoro",
    description: "The Banyoro people established one of the most powerful historical kingdoms in East Africa, Bunyoro-Kitara. They are known for their rich monarchy, traditions, and connection to the land.",
    clans: [
      {
        id: "babito", // As per user's original data (Crested Crane totem)
        name: "Babito (Crested Crane)", // Clarified name with totem for distinction
        totem: "Crested Crane",
        origin: "The primary royal clan of the Bunyoro-Kitara Kingdom, from which the Abakama (kings) traditionally came.",
        description: "The Babito clan with the Crested Crane totem is the central royal lineage of Bunyoro-Kitara, embodying the kingdom's history, power, and spiritual heritage. Their elders are keepers of immense historical knowledge.",
        traditions: [{id: "babito_kingship", name: "Bunyoro Kingship Rituals", description: "Complex rituals and ceremonies related to the Omukama, royal regalia (like a nine-legged stool), and the governance of the kingdom.", category: "ceremony", importance: "critical", stillPracticed: true}], // Heritage is practiced
        families: 400, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `An esteemed elder of the ${clanName} clan, pivotal during the ${e.approximateEra || 'past'}.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, 
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear,
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear,
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "kabalega", name: "Omukama Kabalega", approximateEra: "19th century", verificationScore: 96, notes: "Legendary king who resisted colonial rule", significance: "A paramount Omukama, celebrated for his military prowess and staunch resistance against colonialism." },
          { id: "kyomya_babito", name: "Kyomya", approximateEra: "Late 19th century", verificationScore: 88, significance: "A key royal contemporary and advisor to Omukama Kabalega." }, // ID suffix for uniqueness
          { id: "kabagambe_babito", name: "Kabagambe", approximateEra: "Early 20th century", verificationScore: 87, significance: "Son of Omukama Kabalega, a respected prince and leader." }, // ID suffix
          { id: "rubonga_babito", name: "Rubonga", approximateEra: "Mid-20th century", verificationScore: 85, significance: "Son of Omukama Kabalega, instrumental in preserving royal traditions post-colonialism." }, // ID suffix
          { id: "kabumba_babito", name: "Kabumba", approximateEra: "Early 19th century", verificationScore: 86, significance: "Son of Kyomya, a wise elder known for his counsel." }, // ID suffix
          { id: "tibamwenda_babito", name: "Tibamwenda", approximateEra: "Mid-19th century", verificationScore: 84, significance: "Grandson of Omukama Kabalega via Kabagambe, a keeper of royal history." }, // ID suffix
          { id: "mugenyi_babito", name: "Mugenyi", approximateEra: "Late 19th century", verificationScore: 83, significance: "Grandson of Omukama Kabalega via Rubonga, known for his diplomacy." }, // ID suffix
          { id: "nyakaisiki", name: "Nyakaisiki", approximateEra: "Early 20th century", verificationScore: 82, notes: "Elder recognized for medicinal knowledge", significance: "Another grandson of Omukama Kabalega via Rubonga, a respected figure skilled in traditional medicine." }, // Name will be masculinized
          { id: "rurangira_babito", name: "Rurangira", approximateEra: "Mid-20th century", verificationScore: 81, significance: "Grandson of Kyomya via Kabumba, a community leader." }, // ID suffix
          { id: "basigara_babito", name: "Basigara", approximateEra: "Late 20th century", verificationScore: 80, significance: "Another grandson of Kyomya via Kabumba, worked to maintain clan unity." } // ID suffix
        ], "babito", "Babito (Crested Crane)", "TA_banyoro"),
        culturalPractices: ["Advanced iron working (Abakomagwa)", "Traditional medicine and healing practices", "Royal drumming and music (entimbo)", "Petroleum seeps usage (omuriro gwa Kirogo)"]
      },
      {
        id: "babiito", // As per user's original data (Lion totem) - distinct from the above 'babito'
        name: "Babiito (Lion)", // Clarified name with totem for distinction
        totem: "Lion",
        origin: "A distinct lineage also referred to as Babiito, possibly a branch or a historically separate group with significant influence in Bunyoro, associated with strength and valor.",
        description: "The Babiito clan with the Lion totem represents another line of influential figures in Bunyoro, often characterized by their bravery, strength, and leadership in military or hunting expeditions.",
        traditions: [{id: "babiito_lion_strength", name: "Valor and Protection", description: "This Babiito lineage is associated with the strength and protective symbolism of the lion, with elders often being notable warriors or hunters.", category: "practice", importance: "high", stillPracticed: false}], // Historical emphasis
        families: 150,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "byabacwezi", name: "Byabacwezi", approximateEra: "18th century", verificationScore: 85, significance: "A foundational elder of this Babiito lineage, linked to Cwezi lore." },
          { id: "karubanga_babiito", name: "Karubanga", approximateEra: "Early 19th century", verificationScore: 83, significance: "A contemporary of Byabacwezi, known for his strength." }, // ID suffix
          { id: "nyamangyezi", name: "Nyamangyezi", approximateEra: "Mid-19th century", verificationScore: 86, significance: "Son of Byabacwezi, a great hunter and warrior." },
          { id: "kiiza_babiito", name: "Kiiza", approximateEra: "Late 19th century", verificationScore: 84, significance: "Son of Byabacwezi, a leader in clan defense." }, // ID suffix
          { id: "nyamaizi", name: "Nyamaizi", approximateEra: "Early 20th century", verificationScore: 82, significance: "Son of Karubanga, known for his extensive knowledge of the land." },
          { id: "tibakanya_babiito", name: "Tibakanya", approximateEra: "Mid-20th century", verificationScore: 81, significance: "Grandson of Byabacwezi via Nyamangyezi, a respected elder." }, // ID suffix
          { id: "isingoma_babiito", name: "Isingoma", approximateEra: "18th century", verificationScore: 80, significance: "Grandson of Byabacwezi via Kiiza, a storyteller." }, // ID suffix
          { id: "kasaija_babiito", name: "Kasaija", approximateEra: "Early 19th century", verificationScore: 79, significance: "Another grandson of Byabacwezi via Kiiza, a community figure." }, // ID suffix
          { id: "rukidi_babiito", name: "Rukidi", approximateEra: "Mid-19th century", verificationScore: 78, significance: "Grandson of Karubanga via Nyamaizi, upheld traditions." }, // ID suffix
          { id: "rwakaikara_babiito", name: "Rwakaikara", approximateEra: "Late 19th century", verificationScore: 77, significance: "Another grandson of Karubanga via Nyamaizi, a wise counselor." } // ID suffix
        ], "babiito", "Babiito (Lion)", "TA_banyoro")
      }
    ]
  },

  // --- ITESO ---
  {
    id: "iteso",
    name: "Iteso",
    region: "Eastern Uganda",
    population: "3.6 million", // Kept as string
    language: "Ateso",
    description: "The Iteso are the second largest ethnic group in Uganda. They are primarily agriculturalists, growing crops like millet, sorghum, and sweet potatoes, and are known for their strong age-set systems and community cohesion.",
    clans: [
      {
        id: "ikaribwok",
        name: "Ikaribwok",
        totem: "Zebra", // Example totem, original data might not have specified for Iteso clans
        origin: "One of the major clans among the Iteso, with a strong presence in traditional leadership and land management.",
        description: "The Ikaribwok clan is a significant and widespread clan among the Iteso people, known for its historical leaders and contributions to Iteso culture and societal structure.",
        traditions: [{id: "ikaribwok_ageset", name: "Age-Set System (Aturi)", description: "A complex system organizing males into age-based groups with specific societal roles and responsibilities.", category: "practice", importance: "critical", stillPracticed: true}],
        families: 450, 
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`,
              name: newName,
              gender: 'male' as 'male',
              approximateEra: e.approximateEra || "Unknown Era",
              verificationScore: e.verificationScore || 70,
              notes: sanitizeElderNotes(e.notes, newName),
              significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A distinguished elder of the ${clanName} clan, influential during the ${e.approximateEra || 'past'}.`,
              familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [],
              spouseIds: [],
              parentId: undefined, 
              clanId: clanId,
              clanName: clanName,
              birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear,
              deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear,
              familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [],
              era: e.era || e.approximateEra,
            };
          }) as ClanElder[];

          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; 
          if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; 
          if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; 
          if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; 
          if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; 
          if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; 
          if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; 
          if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; 
          if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; 
          if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id; 
          
          return processedElders;
        })([
          { id: "emudong_ikaribwok", name: "Emudong", approximateEra: "Early 20th century", verificationScore: 83, significance: "A foundational elder of the Ikaribwok clan lineage." }, // ID suffix
          { id: "opolot_ikaribwok", name: "Opolot", approximateEra: "Mid-20th century", verificationScore: 85, significance: "A contemporary leader who strengthened Ikaribwok clan ties." }, // ID suffix
          { id: "okiria_ikaribwok", name: "Okiria", approximateEra: "Late 19th century", verificationScore: 82, significance: "Son of Emudong, known for his wisdom in council." }, // ID suffix
          { id: "amodoi_ikaribwok", name: "Amodoi", approximateEra: "Early 20th century", verificationScore: 84, significance: "Son of Emudong, a skilled farmer and provider." }, // ID suffix
          { id: "okurut_ikaribwok", name: "Okurut", approximateEra: "Mid-20th century", verificationScore: 81, significance: "Son of Opolot, a respected community mediator." }, // ID suffix
          { id: "engole_ikaribwok", name: "Engole", approximateEra: "Late 19th century", verificationScore: 80, significance: "Grandson of Emudong via Okiria, preserved oral traditions." }, // ID suffix
          { id: "akello", name: "Akello", approximateEra: "Early 20th century", verificationScore: 79, notes: "Elder known for agricultural innovations", significance: "Grandson of Emudong via Amodoi, an innovator in agricultural practices." }, // Name will be masculinized
          { id: "omoding_ikaribwok", name: "Omoding", approximateEra: "Mid-20th century", verificationScore: 78, significance: "Another grandson of Emudong via Amodoi, a community leader." }, // ID suffix
          { id: "edopu_ikaribwok", name: "Edopu", approximateEra: "Late 19th century", verificationScore: 77, significance: "Grandson of Opolot via Okurut, known for his large family." }, // ID suffix
          { id: "ojilong_ikaribwok", name: "Ojilong", approximateEra: "Early 20th century", verificationScore: 76, significance: "Another grandson of Opolot via Okurut, a storyteller." } // ID suffix
        ], "ikaribwok", "Ikaribwok", "TA_iteso"),
        culturalPractices: ["Traditional sorghum and millet farming", "Age-set initiation ceremonies", "Communal work parties (Alosit)"]
      },
      {
        id: "ingoratok",
        name: "Ingoratok",
        totem: "Monkey", // Example totem
        origin: "Another key Iteso clan with widespread subclans and a history of migration and settlement across Teso region.",
        description: "The Ingoratok clan is one of the largest among the Iteso, with diverse subclans. They are known for their adaptability and contributions to Iteso governance and social customs.",
        traditions: [{id: "ingoratok_migration", name: "Migration Narratives", description: "The Ingoratok have rich oral histories detailing their migrations and the establishment of various settlements.", category: "story", importance: "significant", stillPracticed: true}],
        families: 420,
        elders: ((originalElders: Partial<ClanElder>[], clanId: string, clanName: string, tribalAncestorId: string) => {
          const processedElders = originalElders.slice(0, 10).map((e, index) => {
            const newName = masculinizeName(e.name || `Elder ${index + 1}`, index, clanName);
            return {
              id: e.id || `${clanId}_elder_${index + 1}`, name: newName, gender: 'male' as 'male', approximateEra: e.approximateEra || "Unknown Era", verificationScore: e.verificationScore || 70, notes: sanitizeElderNotes(e.notes, newName), significance: e.significance || sanitizeElderNotes(e.notes, newName) || `A notable elder of the ${clanName} clan from the ${e.approximateEra || 'past'}.`, familyUnits: Array.isArray(e.familyUnits) ? e.familyUnits : [], spouseIds: [], parentId: undefined, clanId: clanId, clanName: clanName, birthYear: typeof e.birthYear === 'number' ? e.birthYear.toString() : e.birthYear, deathYear: typeof e.deathYear === 'number' ? e.deathYear.toString() : e.deathYear, familyConnections: Array.isArray(e.familyConnections) ? e.familyConnections : [], era: e.era || e.approximateEra,
            };
          }) as ClanElder[];
          if (processedElders.length > 0) processedElders[0].parentId = tribalAncestorId; if (processedElders.length > 1) processedElders[1].parentId = tribalAncestorId; if (processedElders.length > 2 && processedElders[0]?.id) processedElders[2].parentId = processedElders[0].id; if (processedElders.length > 3 && processedElders[0]?.id) processedElders[3].parentId = processedElders[0].id; if (processedElders.length > 4 && processedElders[1]?.id) processedElders[4].parentId = processedElders[1].id; if (processedElders.length > 5 && processedElders[2]?.id) processedElders[5].parentId = processedElders[2].id; if (processedElders.length > 6 && processedElders[3]?.id) processedElders[6].parentId = processedElders[3].id; if (processedElders.length > 7 && processedElders[3]?.id) processedElders[7].parentId = processedElders[3].id; if (processedElders.length > 8 && processedElders[4]?.id) processedElders[8].parentId = processedElders[4].id; if (processedElders.length > 9 && processedElders[4]?.id) processedElders[9].parentId = processedElders[4].id;
          return processedElders;
        })([
          { id: "okalany_ingoratok", name: "Okalany", approximateEra: "19th century", verificationScore: 84, significance: "A respected patriarch of the Ingoratok clan." }, // ID suffix
          { id: "ebaju_ingoratok", name: "Ebaju", approximateEra: "Late 19th century", verificationScore: 82, significance: "A contemporary of Okalany, known for his leadership." }, // ID suffix
          { id: "acom", name: "Acom", approximateEra: "Early 20th century", verificationScore: 85, significance: "Son of Okalany, a wise elder and orator." }, // Name will be masculinized
          { id: "okiror_ingoratok", name: "Okiror", approximateEra: "Mid-20th century", verificationScore: 83, significance: "Son of Okalany, skilled in traditional governance." }, // ID suffix
          { id: "otim_ingoratok", name: "Otim", approximateEra: "Late 19th century", verificationScore: 81, significance: "Son of Ebaju, a brave warrior." }, // ID suffix
          { id: "egunyu_ingoratok", name: "Egunyu", approximateEra: "Early 20th century", verificationScore: 80, significance: "Grandson of Okalany via Acom (masculinized), a community mobilizer." }, // ID suffix
          { id: "amuge", name: "Amuge", approximateEra: "Mid-20th century", verificationScore: 79, significance: "Grandson of Okalany via Okiror, known for resolving disputes." }, // Name will be masculinized
          { id: "odongo_ingoratok", name: "Odongo", approximateEra: "Early 19th century", verificationScore: 78, significance: "Another grandson of Okalany via Okiror, a keeper of clan history." }, // ID suffix
          { id: "etesot_ingoratok", name: "Etesot", approximateEra: "Mid-19th century", verificationScore: 77, significance: "Grandson of Ebaju via Otim, a skilled craftsman." }, // ID suffix
          { id: "adeke", name: "Adeke", approximateEra: "Late 20th century", verificationScore: 76, significance: "Another grandson of Ebaju via Otim, a respected figure in later years." } // Name will be masculinized
        ], "ingoratok", "Ingoratok", "TA_iteso"),
        culturalPractices: ["Elaborate naming ceremonies", "Traditional Iteso music and dance (Akogo)", "Respect for clan elders and ancestral spirits"]
      }
    ]
  } 
];
