import { useCallback, useEffect } from 'react';
import { SpaCyToken, SpaCyTokenizationResponse } from '@/types/tokenization';
import { translateWord, translateSentence, lookupWiktionary } from './fetchApi';
import { generateAllPhrases } from './phrasing';
import { CanvasAction } from '@/reducers/vocabCanvasReducer';
import { Dispatch } from 'react';
import { getOriginalTextForToken, getSentenceContext, getLearnableWords } from './tokenization';

interface UseKeyPressConfig {
  currentWordIndex: number;
  tokenizationInfo: SpaCyTokenizationResponse;
  dispatch: Dispatch<CanvasAction>;
  updateWordStats: (word: string, wasCorrect: boolean) => void;
  setIsLearningMode: (value: boolean) => void;
}

export function useLearningModeKeyPress({
  currentWordIndex,
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
      case 'KeyE': {
        setIsLearningMode(false);
        dispatch({ type: 'ADVANCE', payload: { wordCount: learnableWords.length } });
        return true;
      }

      case 'KeyQ': {
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

      case 'KeyW': {
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

      case 'KeyR': {
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
  }, [currentWordIndex, tokenizationInfo, dispatch, setIsLearningMode]);
}

export function useNavigationModeKeyPress({
  currentWordIndex,
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
      case 'KeyE': {
        updateWordStats(currentWordText, true);
        dispatch({ type: 'SET_FLASH_STATE', payload: 'green' });
        setTimeout(() => {
          dispatch({ type: 'ADVANCE', payload: { wordCount: learnableWords.length } });
        }, 100);
        return true;
      }

      case 'KeyQ': {
        updateWordStats(currentWordText, false);
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
  }, [currentWordIndex, tokenizationInfo, dispatch, updateWordStats, setIsLearningMode]);
}

export function useKeyboardNavigation(
  isLearningMode: boolean,
  config: UseKeyPressConfig
) {
  const handleLearningModeKeyPress = useLearningModeKeyPress(config);
  const handleNavigationModeKeyPress = useNavigationModeKeyPress(config);

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      const learnableWords = getLearnableWords(config.tokenizationInfo.tokens);
      const wordCount = learnableWords.length;

      // Early return if we're at the end
      if (wordCount === 0 || 
          (config.currentWordIndex >= wordCount && 
           !(config.currentWordIndex === 0 && wordCount === 0))) {
        if (!(config.currentWordIndex === 0 && wordCount === 0)) { 
          return;
        }
      }

      if (event.code in ['KeyE', 'KeyQ', 'KeyW', 'KeyR']) {
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