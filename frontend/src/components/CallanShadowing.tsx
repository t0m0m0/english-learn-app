import { useState, useEffect, useCallback, useRef } from "react";
import { useAudio } from "../hooks/useAudio";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { callanProgressApi } from "../services/api";
import { Button, Card } from "./ui";
import type { QAItem } from "../types";

interface CallanShadowingProps {
  qaItems: QAItem[];
  userId: number;
  onComplete: (summary: ShadowingSummary) => void;
}

export interface ShadowingSummary {
  totalItems: number;
  goodCount: number;
  retryCount: number;
}

type PracticeState = "ready" | "recording" | "review" | "evaluated";

// MediaError codes
const MEDIA_ERR_ABORTED = 1;
const MEDIA_ERR_NETWORK = 2;
const MEDIA_ERR_DECODE = 3;
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

/**
 * Get a detailed error message from an HTMLAudioElement error.
 * MediaError codes: 1=MEDIA_ERR_ABORTED, 2=MEDIA_ERR_NETWORK, 3=MEDIA_ERR_DECODE, 4=MEDIA_ERR_SRC_NOT_SUPPORTED
 */
export function getAudioErrorMessage(error: MediaError | null): string {
  if (!error) {
    return "Unknown playback error";
  }

  switch (error.code) {
    case MEDIA_ERR_ABORTED:
      return "Playback was aborted";
    case MEDIA_ERR_NETWORK:
      return "Network error occurred while loading audio";
    case MEDIA_ERR_DECODE:
      return "Audio decoding failed. The format may not be supported.";
    case MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "Audio format not supported by your browser. Try recording again.";
    default:
      return error.message || "Failed to play recording";
  }
}

export function CallanShadowing({
  qaItems,
  userId,
  onComplete,
}: CallanShadowingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceState, setPracticeState] = useState<PracticeState>("ready");
  const [speed, setSpeed] = useState(1);
  const [goodCount, setGoodCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const compareIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const compareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    error: audioError,
  } = useAudio();
  const {
    isRecording,
    isSupported: recorderSupported,
    recordedAudio,
    duration,
    error: recorderError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const currentItem = qaItems[currentIndex];
  const isLastItem = currentIndex === qaItems.length - 1;
  const progress = ((currentIndex + 1) / qaItems.length) * 100;

  // Play model audio (TTS)
  const handlePlayModel = useCallback(() => {
    if (!currentItem || isSpeaking) return;
    speak(currentItem.answer, speed);
  }, [currentItem, isSpeaking, speak, speed]);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    if (isRecording) return;
    stopSpeaking();
    setPracticeState("recording");
    await startRecording();
  }, [isRecording, stopSpeaking, startRecording]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (!isRecording) return;
    stopRecording();
    setPracticeState("review");
  }, [isRecording, stopRecording]);

  // Play recorded audio
  const handlePlayRecording = useCallback(async () => {
    if (!recordedAudio?.url || isPlayingRecording) return;

    setPlaybackError(null);
    const audio = new Audio(recordedAudio.url);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlayingRecording(false);
      audioRef.current = null;
    };

    audio.onerror = () => {
      const errorMessage = getAudioErrorMessage(audio.error);
      console.error("Audio playback error:", audio.error?.code, errorMessage);
      setPlaybackError(errorMessage);
      setIsPlayingRecording(false);
      audioRef.current = null;
    };

    try {
      await audio.play();
      setIsPlayingRecording(true);
    } catch (err) {
      console.error("Audio playback failed:", err);
      setPlaybackError("Failed to play recording. Please try again.");
      setIsPlayingRecording(false);
      audioRef.current = null;
    }
  }, [recordedAudio?.url, isPlayingRecording]);

  // Stop playing recording
  const handleStopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlayingRecording(false);
  }, []);

  // Compare: play model then user recording
  const handleCompare = useCallback(async () => {
    if (!currentItem || !recordedAudio?.url || isComparing) return;

    setIsComparing(true);
    setPlaybackError(null);

    // Play model first
    speak(currentItem.answer, speed);

    // Timeout safety - max 30 seconds wait for TTS
    const maxWaitTime = 30000;
    const startTime = Date.now();

    // Clear any existing interval/timeout
    if (compareIntervalRef.current) {
      clearInterval(compareIntervalRef.current);
    }
    if (compareTimeoutRef.current) {
      clearTimeout(compareTimeoutRef.current);
    }

    // Wait for TTS to finish, then play recording
    compareIntervalRef.current = setInterval(() => {
      // Timeout safety
      if (Date.now() - startTime > maxWaitTime) {
        if (compareIntervalRef.current) {
          clearInterval(compareIntervalRef.current);
          compareIntervalRef.current = null;
        }
        setIsComparing(false);
        setPlaybackError("Compare timed out. Please try again.");
        return;
      }

      if (!window.speechSynthesis.speaking) {
        if (compareIntervalRef.current) {
          clearInterval(compareIntervalRef.current);
          compareIntervalRef.current = null;
        }

        // Small delay before playing recording
        compareTimeoutRef.current = setTimeout(async () => {
          compareTimeoutRef.current = null;
          const audio = new Audio(recordedAudio.url);
          audioRef.current = audio;

          audio.onended = () => {
            setIsComparing(false);
            audioRef.current = null;
          };

          audio.onerror = () => {
            const errorMessage = getAudioErrorMessage(audio.error);
            console.error(
              "Audio playback error during compare:",
              audio.error?.code,
              errorMessage,
            );
            setPlaybackError(errorMessage);
            setIsComparing(false);
            audioRef.current = null;
          };

          try {
            await audio.play();
          } catch (err) {
            console.error("Failed to play recording in compare:", err);
            setPlaybackError("Failed to play recording. Please try again.");
            setIsComparing(false);
            audioRef.current = null;
          }
        }, 500);
      }
    }, 100);
  }, [currentItem, recordedAudio?.url, isComparing, speak, speed]);

  // Self-evaluation: Good
  const handleGood = useCallback(async () => {
    if (!currentItem) return;

    setGoodCount((prev) => prev + 1);
    setPracticeState("evaluated");

    // Record progress
    try {
      await callanProgressApi.recordProgress({
        userId,
        qaItemId: currentItem.id,
        mode: "shadowing",
        isCorrect: true,
      });
    } catch (err) {
      console.error("Failed to record progress:", err);
    }
  }, [currentItem, userId]);

  // Self-evaluation: Retry
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    clearRecording();
    setPracticeState("ready");
  }, [clearRecording]);

  // Go to next item
  const handleNext = useCallback(() => {
    if (isLastItem) {
      const summary: ShadowingSummary = {
        totalItems: qaItems.length,
        goodCount,
        retryCount,
      };
      onComplete(summary);
    } else {
      setCurrentIndex((prev) => prev + 1);
      clearRecording();
      setPracticeState("ready");
    }
  }, [
    isLastItem,
    qaItems.length,
    goodCount,
    retryCount,
    onComplete,
    clearRecording,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case "p":
          handlePlayModel();
          break;
        case "r":
          if (practiceState === "ready") {
            handleStartRecording();
          } else if (practiceState === "review") {
            handleRetry();
          }
          break;
        case " ":
          e.preventDefault();
          if (practiceState === "recording") {
            handleStopRecording();
          } else if (practiceState === "review" && recordedAudio) {
            handlePlayRecording();
          } else if (practiceState === "evaluated") {
            handleNext();
          }
          break;
        case "c":
          if (recordedAudio && practiceState === "review") {
            handleCompare();
          }
          break;
        case "g":
          if (practiceState === "review") {
            handleGood();
          }
          break;
        case "escape":
          if (isRecording) {
            handleStopRecording();
          }
          handleStopPlayback();
          stopSpeaking();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    practiceState,
    recordedAudio,
    isRecording,
    handlePlayModel,
    handleStartRecording,
    handleStopRecording,
    handlePlayRecording,
    handleCompare,
    handleGood,
    handleRetry,
    handleNext,
    handleStopPlayback,
    stopSpeaking,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
      if (compareIntervalRef.current) {
        clearInterval(compareIntervalRef.current);
        compareIntervalRef.current = null;
      }
      if (compareTimeoutRef.current) {
        clearTimeout(compareTimeoutRef.current);
        compareTimeoutRef.current = null;
      }
    };
  }, []);

  if (!currentItem) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-surface-elevated rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-text-secondary text-sm whitespace-nowrap">
          {currentIndex + 1} / {qaItems.length}
        </span>
      </div>

      {/* Answer text card */}
      <Card className="p-6">
        <div className="mb-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
            Shadow this phrase
          </p>
          <p className="text-2xl font-medium text-text-primary leading-relaxed">
            {currentItem.answer}
          </p>
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-4 mb-6">
          <label htmlFor="speed" className="text-text-secondary text-sm">
            Speed: {speed.toFixed(2)}x
          </label>
          <input
            id="speed"
            type="range"
            min="0.5"
            max="1.5"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>

        {/* Control buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Play Model */}
          <Button
            variant="secondary"
            onClick={handlePlayModel}
            disabled={isSpeaking || isRecording}
          >
            {isSpeaking ? "🔊 Playing..." : "🔊 Play Model (P)"}
          </Button>

          {/* Record */}
          {practiceState === "ready" && (
            <Button
              variant="primary"
              onClick={handleStartRecording}
              disabled={!recorderSupported || isSpeaking}
            >
              🎤 Record (R)
            </Button>
          )}

          {/* Stop Recording */}
          {practiceState === "recording" && (
            <Button variant="primary" onClick={handleStopRecording}>
              ⏹️ Stop Recording (Space)
            </Button>
          )}

          {/* Play Recording */}
          {recordedAudio && practiceState === "review" && (
            <Button
              variant="secondary"
              onClick={
                isPlayingRecording ? handleStopPlayback : handlePlayRecording
              }
              disabled={isComparing}
            >
              {isPlayingRecording ? "⏹️ Stop" : "▶️ Play My Recording (Space)"}
            </Button>
          )}

          {/* Compare */}
          {recordedAudio && practiceState === "review" && (
            <Button
              variant="secondary"
              onClick={handleCompare}
              disabled={isComparing || isPlayingRecording || isSpeaking}
            >
              {isComparing ? "🔄 Comparing..." : "🔀 Compare (C)"}
            </Button>
          )}
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="mt-4 flex items-center gap-2 text-error">
            <span className="animate-pulse">●</span>
            <span>Recording... {duration}s</span>
          </div>
        )}

        {/* Error message */}
        {(recorderError || audioError || playbackError) && (
          <p className="mt-4 text-error text-sm">
            {recorderError || audioError || playbackError}
          </p>
        )}
      </Card>

      {/* Self-evaluation card */}
      {recordedAudio &&
        (practiceState === "review" || practiceState === "evaluated") && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              How did you do?
            </h3>

            {practiceState === "review" && (
              <div className="flex gap-3">
                <Button variant="primary" onClick={handleGood}>
                  👍 Good (G)
                </Button>
                <Button variant="secondary" onClick={handleRetry}>
                  🔄 Retry (R)
                </Button>
              </div>
            )}

            {practiceState === "evaluated" && (
              <div className="space-y-4">
                <p className="text-success font-medium">
                  Great job! Keep going.
                </p>
                <Button variant="primary" onClick={handleNext}>
                  {isLastItem ? "🏁 Finish" : "➡️ Next (Space)"}
                </Button>
              </div>
            )}
          </Card>
        )}

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-text-muted text-xs">
        <span>Shortcuts: </span>
        <span className="mx-1">P = Play Model</span>
        <span className="mx-1">R = Record/Retry</span>
        <span className="mx-1">Space = Stop/Play/Next</span>
        <span className="mx-1">C = Compare</span>
        <span className="mx-1">G = Good</span>
      </div>
    </div>
  );
}

export default CallanShadowing;
