import { useState, useEffect } from 'react';
import { wordsApi } from '../services/api';
import useAudio from '../hooks/useAudio';
import { Button, Card } from './ui';

interface Word {
  id: number;
  word: string;
  frequency: number;
  partOfSpeech: string | null;
}

interface MixingGameProps {
  onComplete?: (score: number) => void;
}

interface MixingSet {
  verb: Word | null;
  noun: Word | null;
  adjective: Word | null;
}

export function MixingGame({ onComplete }: MixingGameProps) {
  const [words, setWords] = useState<MixingSet>({
    verb: null,
    noun: null,
    adjective: null,
  });
  const [loading, setLoading] = useState(true);
  const [userSentence, setUserSentence] = useState('');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const { speak, isSpeaking, isReady, error } = useAudio();

  const maxRounds = 10;

  const fetchNewWords = async () => {
    setLoading(true);
    setShowExample(false);
    setUserSentence('');

    try {
      // Fetch random words by part of speech
      const [verbsRes, nounsRes, adjectivesRes] = await Promise.all([
        wordsApi.getByPartOfSpeech('verb', 1),
        wordsApi.getByPartOfSpeech('noun', 1),
        wordsApi.getByPartOfSpeech('adjective', 1),
      ]);

      setWords({
        verb: verbsRes.words[0] || null,
        noun: nounsRes.words[0] || null,
        adjective: adjectivesRes.words[0] || null,
      });
    } catch (error) {
      console.error('Error fetching words:', error);
      // Fallback to random words if POS-based fetch fails
      try {
        const { words: randomWords } = await wordsApi.getRandom(3, 1000);
        setWords({
          verb: randomWords[0] || null,
          noun: randomWords[1] || null,
          adjective: randomWords[2] || null,
        });
      } catch (fallbackError) {
        console.error('Error fetching fallback words:', fallbackError);
        // Set empty state - component will show loading state or error
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchNewWords();
  }, []);

  const generateExampleSentence = (): string => {
    const { verb, noun, adjective } = words;
    if (!verb || !noun || !adjective) return '';

    const examples = [
      `The ${adjective.word} ${noun.word} ${verb.word}s.`,
      `I ${verb.word} the ${adjective.word} ${noun.word}.`,
      `A ${adjective.word} ${noun.word} will ${verb.word}.`,
      `They ${verb.word} with a ${adjective.word} ${noun.word}.`,
    ];

    return examples[Math.floor(Math.random() * examples.length)];
  };

  const handleSpeakWord = (word: Word | null) => {
    if (word) {
      speak(word.word);
    }
  };

  const handleSpeakAll = () => {
    const { verb, noun, adjective } = words;
    const allWords = [verb, noun, adjective].filter(Boolean) as Word[];
    const wordStrings = allWords.map((w) => w.word).join(', ');
    speak(wordStrings);
  };

  const handleSubmit = () => {
    if (userSentence.trim().length > 0) {
      // Simple scoring: check if all words are used
      const lowerSentence = userSentence.toLowerCase();
      let points = 0;

      if (words.verb && lowerSentence.includes(words.verb.word.toLowerCase())) {
        points += 1;
      }
      if (words.noun && lowerSentence.includes(words.noun.word.toLowerCase())) {
        points += 1;
      }
      if (words.adjective && lowerSentence.includes(words.adjective.word.toLowerCase())) {
        points += 1;
      }

      setScore((prev) => prev + points);
      setShowExample(true);
    }
  };

  const handleNextRound = () => {
    if (round >= maxRounds) {
      onComplete?.(score);
    } else {
      setRound((prev) => prev + 1);
      fetchNewWords();
    }
  };

  const handleSkip = () => {
    setShowExample(true);
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto text-center py-12">
        <div className="text-text-muted animate-pulse">Loading words...</div>
      </Card>
    );
  }

  const WordBlock = ({
    type,
    word,
    colorClass,
  }: {
    type: string;
    word: Word | null;
    colorClass: string;
  }) => (
    <button
      type="button"
      className={`flex-1 p-4 rounded-card ${colorClass} text-white cursor-pointer transition-all hover:-translate-y-1 hover:shadow-elevated`}
      onClick={() => handleSpeakWord(word)}
    >
      <span className="block text-xs uppercase tracking-wider opacity-80 mb-1">{type}</span>
      <span className="block text-xl font-bold">{word?.word || '...'}</span>
      {isSpeaking && <span className="block text-sm mt-1 animate-pulse">🔊</span>}
    </button>
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Word Mixing Game</h2>
        <p className="text-text-secondary mb-4">
          Combine these words to create a sentence. Be creative!
        </p>
        <div className="flex justify-center gap-4">
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-text-secondary">
            Round {round}/{maxRounds}
          </span>
          <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
            Score: {score}
          </span>
        </div>
      </div>

      {/* Audio Status/Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-card text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {!isReady && !error && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-card text-yellow-700 dark:text-yellow-300 text-sm">
          Loading audio voices...
        </div>
      )}

      {/* Word Blocks */}
      <div className="flex gap-3 mb-6">
        <WordBlock
          type="VERB"
          word={words.verb}
          colorClass="bg-gradient-to-br from-red-500 to-red-600"
        />
        <WordBlock
          type="ADJECTIVE"
          word={words.adjective}
          colorClass="bg-gradient-to-br from-success to-emerald-600"
        />
        <WordBlock
          type="NOUN"
          word={words.noun}
          colorClass="bg-gradient-to-br from-primary to-blue-700"
        />
      </div>

      <Button variant="ghost" onClick={handleSpeakAll} fullWidth className="mb-6">
        🔊 Listen to all words
      </Button>

      {!showExample ? (
        <div>
          <textarea
            className="w-full p-4 border border-border rounded-card bg-surface text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="Write a sentence using all three words..."
            value={userSentence}
            onChange={(e) => setUserSentence(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!userSentence.trim()}
              className="flex-1"
            >
              Check Sentence
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-card">
          {userSentence && (
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">
                Your sentence:
              </label>
              <p className="text-text-primary">{userSentence}</p>
            </div>
          )}
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">
              Example sentence:
            </label>
            <p className="text-text-primary font-medium">{generateExampleSentence()}</p>
          </div>
          <Button variant="primary" onClick={handleNextRound} fullWidth>
            {round >= maxRounds ? 'See Results' : 'Next Round →'}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default MixingGame;
