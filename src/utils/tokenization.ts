/**
 * Determines the color for displaying compositionality score.
 * @param {number} score - The compositionality score (0-1).
 * @returns {string} A tailwind color class.
 */
export function getCompositionColor(score: number): string {
  if (score > 0.7) return 'text-green-600'; // More compositional, less idiomatic
  if (score > 0.4) return 'text-yellow-600'; // Moderately compositional
  return 'text-red-600'; // Less compositional, more idiomatic
}

export type FlashType = 'none' | 'green' | 'red';

export function getCurrentTokenStyle(
  isWord: boolean, 
  currentWordCounter: number, 
  currentWordIndex: number, 
  flashState: FlashType
): string {
  let className = 'transition-all duration-200 ';
  
  if (!isWord) return className;
  
  if (currentWordCounter === currentWordIndex) {
    className += 'inline-block transform relative ';
    if (flashState === 'green') {
      className += 'bg-green-400 text-white px-1 rounded scale-110 ';
    } else if (flashState === 'red') {
      className += 'bg-red-400 text-white px-1 rounded scale-110 ';
    } else {
      className += 'bg-yellow-200 px-1 rounded scale-105 shadow-sm ';
    }
  } else if (currentWordCounter < currentWordIndex) {
    className += 'text-gray-400 ';
  }
  
  return className;
}

export function isTokenLearnable(token: SpaCyToken): boolean {
  return !token.is_punct && !token.is_space;
}

export function getLearnableWords(tokens: SpaCyToken[]): SpaCyToken[] {
  return tokens.filter(isTokenLearnable);
}

export function getOriginalTextForToken(processedText: string, token: SpaCyToken): string {
  if (!token || token.start === undefined || token.end === undefined) return '';
  return processedText.substring(token.start, token.end);
}

export function getSentenceContext(
  processedText: string,
  sentences: { start: number; end: number }[],
  token?: SpaCyToken
): string {
  if (!sentences || !token) {
    return "";
  }

  const sentence = sentences.find(sent => 
    token.start >= sent.start && token.end <= sent.end
  );
  
  return sentence ? processedText.substring(sentence.start, sentence.end) : "";
}

// Add SpaCyToken type import at the top
import { SpaCyToken } from '@/types/tokenization'; 