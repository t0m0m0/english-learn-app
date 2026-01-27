import { useState, useEffect } from "react";
import { fetchDefinition } from "../services/dictionary";
import type { DictionaryEntry } from "../services/dictionary";

interface DictionaryDefinitionProps {
  word: string;
  collapsed?: boolean;
}

export function DictionaryDefinition({
  word,
  collapsed = false,
}: DictionaryDefinitionProps) {
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDefinition(word)
      .then((result) => {
        if (!cancelled) {
          setDefinition(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDefinition(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [word]);

  if (loading) {
    return (
      <div className="text-text-muted text-sm animate-pulse text-center py-2">
        Loading definition...
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="text-text-muted text-sm text-center py-2">
        No definition found
      </div>
    );
  }

  if (collapsed && !isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full text-sm text-primary hover:text-primary-dark transition-colors py-2"
      >
        📖 Show Definition
      </button>
    );
  }

  return (
    <div className="text-left space-y-3">
      {definition.phonetic && (
        <p className="text-text-muted text-sm text-center">
          {definition.phonetic}
        </p>
      )}

      {definition.meanings.map((meaning, index) => (
        <div key={index} className="space-y-1">
          <span className="inline-block text-xs font-medium text-primary uppercase tracking-wide">
            {meaning.partOfSpeech}
          </span>
          <ul className="list-disc list-inside space-y-1">
            {meaning.definitions.slice(0, 2).map((def, defIndex) => (
              <li key={defIndex} className="text-sm text-text-secondary">
                {def.definition}
                {def.example && (
                  <p className="text-xs text-text-muted italic ml-4 mt-1">
                    "{def.example}"
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {collapsed && isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
        >
          Hide Definition
        </button>
      )}
    </div>
  );
}
