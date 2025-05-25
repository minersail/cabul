import { getCompositionColor } from "@/utils/tokenization";
import { SpaCyToken } from "@/types/tokenization";

export type InformationDisplayType = 'wordTranslation' | 'sentenceTranslation' | 'wiktionary' | 'phraseDetection' | 'none';

/**
 * Word translation specific information
 */
interface WordTranslationInfo {
  translation: string;
  compositionality?: {
    score: number;
    interpretation: string;
  };
}

/**
 * Sentence translation specific information
 */
interface SentenceTranslationInfo {
  fullSentence: string;
  translation: string;
}

/**
 * Wiktionary specific information
 */
interface WiktionaryInfo {
  word: string;
  etymology: string | null;
  pronunciation: string | null;
  definitions: string[];
  url: string;
}

/**
 * Phrase detection specific information - stub for now
 */
interface PhraseDetectionInfo {
  // Stub - will be implemented later
  stub: string;
}

/**
 * Combined token information interface
 */
export interface TokenInformation {
  displayType: InformationDisplayType;
  wordTranslation?: WordTranslationInfo;
  sentenceTranslation?: SentenceTranslationInfo;
  wiktionary?: WiktionaryInfo;
  phraseDetection?: PhraseDetectionInfo;
}

/**
 * Props for the VocabToken component
 * @interface VocabTokenProps
 * @property {SpaCyToken} spacyToken - The new SpaCy token object
 * @property {string} originalText - The original text segment for this token (including its own whitespace if any, though spaCy usually separates)
 * @property {boolean} isCurrentWord - Whether this token is the currently focused word
 * @property {string} className - used to indicate known/unknown word, etc.
 * @property {boolean} showInformation - Whether to show the translation popup
 * @property {TokenInformation | null} tokenInfo - Translation/compositionality/lemma/pos result
 * @property {boolean} isLoading - Whether translation is in progress
 */
interface VocabTokenProps {
  spacyToken: SpaCyToken;
  originalText: string;
  isCurrentWord: boolean;
  className: string;
  showInformation: boolean;
  tokenInfo: TokenInformation | null;
  isLoading: boolean;
}

/**
 * Component to display word translation information
 */
function WordTranslationDisplay({ info, isLoading }: { info: WordTranslationInfo, isLoading: boolean }) {
  return (
    <div className="bg-yellow-100 shadow-lg px-3 py-2 rotate-1 border-t-6 border-yellow-200 text-left">
      <p className="text-sm text-gray-700 font-handwriting">
        {isLoading ? 'Analyzing...' : info.translation}
      </p>
      {info.compositionality && !isLoading && (
        <p 
          className="text-xs font-mono mt-1 pt-1 border-t border-yellow-200"
          style={{ color: getCompositionColor(info.compositionality.score) }}
        >
          Compositionality: {(info.compositionality.score * 100).toFixed(1)}%
          <br />
          <span className="text-gray-600 text-[10px]">
            {info.compositionality.interpretation}
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Component to display sentence translation information
 */
function SentenceTranslationDisplay({ info, isLoading }: { info: SentenceTranslationInfo, isLoading: boolean }) {
  return (
    <div className="bg-blue-50 shadow-lg px-3 py-2 border-t-6 border-blue-200 text-left max-w-[400px]">
      <p className="text-xs text-gray-600 font-handwriting mb-1">
        {info.fullSentence}
      </p>
      <p className="text-sm text-gray-700 font-handwriting">
        {isLoading ? 'Translating sentence...' : info.translation}
      </p>
    </div>
  );
}

/**
 * Component to display Wiktionary information
 */
function WiktionaryDisplay({ info, isLoading }: { info: WiktionaryInfo, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-purple-50 shadow-lg px-3 py-2 border-t-6 border-purple-200 text-left min-w-[300px] max-w-[400px]">
        <p className="text-sm text-gray-700 animate-pulse">Loading Wiktionary data...</p>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 shadow-lg px-3 py-2 border-t-6 border-purple-200 text-left min-w-[300px] max-w-[400px]">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-serif font-semibold text-purple-800">{info.word}</h3>
        {info.pronunciation && (
          <span className="text-sm font-mono text-purple-600">/{info.pronunciation}/</span>
        )}
      </div>
      
      {info.etymology && (
        <div className="mb-2">
          <p className="text-xs font-medium text-purple-700">Etymology</p>
          <p className="text-sm text-gray-600 italic">{info.etymology}</p>
        </div>
      )}

      {info.definitions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-purple-700 mb-1">Definitions</p>
          <ol className="list-decimal list-inside">
            {info.definitions.map((def, index) => (
              <li key={index} className="text-sm text-gray-700 mb-1">{def}</li>
            ))}
          </ol>
        </div>
      )}

      <a 
        href={info.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-purple-600 hover:text-purple-800 mt-2 block"
      >
        View on Wiktionary →
      </a>
    </div>
  );
}

/**
 * Component to display phrase detection information (stub)
 */
function PhraseDetectionDisplay({ info, isLoading }: { info: PhraseDetectionInfo, isLoading: boolean }) {
  return (
    <div className="bg-green-50 shadow-lg px-3 py-2 border-t-6 border-green-200 text-left">
      <p className="text-sm text-gray-700">
        {isLoading ? 'Analyzing phrases...' : 'Phrase detection coming soon'}
      </p>
    </div>
  );
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
  showInformation,
  tokenInfo,
  isLoading
}: VocabTokenProps) {
  return (
    <span
      className={className}
      data-lemma={spacyToken.lemma}
      data-pos={spacyToken.pos}
    >
      {originalText}
      {isCurrentWord && showInformation && tokenInfo && (
        <div
          className="absolute z-50"
          style={{
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          {tokenInfo.displayType === 'wordTranslation' && tokenInfo.wordTranslation && (
            <WordTranslationDisplay info={tokenInfo.wordTranslation} isLoading={isLoading} />
          )}
          {tokenInfo.displayType === 'sentenceTranslation' && tokenInfo.sentenceTranslation && (
            <SentenceTranslationDisplay info={tokenInfo.sentenceTranslation} isLoading={isLoading} />
          )}
          {tokenInfo.displayType === 'wiktionary' && tokenInfo.wiktionary && (
            <WiktionaryDisplay info={tokenInfo.wiktionary} isLoading={isLoading} />
          )}
          {tokenInfo.displayType === 'phraseDetection' && tokenInfo.phraseDetection && (
            <PhraseDetectionDisplay info={tokenInfo.phraseDetection} isLoading={isLoading} />
          )}
        </div>
      )}
    </span>
  );
} 