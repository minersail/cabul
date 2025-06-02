import { useCallback, useEffect } from 'react';
import { SpaCyTokenizationResponse } from '@/types/tokenization';
import { translateWord, translateSentence, lookupWiktionary } from '../utils/fetchApi';
import { generateAllPhrases } from '../utils/phrasing';
import { CanvasAction } from '@/reducers/vocabCanvasReducer';
import { Dispatch } from 'react';
import { getOriginalTextForToken, getSentenceContext, getLearnableWords } from '../utils/tokenization';

// Key mapping dictionary for easier management
export const KEY_MAPPINGS = {
  NAVIGATION_MODE: {
    ADVANCE: { key: 'KeyE', instruction: 'I know this word' },
    TRANSLATE_WORD: { key: 'KeyW', instruction: 'Need help with word' },
    GO_BACK: { key: 'KeyQ', instruction: 'Go back to previous word' },
  },
  LEARNING_MODE: {
    TRANSLATE_WORD: { key: 'KeyW', instruction: 'Translate word' },
    TRANSLATE_SENTENCE: { key: 'KeyA', instruction: 'Translate sentence' },
    LOOKUP_WIKTIONARY: { key: 'KeyS', instruction: 'Look up word on wiktionary' },
    DETECT_PHRASES: { key: 'KeyD', instruction: 'Phrase detection' },
    ADVANCE: { key: 'KeyE', instruction: 'Next word' },
    GO_BACK: { key: 'KeyQ', instruction: 'Previous word' },
  }
} as const;

interface UseKeyPressConfig {
  currentWordIndex: number;
  furthestWordIndex: number;
  tokenizationInfo: SpaCyTokenizationResponse;
  dispatch: Dispatch<CanvasAction>;
  updateWordStats: (word: string, wasCorrect: boolean) => Promise<void>;
  setIsLearningMode: (value: boolean) => void;
}

export function useLearningModeKeyPress({
  currentWordIndex,
  furthestWordIndex,
  tokenizationInfo,
  dispatch,
  setIsLearningMode
}: UseKeyPressConfig) {
  return useCallback(async (event: KeyboardEvent): Promise<boolean> => {
    const learnableWords = getLearnableWords(tokenizationInfo.tokens);
    const currentLearnableToken = learnableWords[currentWordIndex];
    if (!currentLearnableToken) return false;

    const currentWord = getOriginalTextForToken(tokenizationInfo.text, currentLearnableToken);

    switch (event.code) {
      case KEY_MAPPINGS.LEARNING_MODE.ADVANCE.key: {
        setIsLearningMode(false);
        dispatch({ type: 'ADVANCE', payload: { wordCount: learnableWords.length } });
        return true;
      }

      case KEY_MAPPINGS.LEARNING_MODE.GO_BACK.key: {
        setIsLearningMode(false);
        dispatch({ type: 'NAVIGATE_BACK' });
        return true;
      }

      case KEY_MAPPINGS.LEARNING_MODE.TRANSLATE_WORD.key: {
        dispatch({ type: 'LOAD_INFO', payload: { displayType: 'wordTranslation' } });
        const response = await translateWord(
          getOriginalTextForToken(tokenizationInfo.text, currentLearnableToken),
          getSentenceContext(tokenizationInfo.text, tokenizationInfo.sentences || [], currentLearnableToken)
        );
        
        dispatch({ 
          type: 'TRANSLATE_WORD', 
          payload: {
            translation: response.result
          }
        });
        return true;
      }

      case KEY_MAPPINGS.LEARNING_MODE.TRANSLATE_SENTENCE.key: {
        const sentenceContext = getSentenceContext(tokenizationInfo.text, tokenizationInfo.sentences || [], currentLearnableToken);
        if (!sentenceContext) return false;

        dispatch({ type: 'LOAD_INFO', payload: { displayType: 'sentenceTranslation' } });
        const response = await translateSentence(sentenceContext);
        
        dispatch({ 
          type: 'TRANSLATE_SENTENCE',
          payload: {
            sentenceContext: sentenceContext,
            translation: response.result
          }
        });
        return true;
      }

      case KEY_MAPPINGS.LEARNING_MODE.LOOKUP_WIKTIONARY.key: {
        dispatch({ type: 'LOAD_INFO', payload: { displayType: 'wiktionary' } });
        const response = await lookupWiktionary(currentWord);
        dispatch({ 
          type: 'LOOKUP_WIKTIONARY',
          payload: {
            response: response
          }
        });
        return true;
      }

      case KEY_MAPPINGS.LEARNING_MODE.DETECT_PHRASES.key: {
        dispatch({ type: 'LOAD_INFO', payload: { displayType: 'phraseDetection' } });
        
        let phrases: string[] = [];
        const headToken = tokenizationInfo.tokens.find(token => 
          getOriginalTextForToken(tokenizationInfo.text, token) === currentLearnableToken.head
        );

        if (headToken?.children) {
          phrases = generateAllPhrases(tokenizationInfo.tokens, currentLearnableToken);
        }

        dispatch({ 
          type: 'DETECT_PHRASES',
          payload: {
            originalWord: currentWord,
            phrases: phrases,
          }
        });
        return true;
      }

      default:
        return false;
    }
  }, [currentWordIndex, furthestWordIndex, tokenizationInfo, dispatch, setIsLearningMode]);
}

export function useNavigationModeKeyPress({
  currentWordIndex,
  furthestWordIndex,
  tokenizationInfo,
  dispatch,
  updateWordStats,
  setIsLearningMode,
}: UseKeyPressConfig) {
  return useCallback(async (event: KeyboardEvent): Promise<boolean> => {
    const learnableWords = getLearnableWords(tokenizationInfo.tokens);
    const currentLearnableToken = learnableWords[currentWordIndex];
    if (!currentLearnableToken) return false;

    const currentWordText = getOriginalTextForToken(tokenizationInfo.text, currentLearnableToken).toLowerCase();

    switch (event.code) {
      case KEY_MAPPINGS.NAVIGATION_MODE.ADVANCE.key: {
        if (currentWordIndex >= furthestWordIndex) {
          await updateWordStats(currentWordText, true);
          dispatch({ type: 'SET_FLASH_STATE', payload: 'green' });
        }
        
        setTimeout(() => {
          dispatch({ type: 'ADVANCE', payload: { wordCount: learnableWords.length } });
        }, currentWordIndex >= furthestWordIndex ? 100 : 0);
        return true;
      }

      case KEY_MAPPINGS.NAVIGATION_MODE.GO_BACK.key: {
        dispatch({ type: 'NAVIGATE_BACK' });
        return true;
      }

      case KEY_MAPPINGS.NAVIGATION_MODE.TRANSLATE_WORD.key: {
        if (currentWordIndex >= furthestWordIndex) {
          await updateWordStats(currentWordText, false);
        }
        
        dispatch({ type: 'LOAD_INFO', payload: { displayType: 'wordTranslation' } });
        
        const response = await translateWord(
          getOriginalTextForToken(tokenizationInfo.text, currentLearnableToken),
          getSentenceContext(tokenizationInfo.text, tokenizationInfo.sentences || [], currentLearnableToken)
        );
        
        dispatch({ 
          type: 'TRANSLATE_WORD', 
          payload: {
            translation: response.result
          }
        });
        setIsLearningMode(true);
        return true;
      }

      default:
        return false;
    }
  }, [currentWordIndex, furthestWordIndex, tokenizationInfo, dispatch, updateWordStats, setIsLearningMode]);
}

export function useInput(
  isLearningMode: boolean,
  config: UseKeyPressConfig
) {
  const handleLearningModeKeyPress = useLearningModeKeyPress(config);
  const handleNavigationModeKeyPress = useNavigationModeKeyPress(config);

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      const learnableWords = getLearnableWords(config.tokenizationInfo.tokens);
      const wordCount = learnableWords.length;

      if (wordCount === 0 || 
          (config.currentWordIndex >= wordCount && 
           !(config.currentWordIndex === 0 && wordCount === 0))) {
        if (!(config.currentWordIndex === 0 && wordCount === 0)) { 
          return;
        }
      }

      // Get all possible keys that should be handled
      const allHandledKeys: string[] = [
        ...Object.values(KEY_MAPPINGS.NAVIGATION_MODE).map(action => action.key),
        ...Object.values(KEY_MAPPINGS.LEARNING_MODE).map(action => action.key)
      ];

      if (allHandledKeys.includes(event.code)) {
        event.preventDefault();
      }

      if (isLearningMode) {
        await handleLearningModeKeyPress(event);
      } else {
        await handleNavigationModeKeyPress(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    isLearningMode,
    handleLearningModeKeyPress,
    handleNavigationModeKeyPress,
    config
  ]);
} 