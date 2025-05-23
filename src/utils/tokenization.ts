// Old Token interface - can be removed if not used elsewhere
// export interface Token {
//   text: string;
//   isWord: boolean;
//   start?: number; // Optional: original start index in content
//   end?: number;   // Optional: original end index in content
// }

// Old tokenizeContent - REMOVED
// export function tokenizeContent(content: string): Token[] { ... }

// Old getSentenceContext - REMOVED
// export function getSentenceContext(tokens: Token[], currentWordIndex: number): string { ... }

// Old getNGram - REMOVED
// export function getNGram(tokens: Token[], currentWordIndex: number, n: number = 3): string { ... }

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