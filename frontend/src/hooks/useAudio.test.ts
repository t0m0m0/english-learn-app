import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAudio } from './useAudio';

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string;
  rate: number = 1;
  pitch: number = 1;
  volume: number = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

// Mock voices
const mockVoices: SpeechSynthesisVoice[] = [
  {
    name: 'Samantha',
    lang: 'en-US',
    voiceURI: 'Samantha',
    localService: true,
    default: true,
  },
  {
    name: 'Google US English',
    lang: 'en-US',
    voiceURI: 'Google US English',
    localService: false,
    default: false,
  },
  {
    name: 'Japanese',
    lang: 'ja-JP',
    voiceURI: 'Japanese',
    localService: true,
    default: false,
  },
];

// Mock speechSynthesis
const mockSpeechSynthesis = {
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null as (() => void) | null,
  getVoices: vi.fn(() => mockVoices),
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
};

describe('useAudio', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Reset mock state
    mockSpeechSynthesis.speaking = false;
    mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
    mockSpeechSynthesis.pause.mockClear();
    mockSpeechSynthesis.resume.mockClear();
    mockSpeechSynthesis.onvoiceschanged = null;

    // Setup global mocks
    global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;
    global.speechSynthesis = mockSpeechSynthesis as unknown as SpeechSynthesis;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should load voices on mount', () => {
      renderHook(() => useAudio());

      expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
    });

    it('should filter for English voices only', () => {
      const { result } = renderHook(() => useAudio());

      // English voices should be available
      expect(result.current.availableVoices).toHaveLength(2);
      expect(result.current.availableVoices.every(v => v.lang.startsWith('en'))).toBe(true);
    });

    it('should set up onvoiceschanged listener for Chrome', () => {
      renderHook(() => useAudio());

      expect(mockSpeechSynthesis.onvoiceschanged).not.toBeNull();
    });

    it('should handle voices loading asynchronously via onvoiceschanged', () => {
      // Start with empty voices
      mockSpeechSynthesis.getVoices.mockReturnValue([]);

      const { result } = renderHook(() => useAudio());

      expect(result.current.availableVoices).toHaveLength(0);

      // Simulate Chrome's async voice loading
      mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);

      act(() => {
        if (mockSpeechSynthesis.onvoiceschanged) {
          mockSpeechSynthesis.onvoiceschanged();
        }
      });

      expect(result.current.availableVoices).toHaveLength(2);
    });

    it('should return initial isSpeaking as false', () => {
      const { result } = renderHook(() => useAudio());

      expect(result.current.isSpeaking).toBe(false);
    });

    it('should set isReady to true when voices are loaded', () => {
      const { result } = renderHook(() => useAudio());

      expect(result.current.isReady).toBe(true);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useAudio());

      expect(result.current.error).toBeNull();
    });

    it('should retry loading voices after timeout if none available initially', () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([]);

      const initialCallCount = mockSpeechSynthesis.getVoices.mock.calls.length;

      renderHook(() => useAudio());

      const callsAfterMount = mockSpeechSynthesis.getVoices.mock.calls.length - initialCallCount;

      // After timeout (now 1000ms), should have more calls
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const callsAfterTimeout = mockSpeechSynthesis.getVoices.mock.calls.length - initialCallCount;
      expect(callsAfterTimeout).toBeGreaterThan(callsAfterMount);
    });

    it('should set error after timeout if no voices available', () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([]);

      const { result } = renderHook(() => useAudio());

      // After timeout, should set error
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.error).toBe('No audio voices available. Please check your browser settings.');
    });
  });

  describe('speak', () => {
    it('should create utterance with correct text', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('hello');
      });

      // Wait for the setTimeout in speak()
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toBe('hello');
    });

    it('should use default rate, pitch, and volume', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('test');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(1);
      expect(utterance.pitch).toBe(1);
      expect(utterance.volume).toBe(1);
    });

    it('should use custom rate when provided', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('test', 0.5);
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(0.5);
    });

    it('should use options rate, pitch, volume from hook options', () => {
      const { result } = renderHook(() => useAudio({ rate: 1.5, pitch: 0.8, volume: 0.9 }));

      act(() => {
        result.current.speak('test');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(0.8);
      expect(utterance.volume).toBe(0.9);
    });

    it('should select Samantha voice preferentially for en-US', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('test');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.voice?.name).toBe('Samantha');
    });

    it('should cancel ongoing speech before speaking', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('hello');
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should set isSpeaking to true when speech starts', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('hello');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];

      act(() => {
        utterance.onstart?.();
      });

      expect(result.current.isSpeaking).toBe(true);
    });

    it('should set isSpeaking to false when speech ends', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('hello');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];

      act(() => {
        utterance.onstart?.();
      });

      expect(result.current.isSpeaking).toBe(true);

      act(() => {
        utterance.onend?.();
      });

      expect(result.current.isSpeaking).toBe(false);
    });

    it('should handle speech error and set isSpeaking to false and error state', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('hello');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];

      act(() => {
        utterance.onstart?.();
      });

      act(() => {
        utterance.onerror?.({ error: 'network' });
      });

      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.error).toBe('Speech error: network');
    });

    it('should not log error for canceled speech', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('hello');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];

      act(() => {
        utterance.onerror?.({ error: 'canceled' });
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle when voices are not yet loaded', () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([]);

      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('test');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Should still speak, just without a voice set
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should set error when speech fails silently', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.speak('hello');
      });

      // Wait for speak timeout
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Simulate silent failure - not speaking and not pending
      mockSpeechSynthesis.speaking = false;
      mockSpeechSynthesis.pending = false;

      // Wait for the check timeout
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.error).toBe('Speech failed to start. Please try again.');
    });

    it('should clear previous timers when speak is called again', () => {
      const { result } = renderHook(() => useAudio());

      // First speak call
      act(() => {
        result.current.speak('first');
      });

      // Immediately call speak again before timers fire
      act(() => {
        result.current.speak('second');
      });

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Only the second speak should have been called
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toBe('second');
    });
  });

  describe('stop', () => {
    it('should cancel speech synthesis', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.stop();
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should set isSpeaking to false', () => {
      const { result } = renderHook(() => useAudio());

      // Start speaking first
      act(() => {
        result.current.speak('hello');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];

      act(() => {
        utterance.onstart?.();
      });

      expect(result.current.isSpeaking).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isSpeaking).toBe(false);
    });
  });

  describe('pause', () => {
    it('should pause speech synthesis', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.pause();
      });

      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    });
  });

  describe('resume', () => {
    it('should resume speech synthesis', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.resume();
      });

      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });
  });

  describe('loadVoices', () => {
    it('should be callable and return English voices', () => {
      const { result } = renderHook(() => useAudio());

      let voices: SpeechSynthesisVoice[] = [];
      act(() => {
        voices = result.current.loadVoices();
      });

      expect(voices).toHaveLength(2);
      expect(voices.every(v => v.lang.startsWith('en'))).toBe(true);
    });
  });

  describe('cancelSequence', () => {
    it('should cancel speech synthesis when called', () => {
      const { result } = renderHook(() => useAudio());

      act(() => {
        result.current.cancelSequence();
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should set isSpeaking to false when called', () => {
      const { result } = renderHook(() => useAudio());

      // Start speaking first
      act(() => {
        result.current.speak('hello');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];

      act(() => {
        utterance.onstart?.();
      });

      expect(result.current.isSpeaking).toBe(true);

      act(() => {
        result.current.cancelSequence();
      });

      expect(result.current.isSpeaking).toBe(false);
    });
  });

  describe('speakSequence', () => {
    it('should call speak for each word in sequence', () => {
      const { result } = renderHook(() => useAudio());

      const words = ['hello', 'world'];

      // Start the sequence
      act(() => {
        result.current.speakSequence(words, 100);
      });

      // First speak call happens immediately (before the 150ms timeout)
      // The speak function is called, which calls cancel() then setTimeout
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();

      // Advance past the speak timeout to trigger speechSynthesis.speak
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      expect(mockSpeechSynthesis.speak.mock.calls[0][0].text).toBe('hello');
    });

    it('should stop sequence when cancelSequence is called', async () => {
      const { result } = renderHook(() => useAudio());

      const words = ['hello', 'world', 'test'];

      // Start the sequence
      act(() => {
        result.current.speakSequence(words, 100);
      });

      // First word should be spoken
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);

      // Cancel the sequence
      act(() => {
        result.current.cancelSequence();
      });

      // Simulate speech ending
      mockSpeechSynthesis.speaking = false;

      // Advance all timers
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // No more words should have been spoken
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should remove onvoiceschanged listener on unmount', () => {
      const { unmount } = renderHook(() => useAudio());

      expect(mockSpeechSynthesis.onvoiceschanged).not.toBeNull();

      unmount();

      expect(mockSpeechSynthesis.onvoiceschanged).toBeNull();
    });

    it('should cleanup timers on unmount', () => {
      const { result, unmount } = renderHook(() => useAudio());

      // Start speaking
      act(() => {
        result.current.speak('hello');
      });

      // Unmount before timers fire
      unmount();

      // Advance timers - should not cause errors
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // If we get here without errors, cleanup worked
      expect(true).toBe(true);
    });
  });
});
