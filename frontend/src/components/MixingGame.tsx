import { useState, useEffect } from 'react';
import { Word } from '../types';
import { wordsApi } from '../services/api';
import useAudio from '../hooks/useAudio';
import './MixingGame.css';

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
  const { speak, isSpeaking } = useAudio();

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
      const { words: randomWords } = await wordsApi.getRandom(3, 1000);
      setWords({
        verb: randomWords[0] || null,
        noun: randomWords[1] || null,
        adjective: randomWords[2] || null,
      });
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
    return <div className="mixing-game loading">Loading words...</div>;
  }

  return (
    <div className="mixing-game">
      <div className="mixing-header">
        <h2>Word Mixing Game</h2>
        <p className="mixing-description">
          Combine these words to create a sentence. Be creative!
        </p>
        <div className="game-stats">
          <span className="round">Round {round}/{maxRounds}</span>
          <span className="score">Score: {score}</span>
        </div>
      </div>

      <div className="word-blocks">
        <div
          className="word-block verb"
          onClick={() => handleSpeakWord(words.verb)}
        >
          <span className="word-type">VERB</span>
          <span className="word-value">{words.verb?.word || '...'}</span>
          {isSpeaking && <span className="speaking-indicator">🔊</span>}
        </div>

        <span className="plus">+</span>

        <div
          className="word-block adjective"
          onClick={() => handleSpeakWord(words.adjective)}
        >
          <span className="word-type">ADJECTIVE</span>
          <span className="word-value">{words.adjective?.word || '...'}</span>
        </div>

        <span className="plus">+</span>

        <div
          className="word-block noun"
          onClick={() => handleSpeakWord(words.noun)}
        >
          <span className="word-type">NOUN</span>
          <span className="word-value">{words.noun?.word || '...'}</span>
        </div>
      </div>

      <button className="speak-all-button" onClick={handleSpeakAll}>
        🔊 Listen to all words
      </button>

      {!showExample ? (
        <div className="sentence-input-section">
          <textarea
            className="sentence-input"
            placeholder="Write a sentence using all three words..."
            value={userSentence}
            onChange={(e) => setUserSentence(e.target.value)}
            rows={3}
          />
          <div className="input-actions">
            <button className="skip-button" onClick={handleSkip}>
              Skip
            </button>
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!userSentence.trim()}
            >
              Check Sentence
            </button>
          </div>
        </div>
      ) : (
        <div className="result-section">
          {userSentence && (
            <div className="user-sentence">
              <label>Your sentence:</label>
              <p>{userSentence}</p>
            </div>
          )}
          <div className="example-sentence">
            <label>Example sentence:</label>
            <p>{generateExampleSentence()}</p>
          </div>
          <button className="next-button" onClick={handleNextRound}>
            {round >= maxRounds ? 'See Results' : 'Next Round →'}
          </button>
        </div>
      )}
    </div>
  );
}

export default MixingGame;
