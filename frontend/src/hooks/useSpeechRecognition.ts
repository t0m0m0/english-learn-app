import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;

  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition ||
    (
      window as unknown as {
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition ||
    null
  );
};

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const {
    language = "en-US",
    continuous = false,
    interimResults = true,
  } = options;

  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const SpeechRecognitionClass = getSpeechRecognition();
  const isSupported = SpeechRecognitionClass !== null;

  // Initialize recognition instance
  useEffect(() => {
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [SpeechRecognitionClass, continuous, interimResults, language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Recognition might already be started
      if (err instanceof Error && !err.message.includes("already started")) {
        setError(err.message);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore errors when stopping
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

export default useSpeechRecognition;
