import { useState, useEffect, useRef } from 'react';
import { searchImages } from '../services/unsplash';
import useAudio from '../hooks/useAudio';
import { Button, Card } from './ui';

interface Word {
  id: number;
  word: string;
  frequency: number;
  partOfSpeech: string | null;
}

interface UnsplashImage {
  id: string;
  urls: { small: string; regular: string; thumb: string };
  alt_description: string | null;
}

interface WordCardProps {
  word: Word;
  showImage?: boolean;
  showWord?: boolean;
  onCorrect?: () => void;
  onIncorrect?: () => void;
  autoPlay?: boolean;
}

export function WordCard({
  word,
  showImage = true,
  showWord = true,
  onCorrect,
  onIncorrect,
  autoPlay = false,
}: WordCardProps) {
  const [image, setImage] = useState<UnsplashImage | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [revealed, setRevealed] = useState(showWord);
  const { speak, isSpeaking } = useAudio();
  const speakRef = useRef(speak);

  // Keep the ref up to date
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  useEffect(() => {
    if (showImage) {
      setImageLoading(true);
      searchImages(word.word).then((images) => {
        setImage(images[0] || null);
        setImageLoading(false);
      });
    }
  }, [word.word, showImage]);

  useEffect(() => {
    if (autoPlay && word.word) {
      // Small delay to ensure component is fully mounted and avoid conflicts
      const timer = setTimeout(() => {
        speakRef.current(word.word);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, word.word]);

  useEffect(() => {
    setRevealed(showWord);
  }, [showWord]);

  const handleSpeak = () => {
    speak(word.word);
  };

  const handleReveal = () => {
    setRevealed(true);
  };

  return (
    <Card padding="none" className="max-w-md mx-auto overflow-hidden">
      {showImage && (
        <div className="w-full h-72 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {imageLoading ? (
            <div className="text-text-muted text-sm animate-pulse">Loading...</div>
          ) : image ? (
            <img
              src={image.urls.regular}
              alt={image.alt_description || word.word}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://placehold.co/400x400?text=${encodeURIComponent(word.word)}`;
              }}
            />
          ) : (
            <div className="text-text-muted text-sm">No image available</div>
          )}
        </div>
      )}

      <div className="p-6 text-center">
        {revealed ? (
          <h2 className="text-3xl font-semibold text-text-primary mb-2">{word.word}</h2>
        ) : (
          <button
            className="px-8 py-4 bg-gray-100 dark:bg-gray-700 text-text-primary border-2 border-dashed border-border rounded-button text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={handleReveal}
          >
            Reveal Word
          </button>
        )}

        {word.partOfSpeech && (
          <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-primary px-3 py-1 rounded-full text-xs uppercase tracking-wide mb-4">
            {word.partOfSpeech}
          </span>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="primary"
            onClick={handleSpeak}
            disabled={isSpeaking}
            fullWidth
          >
            {isSpeaking ? 'Speaking...' : '🔊 Listen'}
          </Button>

          {(onCorrect || onIncorrect) && revealed && (
            <div className="flex gap-3">
              {onIncorrect && (
                <Button variant="error" onClick={onIncorrect} className="flex-1">
                  ✗ Don't Know
                </Button>
              )}
              {onCorrect && (
                <Button variant="success" onClick={onCorrect} className="flex-1">
                  ✓ Know It
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default WordCard;
