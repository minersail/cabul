import { getCompositionColor } from "@/utils/tokenization";
import { SpaCyToken } from "@/types/tokenization";


/**
 * Represents the result of a translation operation
 * @interface TranslationResult
 * @property {string} translation - The translated text
 * @property {Object} [compositionality] - Optional compositionality analysis
 * @property {number} compositionality.score - Compositionality score between 0-1
 * @property {string} compositionality.interpretation - Human readable interpretation of the score
 * @property {string} [lemma] - Lemma of the word
 * @property {string} [pos] - Part of speech of the word
 */
export interface TranslationResult {
  translation: string;
  compositionality?: {
    score: number;
    interpretation: string;
  };
  lemma?: string;
  pos?: string;
}

/**
 * Props for the VocabToken component
 * @interface VocabTokenProps
 * @property {SpaCyToken} spacyToken - The new SpaCy token object
 * @property {string} originalText - The original text segment for this token (including its own whitespace if any, though spaCy usually separates)
 * @property {boolean} isCurrentWord - Whether this token is the currently focused word
 * @property {string} className - used to indicate known/unknown word, etc.
 * @property {boolean} showTranslation - Whether to show the translation popup
 * @property {TranslationResult | null} result - Translation/compositionality/lemma/pos result
 * @property {boolean} isLoading - Whether translation is in progress
 */
interface VocabTokenProps {
  spacyToken: SpaCyToken;
  originalText: string;
  isCurrentWord: boolean;
  className: string;
  showTranslation: boolean;
  result: TranslationResult | null;
  isLoading: boolean;
}


/**
 * Renders a single token (word or punctuation) in the vocabulary learning interface
 * with optional translation popup for the current word.
 */
export default function VocabToken({
  spacyToken,
  originalText,
  isCurrentWord,
  className,
  showTranslation,
  result,
  isLoading
}: VocabTokenProps) {

  // Enhance result with lemma and POS if available and it's the current word
  // This might be better handled in VocabCanvas when setResult is called,
  // but can also be done here if result is specific to this token when shown.
  // For now, let's assume `result` might be enriched by VocabCanvas before passing.
  // Or, we can add it directly here if the `result` object is for this specific token.

  // If `result` is populated and this is the current word, try to add lemma/pos from spacyToken to display
  const displayResult = (isCurrentWord && result) 
    ? { 
        ...result, 
        lemma: result.lemma || spacyToken.lemma, 
        pos: result.pos || spacyToken.pos 
      } 
    : result;

  return (
    <span
      className={className}
      data-lemma={spacyToken.lemma}
      data-pos={spacyToken.pos}
    >
      {originalText}
      {isCurrentWord && showTranslation && displayResult && (
        <div
          className="absolute z-50"
          style={{
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <div
            className="bg-yellow-100 shadow-lg px-3 py-2 rotate-1 border-t-4 border-yellow-200 text-left"
            style={{
              whiteSpace: 'nowrap',
              transform: 'rotate(-10deg)',
              boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
              minWidth: '150px'
            }}
          >
            <p className="text-sm text-gray-700 font-handwriting">
              {isLoading ? 'Analyzing...' : displayResult.translation}
            </p>
            {displayResult.lemma && !isLoading && (
              <p className="text-xs font-mono text-purple-600">
                Lemma: {displayResult.lemma}
              </p>
            )}
            {displayResult.pos && !isLoading && (
              <p className="text-xs font-mono text-blue-600">
                POS: {displayResult.pos}
              </p>
            )}
            {displayResult.compositionality && !isLoading && (
              <p 
                className="text-xs font-mono mt-1 pt-1 border-t border-yellow-200"
                style={{ color: getCompositionColor(displayResult.compositionality.score) }}
              >
                Compositionality: {(displayResult.compositionality.score * 100).toFixed(1)}%
                <br />
                <span className="text-gray-600 text-[10px]">
                  {displayResult.compositionality.interpretation}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </span>
  );
} 