interface DictionaryLinkProps {
  word: string;
}

interface DictionarySite {
  name: string;
  baseUrl: string;
}

const DICTIONARY_SITES: DictionarySite[] = [
  {
    name: "Cambridge",
    baseUrl: "https://dictionary.cambridge.org/dictionary/english/",
  },
  {
    name: "Merriam-Webster",
    baseUrl: "https://www.merriam-webster.com/dictionary/",
  },
  {
    name: "Oxford",
    baseUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/",
  },
];

export function DictionaryLink({ word }: DictionaryLinkProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {DICTIONARY_SITES.map((site) => {
        const url = `${site.baseUrl}${encodeURIComponent(word)}`;

        return (
          <a
            key={site.name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-blue-50 dark:bg-blue-900/30 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            📖 {site.name}
          </a>
        );
      })}
    </div>
  );
}
