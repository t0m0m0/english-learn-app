const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en";

export interface Definition {
  definition: string;
  example?: string;
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: Meaning[];
}

// Cache for definitions to reduce API calls
const definitionCache = new Map<string, DictionaryEntry | null>();

export async function fetchDefinition(
  word: string,
): Promise<DictionaryEntry | null> {
  // Check cache first
  const cached = definitionCache.get(word);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const response = await fetch(
      `${DICTIONARY_API}/${encodeURIComponent(word)}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        definitionCache.set(word, null);
      }
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      definitionCache.set(word, null);
      return null;
    }

    const firstEntry = data[0];
    if (!firstEntry?.word || !Array.isArray(firstEntry?.meanings)) {
      return null;
    }

    const entry: DictionaryEntry = {
      word: firstEntry.word,
      phonetic: firstEntry.phonetic,
      meanings: firstEntry.meanings.map((meaning: Meaning) => ({
        partOfSpeech: meaning.partOfSpeech,
        definitions: meaning.definitions.map((def: Definition) => ({
          definition: def.definition,
          example: def.example,
        })),
      })),
    };

    definitionCache.set(word, entry);
    return entry;
  } catch (error) {
    console.error("Error fetching definition:", error);
    return null;
  }
}

export function clearDefinitionCache(): void {
  definitionCache.clear();
}
