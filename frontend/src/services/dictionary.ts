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
      definitionCache.set(word, null);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      definitionCache.set(word, null);
      return null;
    }

    const entry: DictionaryEntry = {
      word: data[0].word,
      phonetic: data[0].phonetic,
      meanings: data[0].meanings.map(
        (meaning: { partOfSpeech: string; definitions: Definition[] }) => ({
          partOfSpeech: meaning.partOfSpeech,
          definitions: meaning.definitions.map(
            (def: { definition: string; example?: string }) => ({
              definition: def.definition,
              example: def.example,
            }),
          ),
        }),
      ),
    };

    definitionCache.set(word, entry);
    return entry;
  } catch (error) {
    console.error("Error fetching definition:", error);
    definitionCache.set(word, null);
    return null;
  }
}

export function clearDefinitionCache(): void {
  definitionCache.clear();
}
