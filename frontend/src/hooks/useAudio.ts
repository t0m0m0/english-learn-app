import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

interface UseAudioReturn {
  speak: (text: string, customRate?: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  speakSequence: (
    words: string[],
    delayMs?: number,
    customRate?: number,
  ) => Promise<void>;
  cancelSequence: () => void;
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
  loadVoices: () => SpeechSynthesisVoice[];
  isReady: boolean;
  error: string | null;
}

export function useAudio(options: UseAudioOptions = {}): UseAudioReturn {
  const { rate = 1, pitch = 1, volume = 1, voice = null } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);

  // Refs for timeout/interval cleanup
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const sequenceDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceCancelledRef = useRef(false);

  // Cleanup all timers
  const cleanupTimers = useCallback(() => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }
    if (sequenceIntervalRef.current) {
      clearInterval(sequenceIntervalRef.current);
      sequenceIntervalRef.current = null;
    }
    if (sequenceDelayTimeoutRef.current) {
      clearTimeout(sequenceDelayTimeoutRef.current);
      sequenceDelayTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Get available voices
  const loadVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return [];
    }

    const voices = speechSynthesis.getVoices();

    // Filter for English voices
    const englishVoices = voices.filter(
      (v) => v.lang.startsWith("en-") || v.lang === "en",
    );

    setAvailableVoices(englishVoices);

    if (voices.length > 0 && !voicesLoadedRef.current) {
      voicesLoadedRef.current = true;
      setIsReady(true);
      setError(null);
    }

    return englishVoices;
  }, []);

  // Load voices on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("Speech synthesis not supported in this browser");
      return;
    }

    // Chrome needs this event - voices are loaded asynchronously
    speechSynthesis.onvoiceschanged = () => {
      const voices = loadVoices();
      // Clear retry timeout if voices loaded successfully
      if (voices.length > 0 && retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    // Firefox and Safari might have voices ready immediately
    const voices = loadVoices();

    // If no voices loaded yet, try again after a delay (for some browsers)
    if (voices.length === 0) {
      retryTimeoutRef.current = setTimeout(() => {
        const retryVoices = loadVoices();
        if (retryVoices.length === 0) {
          setError(
            "No audio voices available. Please check your browser settings.",
          );
        }
        retryTimeoutRef.current = null;
      }, 1000);
    }

    return () => {
      speechSynthesis.onvoiceschanged = null;
      cleanupTimers();
    };
  }, [loadVoices, cleanupTimers]);

  // Speak a word or phrase
  const speak = useCallback(
    (text: string, customRate?: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setError("Speech synthesis not supported");
        return;
      }

      setError(null);

      // Clear any existing timers before starting new speech
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = customRate ?? rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Set voice
      const voices = speechSynthesis.getVoices();

      if (voice) {
        utterance.voice = voice;
      } else if (voices.length > 0) {
        // Try to use a native English voice
        const englishVoice =
          voices.find(
            (v) => v.lang === "en-US" && v.name.includes("Samantha"),
          ) ||
          voices.find((v) => v.lang === "en-US") ||
          voices.find((v) => v.lang.startsWith("en-"));

        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled") {
          setError(`Speech error: ${e.error}`);
        }
        setIsSpeaking(false);
      };

      // Cancel any ongoing speech
      speechSynthesis.cancel();
      utteranceRef.current = utterance;

      // Chrome requires a delay after cancel() before speak() will work
      speakTimeoutRef.current = setTimeout(() => {
        speechSynthesis.speak(utterance);

        // Chrome has a bug where it sometimes doesn't fire events
        // Check if speech actually started after a short delay
        checkTimeoutRef.current = setTimeout(() => {
          if (!speechSynthesis.speaking && !speechSynthesis.pending) {
            setError("Speech failed to start. Please try again.");
          }
        }, 200);
      }, 150);
    },
    [rate, pitch, volume, voice],
  );

  // Stop speaking
  const stop = useCallback(() => {
    cleanupTimers();
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [cleanupTimers]);

  // Pause speaking
  const pause = useCallback(() => {
    speechSynthesis.pause();
  }, []);

  // Resume speaking
  const resume = useCallback(() => {
    speechSynthesis.resume();
  }, []);

  // Cancel ongoing sequence
  const cancelSequence = useCallback(() => {
    sequenceCancelledRef.current = true;
    if (sequenceIntervalRef.current) {
      clearInterval(sequenceIntervalRef.current);
      sequenceIntervalRef.current = null;
    }
    stop();
  }, [stop]);

  // Speak multiple words with a delay between them
  const speakSequence = useCallback(
    async (words: string[], delayMs = 2000, customRate?: number) => {
      sequenceCancelledRef.current = false;

      for (const word of words) {
        if (sequenceCancelledRef.current) {
          return;
        }

        speak(word, customRate);

        // Wait for speech to finish plus the delay
        await new Promise<void>((resolve) => {
          sequenceIntervalRef.current = setInterval(() => {
            if (sequenceCancelledRef.current) {
              if (sequenceIntervalRef.current) {
                clearInterval(sequenceIntervalRef.current);
                sequenceIntervalRef.current = null;
              }
              resolve();
              return;
            }
            if (!speechSynthesis.speaking) {
              if (sequenceIntervalRef.current) {
                clearInterval(sequenceIntervalRef.current);
                sequenceIntervalRef.current = null;
              }
              // Track the delay timeout so it can be cleaned up
              sequenceDelayTimeoutRef.current = setTimeout(() => {
                sequenceDelayTimeoutRef.current = null;
                resolve();
              }, delayMs);
            }
          }, 100);
        });
      }
    },
    [speak],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
      sequenceCancelledRef.current = true;
    };
  }, [cleanupTimers]);

  return {
    speak,
    stop,
    pause,
    resume,
    speakSequence,
    cancelSequence,
    isSpeaking,
    availableVoices,
    loadVoices,
    isReady,
    error,
  };
}

export default useAudio;
