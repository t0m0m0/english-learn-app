import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSpeechRecognition } from './useSpeechRecognition';

// Store instance reference for tests
let currentMockInstance: MockSpeechRecognition | null = null;

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor() {
    currentMockInstance = this;
  }

  start = vi.fn().mockImplementation(() => {
    setTimeout(() => this.onstart?.(), 0);
  });

  stop = vi.fn().mockImplementation(() => {
    setTimeout(() => this.onend?.(), 0);
  });

  abort = vi.fn();

  simulateResult(transcript: string, isFinal: boolean) {
    const mockResult = {
      length: 1,
      0: {
        isFinal,
        length: 1,
        0: { transcript, confidence: 0.9 },
      },
    };
    this.onresult?.({ results: mockResult as unknown as SpeechRecognitionResultList });
  }

  simulateError(error: string) {
    this.onerror?.({ error });
  }
}

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    currentMockInstance = null;
    
    // Set up the global mock as a class
    (globalThis as unknown as { SpeechRecognition: typeof MockSpeechRecognition }).SpeechRecognition = MockSpeechRecognition;
    (globalThis as unknown as { webkitSpeechRecognition: typeof MockSpeechRecognition }).webkitSpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    vi.clearAllMocks();
    currentMockInstance = null;
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.transcript).toBe('');
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should start listening when startListening is called', async () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });
    expect(currentMockInstance?.start).toHaveBeenCalled();
  });

  it('should stop listening when stopListening is called', async () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });

    act(() => {
      result.current.stopListening();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(false);
    });
    expect(currentMockInstance?.stop).toHaveBeenCalled();
  });

  it('should update transcript when speech is recognized', async () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });

    act(() => {
      currentMockInstance?.simulateResult('hello world', true);
    });

    expect(result.current.transcript).toBe('hello world');
  });

  it('should update interim transcript for non-final results', async () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });

    act(() => {
      currentMockInstance?.simulateResult('hel', false);
    });

    expect(result.current.interimTranscript).toBe('hel');
  });

  it('should reset transcript when resetTranscript is called', async () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });

    act(() => {
      currentMockInstance?.simulateResult('hello world', true);
    });

    expect(result.current.transcript).toBe('hello world');

    act(() => {
      result.current.resetTranscript();
    });

    expect(result.current.transcript).toBe('');
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });

    act(() => {
      currentMockInstance?.simulateError('no-speech');
    });

    expect(result.current.error).toBe('no-speech');
    expect(result.current.isListening).toBe(false);
  });

  it('should indicate unsupported when SpeechRecognition is not available', () => {
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.isSupported).toBe(false);
  });

  it('should accept language option', () => {
    renderHook(() => useSpeechRecognition({ language: 'ja-JP' }));

    expect(currentMockInstance?.lang).toBe('ja-JP');
  });

  it('should accept continuous option', () => {
    renderHook(() => useSpeechRecognition({ continuous: true }));

    expect(currentMockInstance?.continuous).toBe(true);
  });
});
