import { useState, useCallback, useRef, useEffect } from 'react';

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
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported = typeof MediaRecorder !== 'undefined';

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
      setError('MediaRecorder is not supported in this browser');
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
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
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
        setError('Recording error occurred');
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
      setError('Microphone access denied. Please allow microphone access to record.');
      setIsRecording(false);
    }
  }, [isSupported, cleanupStream, stopDurationTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      stopDurationTimer();
      if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url);
      }
    };
  }, [cleanupStream, stopDurationTimer, recordedAudio?.url]);

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
