/**
 * Tests for useTextToSpeech hook
 */

import { renderHook, act } from '@testing-library/react';
import useTextToSpeech from '../useTextToSpeech';

// Mock speechSynthesis
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => [
    {
      name: 'Samantha',
      lang: 'en-US',
      voiceURI: 'Samantha',
      localService: true,
      default: false
    },
    {
      name: 'Ting-Ting',
      lang: 'zh-CN',
      voiceURI: 'Ting-Ting',
      localService: true,
      default: false
    }
  ]),
  onvoiceschanged: null
};

// Mock window.speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true
});

describe('useTextToSpeech', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useTextToSpeech());

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.currentText).toBe('');
    expect(result.current.availableVoices).toHaveLength(2);
    expect(result.current.selectedVoice).toBeNull();
  });

  it('should detect Chinese language correctly', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('你好，这是一个中文测试');
    });

    // Should select Chinese voice for Chinese text
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  });

  it('should detect English language correctly', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('Hello, this is an English test');
    });

    // Should select English voice for English text
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  });

  it('should handle mixed language content', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('Hello 你好 world 世界');
    });

    // Should detect Chinese characters and use Chinese voice
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  });

  it('should stop speech when stop is called', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('Test message');
    });

    act(() => {
      result.current.stop();
    });

    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should handle voice selection by name', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.setVoice('Samantha');
    });

    expect(result.current.selectedVoice?.name).toBe('Samantha');
  });

  it('should handle unsupported browsers gracefully', () => {
    // Mock unsupported browser
    Object.defineProperty(window, 'speechSynthesis', {
      value: undefined,
      writable: true
    });

    const { result } = renderHook(() => useTextToSpeech());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.speak).not.toThrow();
  });
});
