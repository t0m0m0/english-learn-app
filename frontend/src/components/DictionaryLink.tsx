interface DictionaryLinkProps {
  word: string;
}

interface DictionarySite {
  name: string;
  baseUrl: string;
  encode?: boolean;
}

const DICTIONARY_SITES: DictionarySite[] = [
  {
    name: "Cambridge",
    baseUrl: "https://dictionary.cambridge.org/dictionary/english/",
    encode: true,
  },
  {
    name: "Merriam-Webster",
    baseUrl: "https://www.merriam-webster.com/dictionary/",
    encode: true,
  },
  {
    name: "Oxford",
    baseUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/",
    encode: true,
  },
];

export function DictionaryLink({ word }: DictionaryLinkProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {DICTIONARY_SITES.map((site) => {
        const encodedWord = site.encode ? encodeURIComponent(word) : word;
        const url = `${site.baseUrl}${encodedWord}`;

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

export default DictionaryLink;
