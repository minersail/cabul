import { Token } from "@/utils/tokenization";
import { getCompositionColor } from "@/utils/tokenization";


/**
 * Represents the result of a translation operation
 * @interface TranslationResult
 * @property {string} translation - The translated text
 * @property {Object} [compositionality] - Optional compositionality analysis
 * @property {number} compositionality.score - Compositionality score between 0-1
 * @property {string} compositionality.interpretation - Human readable interpretation of the score
 */
export interface TranslationResult {
  translation: string;
  compositionality?: {
    score: number;
    interpretation: string;
  };
}

/**
 * Props for the VocabToken component
 * @interface VocabTokenProps
 * @property {Token} token - The token object containing text and word flag
 * @property {number} index - Index of this token in the token array
 * @property {boolean} isCurrentWord - Whether this token is the currently focused word
 * @property {string} className - used to indicate known/unknown word, etc.
 * @property {boolean} showTranslation - Whether to show the translation popup
 * @property {TranslationResult | null} result - Translation/compositionality result
 * @property {boolean} isLoading - Whether translation is in progress
 */
interface VocabTokenProps {
  token: Token;
  index: number;
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
  token,
  index,
  isCurrentWord,
  className,
  showTranslation,
  result,
  isLoading
}: VocabTokenProps) {
  return (
    <span
      key={index}
      className={className}
    >
      {token.text}
      {isCurrentWord && showTranslation && result && (
        <div
          className="absolute z-50"
          style={{
            top: '-35px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <div
            className="bg-yellow-100 shadow-lg px-3 py-2 rotate-1 border-t-4 border-yellow-200"
            style={{
              whiteSpace: 'nowrap',
              textAlign: 'center',
              transform: 'rotate(-12deg)',
              boxShadow: '2px 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <p className="text-sm text-gray-700 font-handwriting">
              {isLoading ? 'Analyzing...' : result.translation}
            </p>
            {result.compositionality && !isLoading && (
              <p 
                className="text-xs font-mono mt-1 pt-1 border-t border-yellow-200"
                style={{ color: getCompositionColor(result.compositionality.score) }}
              >
                <br />
                Compositionality: {(result.compositionality.score * 100).toFixed(1)}%
                <br />
                <span className="text-gray-600 text-[10px]">
                  {result.compositionality.interpretation}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </span>
  );
} 