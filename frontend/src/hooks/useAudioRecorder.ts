import { useState, useCallback, useRef, useEffect } from "react";

export interface RecordedAudio {
  blob: Blob;
  duration: number;
  url: string;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isSupported: boolean;
  recordedAudio: RecordedAudio | null;
  duration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(
    null,
  );
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const startTimeRef = useRef<number>(0);

  const isSupported = typeof MediaRecorder !== "undefined";

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("MediaRecorder is not supported in this browser");
      return;
    }

    // Clear previous recording
    setRecordedAudio(null);
    setError(null);
    chunksRef.current = [];
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const recordedDuration = (Date.now() - startTimeRef.current) / 1000;

        setRecordedAudio({
          blob,
          duration: recordedDuration,
          url,
        });

        cleanupStream();
      };

      mediaRecorder.onerror = () => {
        const errorMessage = "An error occurred during recording";
        console.error("MediaRecorder error:", errorMessage);
        setError(`Recording failed: ${errorMessage}`);
        setIsRecording(false);
        cleanupStream();
        stopDurationTimer();
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      setIsRecording(false);

      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            setError(
              "Microphone access denied. Please allow microphone access in your browser settings.",
            );
            break;
          case "NotFoundError":
            setError(
              "No microphone found. Please connect a microphone and try again.",
            );
            break;
          case "NotReadableError":
            setError(
              "Microphone is in use by another application. Please close other apps using the microphone.",
            );
            break;
          case "OverconstrainedError":
            setError("Could not find a microphone with the required settings.");
            break;
          case "SecurityError":
            setError("Recording requires a secure connection (HTTPS).");
            break;
          default:
            setError(`Recording failed: ${err.message || err.name}`);
        }
      } else {
        setError("An unexpected error occurred while starting the recording.");
        console.error("Recording error:", err);
      }
    }
  }, [isSupported, cleanupStream, stopDurationTimer]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopDurationTimer();
    }
  }, [stopDurationTimer]);

  const clearRecording = useCallback(() => {
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  }, [recordedAudio?.url]);

  // Store URL ref for cleanup (to avoid dependency on recordedAudio)
  const recordedUrlRef = useRef<string | null>(null);

  // Update ref when recordedAudio changes
  useEffect(() => {
    recordedUrlRef.current = recordedAudio?.url ?? null;
  }, [recordedAudio?.url]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      cleanupStream();
      stopDurationTimer();
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isRecording,
    isSupported,
    recordedAudio,
    duration,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
}

export default useAudioRecorder;
