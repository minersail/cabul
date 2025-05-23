import { Token } from "@/utils/tokenization";
import { getCompositionColor } from "@/utils/tokenization";

export interface TranslationResult {
  translation: string;
  compositionality?: {
    score: number;
    interpretation: string;
  };
}

interface VocabTokenProps {
  token: Token;
  index: number;
  isCurrentWord: boolean;
  className: string;
  showTranslation: boolean;
  result: TranslationResult | null;
  isLoading: boolean;
}

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