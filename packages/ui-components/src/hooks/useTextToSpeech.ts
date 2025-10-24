/**
 * useTextToSpeech Hook
 * Provides browser-based text-to-speech functionality with multi-language support
 * Supports English and Chinese (Simplified Chinese zh-CN) with automatic voice selection
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// No additional declarations needed - browser types are sufficient

export interface UseTextToSpeechOptions {
  rate?: number; // 0.1 to 10 (default: 0.9)
  pitch?: number; // 0 to 2 (default: 1.0)
  volume?: number; // 0 to 1 (default: 0.8)
  voice?: string; // Voice name or null for default
  lang?: string; // Language code (default: 'en-US', supports 'zh-CN')
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  preserveEntities?: boolean; // Whether to preserve entity names in speech (default: false)
  cleanMarkdown?: boolean; // Whether to clean markdown formatting (default: true)
}

export interface UseTextToSpeechReturn {
  // State
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  currentText: string;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  
  // Controls
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVoice: (voiceName: string) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const {
    rate = 0.9,
    pitch = 1.0,
    volume = 0.8,
    voice: preferredVoice,
    lang: preferredLang,
    preserveEntities = false,
    cleanMarkdown = true,
    onStart,
    onEnd,
    onError
  } = options;

  // Check browser support
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (supported) {
      // Load voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Auto-select voice if not already selected
        if (voices.length > 0 && !selectedVoice) {
          const autoSelectedVoice = selectVoiceForLanguage(preferredLang || 'en-US', voices);
          setSelectedVoice(autoSelectedVoice);
        }
      };
      
      // Load voices immediately and when they change
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [preferredLang, selectedVoice]);

  // Auto-detect language from text or use user's language preference
  const detectLanguage = useCallback((text: string, userLocale?: string): string => {
    // Check user's language preference first
    if (userLocale === 'zh-CN') {
      return 'zh-CN';
    }
    
    // Check if text contains Chinese characters
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (chineseRegex.test(text)) {
      return 'zh-CN';
    }
    
    return 'en-US';
  }, []);

  // Select voice based on detected language
  const selectVoiceForLanguage = useCallback((lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (lang === 'zh-CN') {
      return findChineseVoice(voices);
    }
    return findEnglishVoice(voices);
  }, []);

  // Find English voice (priority order for natural-sounding voices)
  const findEnglishVoice = useCallback((voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen') || voice.name.includes('Neural'))
    );
    
    // Priority order for most natural-sounding English voices
    const preferredNames = [
      'Samantha',                    // macOS - Very natural
      'Karen',                      // macOS - Natural
      'Google UK English Female',   // Chrome - Neural voice
      'Google US English Female',   // Chrome - Neural voice
      'Microsoft Zira Desktop',     // Windows - Natural
      'Microsoft Susan Desktop',     // Windows - Alternative
      'Alex',                       // macOS - Alternative
      'Victoria'                    // macOS - Alternative
    ];
    
    for (const name of preferredNames) {
      const voice = englishVoices.find(v => v.name.includes(name));
      if (voice) return voice;
    }
    
    // Look for any neural or enhanced voices
    const neuralVoice = englishVoices.find(v => 
      v.name.includes('Neural') || 
      v.name.includes('Enhanced') || 
      v.name.includes('Premium')
    );
    if (neuralVoice) return neuralVoice;
    
    // Fallback to first English female voice
    return englishVoices.find(v => v.name.includes('Female')) || englishVoices[0] || null;
  }, []);

  // Find Chinese voice (priority order for natural-sounding voices)
  const findChineseVoice = useCallback((voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    const chineseVoices = voices.filter(voice => 
      voice.lang.startsWith('zh') || 
      voice.name.includes('中文') || 
      voice.name.includes('Chinese') ||
      voice.name.includes('Ting-Ting') ||
      voice.name.includes('Sin-Ji') ||
      voice.name.includes('Huihui') ||
      voice.name.includes('Yaoyao') ||
      voice.name.includes('Neural')
    );
    
    // Priority order for most natural-sounding Chinese voices
    const preferredNames = [
      'Ting-Ting',                    // macOS - Very natural Mandarin
      'Sin-Ji',                      // macOS - Natural Cantonese
      'Google 普通话（中国大陆）',      // Chrome - Neural Mandarin
      'Google 粤语（香港）',           // Chrome - Neural Cantonese
      'Microsoft Huihui Desktop',     // Windows - Natural Mandarin
      'Microsoft Yaoyao Desktop',    // Windows - Natural Mandarin
      'Microsoft Kangkang Desktop',   // Windows - Alternative
      'Microsoft Yaoyao'             // Windows - Alternative
    ];
    
    for (const name of preferredNames) {
      const voice = chineseVoices.find(v => v.name.includes(name));
      if (voice) return voice;
    }
    
    // Look for any neural or enhanced Chinese voices
    const neuralVoice = chineseVoices.find(v => 
      v.name.includes('Neural') || 
      v.name.includes('Enhanced') || 
      v.name.includes('Premium')
    );
    if (neuralVoice) return neuralVoice;
    
    // Fallback to first Chinese voice
    return chineseVoices[0] || null;
  }, []);

  // Preprocess text for more natural speech
  const preprocessText = useCallback((text: string): string => {
    if (!cleanMarkdown) {
      return text; // Skip preprocessing if disabled
    }

    let processedText = text;

    // Always preserve entity names but remove the markdown syntax
    // This ensures the meaningful content is spoken while removing technical clutter
    processedText = processedText
      .replace(/@\[([^\]]+)\]\([^:)]+:[^)]+\)/g, '$1') // Keep displayText from @[displayText](id:type)
      .replace(/@\[([^\]]+)\]\([^)]+\)/g, '$1'); // Keep displayText from @[displayText](url)

    return processedText
      // Remove markdown formatting
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '') // Remove markdown links [text](url)
      .replace(/`([^`]+)`/g, '') // Remove inline code `code`
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting **text**
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting *text*
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers # ## ###
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^\s*[-*+]\s+/gm, '') // Remove markdown list items
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list items
      .replace(/>\s*/g, '') // Remove blockquote markers
      .replace(/\|.*\|/g, '') // Remove table rows
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      // Remove only the most technical terms that truly clutter speech
      // Keep meaningful terms like "concept", "memory", "artifact" as they add value
      .replace(/\b(cosmos_views?|app|dashboard|chat|cards|entity|entities|reference|references|data|id|type|url|href|src|alt|class|style|html|css|js|json|api|endpoint|request|response|status|code|error|success|fail|true|false|null|undefined|object|array|string|number|boolean|function|method|property|attribute|parameter|argument|variable|constant|let|var|const|if|else|for|while|do|switch|case|break|continue|return|throw|try|catch|finally|new|this|super|extends|implements|interface|class|public|private|protected|static|final|abstract|synchronized|volatile|transient|native|strictfp)\b/gi, '')
      // Add pauses after sentences for more natural rhythm
      .replace(/\./g, '. ')
      .replace(/\?/g, '? ')
      .replace(/!/g, '! ')
      // Add slight pauses after commas
      .replace(/,/g, ', ')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }, [preserveEntities, cleanMarkdown]);

  // Create speech utterance
  const createUtterance = useCallback((text: string): SpeechSynthesisUtterance => {
    const processedText = preprocessText(text);
    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Configure speech parameters for more natural sound
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    // Set language
    const detectedLang = detectLanguage(text, preferredLang);
    utterance.lang = detectedLang;
    
    // Set voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else if (availableVoices.length > 0) {
      // Auto-select voice based on detected language
      const autoVoice = selectVoiceForLanguage(detectedLang, availableVoices);
      if (autoVoice) {
        utterance.voice = autoVoice;
      }
    }
    
    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentText(text);
      onStart?.();
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText('');
      onEnd?.();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText('');
      onError?.(event.error);
    };
    
    utterance.onpause = () => {
      setIsPaused(true);
    };
    
    utterance.onresume = () => {
      setIsPaused(false);
    };
    
    return utterance;
  }, [rate, pitch, volume, selectedVoice, availableVoices, preferredLang, detectLanguage, selectVoiceForLanguage, onStart, onEnd, onError]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported');
      onError?.('Speech synthesis not supported');
      return;
    }
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    // Create new utterance
    const utterance = createUtterance(text);
    utteranceRef.current = utterance;
    currentUtteranceRef.current = utterance;
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  }, [isSupported, createUtterance, onError]);

  // Pause speech
  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking, isPaused]);

  // Resume speech
  const resume = useCallback(() => {
    if (isSupported && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isSupported, isSpeaking, isPaused]);

  // Stop speech
  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText('');
    }
  }, [isSupported]);

  // Set voice by name
  const setVoice = useCallback((voiceName: string) => {
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
    }
  }, [availableVoices]);

  // Set speech rate
  const setRate = useCallback((newRate: number) => {
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current.rate = newRate;
    }
  }, []);

  // Set speech pitch
  const setPitch = useCallback((newPitch: number) => {
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current.pitch = newPitch;
    }
  }, []);

  // Set speech volume
  const setVolume = useCallback((newVolume: number) => {
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current.volume = newVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    // State
    isSpeaking,
    isPaused,
    isSupported,
    currentText,
    availableVoices,
    selectedVoice,
    
    // Controls
    speak,
    pause,
    resume,
    stop,
    setVoice,
    setRate,
    setPitch,
    setVolume
  };
}

export default useTextToSpeech;
