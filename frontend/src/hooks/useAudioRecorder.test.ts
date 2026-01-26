import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAudioRecorder } from './useAudioRecorder';

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: { error: Error }) => void) | null = null;
  onstart: (() => void) | null = null;
  stream: MediaStream;
  
  static isTypeSupported = vi.fn(() => true);

  constructor(stream: MediaStream) {
    this.stream = stream;
  }

  start() {
    this.state = 'recording';
    this.onstart?.();
  }

  stop() {
    this.state = 'inactive';
    // Simulate data available event
    this.ondataavailable?.({ data: new Blob(['test audio'], { type: 'audio/webm' }) });
    this.onstop?.();
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

// Mock MediaStream
class MockMediaStream {
  private tracks: { stop: () => void }[] = [];
  
  getTracks() {
    return this.tracks;
  }
  
  addTrack() {
    this.tracks.push({ stop: vi.fn() });
  }
}

// Mock getUserMedia
const mockGetUserMedia = vi.fn();

describe('useAudioRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Setup global mocks
    (globalThis as typeof globalThis & { MediaRecorder: typeof MediaRecorder }).MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
    
    // Mock navigator.mediaDevices
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
      configurable: true,
    });
    
    // Default getUserMedia mock implementation
    const mockStream = new MockMediaStream();
    mockStream.addTrack();
    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should return initial state with isRecording false', () => {
      const { result } = renderHook(() => useAudioRecorder());

      expect(result.current.isRecording).toBe(false);
    });

    it('should return isSupported true when MediaRecorder is available', () => {
      const { result } = renderHook(() => useAudioRecorder());

      expect(result.current.isSupported).toBe(true);
    });

    it('should return isSupported false when MediaRecorder is not available', () => {
      // Remove MediaRecorder
      const original = globalThis.MediaRecorder;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).MediaRecorder = undefined;

      const { result } = renderHook(() => useAudioRecorder());

      expect(result.current.isSupported).toBe(false);

      // Restore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).MediaRecorder = original;
    });

    it('should have no recorded audio initially', () => {
      const { result } = renderHook(() => useAudioRecorder());

      expect(result.current.recordedAudio).toBeNull();
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useAudioRecorder());

      expect(result.current.error).toBeNull();
    });

    it('should have duration of 0 initially', () => {
      const { result } = renderHook(() => useAudioRecorder());

      expect(result.current.duration).toBe(0);
    });
  });

  describe('startRecording', () => {
    it('should request microphone permission', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('should set isRecording to true after starting', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);
    });

    it('should set error when getUserMedia fails', async () => {
      const permissionError = new DOMException('Permission denied', 'NotAllowedError');
      mockGetUserMedia.mockRejectedValueOnce(permissionError);

      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.error).toBe('Microphone access denied. Please allow microphone access in your browser settings.');
      expect(result.current.isRecording).toBe(false);
    });

    it('should clear previous recorded audio when starting new recording', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      // First recording
      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.recordedAudio).not.toBeNull();

      // Start new recording
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.recordedAudio).toBeNull();
    });

    it('should track recording duration', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Advance time by 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.duration).toBeGreaterThanOrEqual(2);
    });
  });

  describe('stopRecording', () => {
    it('should set isRecording to false', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.isRecording).toBe(false);
    });

    it('should create recorded audio with blob and url', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.recordedAudio).not.toBeNull();
      expect(result.current.recordedAudio?.blob).toBeInstanceOf(Blob);
      expect(result.current.recordedAudio?.url).toBeDefined();
    });

    it('should do nothing if not recording', () => {
      const { result } = renderHook(() => useAudioRecorder());

      // Should not throw
      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.isRecording).toBe(false);
    });

    it('should stop the duration timer', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const durationAtStop = result.current.duration;

      act(() => {
        result.current.stopRecording();
      });

      // Advance more time
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Duration should not have increased
      expect(result.current.duration).toBe(durationAtStop);
    });
  });

  describe('clearRecording', () => {
    it('should clear recorded audio', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.recordedAudio).not.toBeNull();

      act(() => {
        result.current.clearRecording();
      });

      expect(result.current.recordedAudio).toBeNull();
    });

    it('should reset duration to 0', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.duration).toBeGreaterThan(0);

      act(() => {
        result.current.clearRecording();
      });

      expect(result.current.duration).toBe(0);
    });

    it('should clear error', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearRecording();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should stop media stream tracks on unmount', async () => {
      const mockTrackStop = vi.fn();
      const mockStream = {
        getTracks: () => [{ stop: mockTrackStop }],
      };
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      const { result, unmount } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      unmount();

      expect(mockTrackStop).toHaveBeenCalled();
    });

    it('should cleanup timers on unmount', async () => {
      const { result, unmount } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Unmount while recording
      unmount();

      // Advance timers - should not cause errors
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // If we get here without errors, cleanup worked
      expect(true).toBe(true);
    });
  });

  describe('recorded audio format', () => {
    it('should record in webm format when supported', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.recordedAudio?.blob.type).toBe('audio/webm');
    });
  });
});
