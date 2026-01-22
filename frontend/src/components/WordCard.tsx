import { useState, useEffect } from 'react';
import { Word, UnsplashImage } from '../types';
import { searchImages } from '../services/unsplash';
import useAudio from '../hooks/useAudio';
import './WordCard.css';

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
      speak(word.word);
    }
  }, [autoPlay, word.word, speak]);

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
    <div className="word-card">
      {showImage && (
        <div className="word-card-image">
          {imageLoading ? (
            <div className="image-loading">Loading...</div>
          ) : image ? (
            <img
              src={image.urls.regular}
              alt={image.alt_description || word.word}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x400?text=${encodeURIComponent(word.word)}`;
              }}
            />
          ) : (
            <div className="image-placeholder">No image available</div>
          )}
        </div>
      )}

      <div className="word-card-content">
        {revealed ? (
          <h2 className="word-text">{word.word}</h2>
        ) : (
          <button className="reveal-button" onClick={handleReveal}>
            Reveal Word
          </button>
        )}

        {word.partOfSpeech && (
          <span className="part-of-speech">{word.partOfSpeech}</span>
        )}

        <div className="word-card-actions">
          <button
            className="speak-button"
            onClick={handleSpeak}
            disabled={isSpeaking}
          >
            {isSpeaking ? 'Speaking...' : '🔊 Listen'}
          </button>

          {(onCorrect || onIncorrect) && revealed && (
            <div className="answer-buttons">
              {onIncorrect && (
                <button className="incorrect-button" onClick={onIncorrect}>
                  ✗ Don't Know
                </button>
              )}
              {onCorrect && (
                <button className="correct-button" onClick={onCorrect}>
                  ✓ Know It
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WordCard;
