import { useState, useRef, useCallback, useEffect } from "react";

export interface UsePrerecordedAudioReturn {
  load: (audioPath: string) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlaybackRate: (rate: number) => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  duration: number;
  currentTime: number;
}

export function usePrerecordedAudio(): UsePrerecordedAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackRateRef = useRef(1);

  // Store event handler references for cleanup
  const handlersRef = useRef<{
    loadeddata: (() => void) | null;
    play: (() => void) | null;
    pause: (() => void) | null;
    ended: (() => void) | null;
    timeupdate: (() => void) | null;
    error: (() => void) | null;
  }>({
    loadeddata: null,
    play: null,
    pause: null,
    ended: null,
    timeupdate: null,
    error: null,
  });

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      // Remove all event listeners
      const audio = audioRef.current;
      const handlers = handlersRef.current;

      if (handlers.loadeddata) {
        audio.removeEventListener("loadeddata", handlers.loadeddata);
      }
      if (handlers.play) {
        audio.removeEventListener("play", handlers.play);
      }
      if (handlers.pause) {
        audio.removeEventListener("pause", handlers.pause);
      }
      if (handlers.ended) {
        audio.removeEventListener("ended", handlers.ended);
      }
      if (handlers.timeupdate) {
        audio.removeEventListener("timeupdate", handlers.timeupdate);
      }
      if (handlers.error) {
        audio.removeEventListener("error", handlers.error);
      }

      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;

      // Clear handler references
      handlersRef.current = {
        loadeddata: null,
        play: null,
        pause: null,
        ended: null,
        timeupdate: null,
        error: null,
      };
    }
  }, []);

  const load = useCallback(
    (audioPath: string) => {
      cleanup();
      setError(null);
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      const audio = new Audio(audioPath);
      audio.playbackRate = playbackRateRef.current;

      // Create event handlers
      const handleLoadedData = () => {
        setIsLoading(false);
        setDuration(audio.duration);
      };

      const handlePlay = () => {
        setIsPlaying(true);
      };

      const handlePause = () => {
        setIsPlaying(false);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleError = () => {
        setIsLoading(false);
        setIsPlaying(false);
        setError("Failed to load audio file. Please check the file path.");
      };

      // Store handler references for cleanup
      handlersRef.current = {
        loadeddata: handleLoadedData,
        play: handlePlay,
        pause: handlePause,
        ended: handleEnded,
        timeupdate: handleTimeUpdate,
        error: handleError,
      };

      // Add event listeners
      audio.addEventListener("loadeddata", handleLoadedData);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("error", handleError);

      audioRef.current = audio;
    },
    [cleanup],
  );

  const play = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      setError("Failed to play audio. Please try again.");
    });
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    load,
    play,
    pause,
    stop,
    setPlaybackRate,
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
  };
}
