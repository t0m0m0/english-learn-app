import { useCallback, useRef, useState } from 'react';

interface UseAudioOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

export function useAudio(options: UseAudioOptions = {}) {
  const { rate = 1, pitch = 1, volume = 1, voice = null } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Get available voices
  const loadVoices = useCallback(() => {
    const voices = speechSynthesis.getVoices();
    // Filter for English voices
    const englishVoices = voices.filter(
      (v) => v.lang.startsWith('en-') || v.lang === 'en'
    );
    setAvailableVoices(englishVoices);
    return englishVoices;
  }, []);

  // Load voices on mount
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Chrome needs this event
    speechSynthesis.onvoiceschanged = loadVoices;
    // Firefox and Safari might have voices ready immediately
    if (availableVoices.length === 0) {
      loadVoices();
    }
  }

  // Speak a word or phrase
  const speak = useCallback(
    (text: string, customRate?: number) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = customRate ?? rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Set voice
      if (voice) {
        utterance.voice = voice;
      } else {
        // Try to use a native English voice
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(
          (v) => v.lang === 'en-US' && v.name.includes('Samantha')
        ) || voices.find(
          (v) => v.lang === 'en-US'
        ) || voices.find(
          (v) => v.lang.startsWith('en-')
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [rate, pitch, volume, voice]
  );

  // Stop speaking
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    speechSynthesis.pause();
  }, []);

  // Resume speaking
  const resume = useCallback(() => {
    speechSynthesis.resume();
  }, []);

  // Speak multiple words with a delay between them
  const speakSequence = useCallback(
    async (words: string[], delayMs = 2000, customRate?: number) => {
      for (const word of words) {
        speak(word, customRate);

        // Wait for speech to finish plus the delay
        await new Promise<void>((resolve) => {
          const checkSpeaking = setInterval(() => {
            if (!speechSynthesis.speaking) {
              clearInterval(checkSpeaking);
              setTimeout(resolve, delayMs);
            }
          }, 100);
        });
      }
    },
    [speak]
  );

  return {
    speak,
    stop,
    pause,
    resume,
    speakSequence,
    isSpeaking,
    availableVoices,
    loadVoices,
  };
}

export default useAudio;
