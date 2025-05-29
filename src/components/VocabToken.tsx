import { getCompositionColor } from "@/utils/tokenization";
import { SpaCyToken } from "@/types/tokenization";

export type InformationDisplayType = 'wordTranslation' | 'sentenceTranslation' | 'wiktionary' | 'phraseDetection' | 'none';

/**
 * Word translation specific information
 */
interface WordTranslationInfo {
  translation: string;
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
  originalWord: string;
  phrases: string[];
}

/**
 * Combined token information interface
 */
export interface TokenInformation {
  displayType?: InformationDisplayType;
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
 * @property {boolean} isClickable - Whether this token can be clicked to navigate to it
 * @property {() => void} onTokenClick - Click handler for navigating to this token
 */
interface VocabTokenProps {
  spacyToken: SpaCyToken;
  originalText: string;
  isCurrentWord: boolean;
  className: string;
  showInformation: boolean;
  tokenInfo: TokenInformation | null;
  isLoading: boolean;
  isClickable?: boolean;
  onTokenClick?: () => void;
}

/**
 * Component to display word translation information
 */
function WordTranslationDisplay({ info, isLoading }: { info?: WordTranslationInfo, isLoading: boolean }) {
  const shell = (text: string) => {
    return (
      <div className="bg-yellow-100 shadow-lg px-3 py-2 -rotate-8 border-t-6 border-yellow-200 text-left">
        <p className="text-sm text-gray-700">{text}</p>
      </div>
    );
  }

  if (isLoading) {
    return shell('Translating...');
  }
  
  if (!info) {
    return shell('Error fetching word translation');
  }

  return shell(info.translation);
}

/**
 * Component to display sentence translation information
 */
function SentenceTranslationDisplay({ info, isLoading }: { info?: SentenceTranslationInfo, isLoading: boolean }) {
  const shell = (text: string, text2?: string) => {
    return (
      <div className="min-w-[300px] max-w-[400px] relative"
           style={{
             background: '#fff',
             boxShadow: '2px 2px 5px rgba(0,0,0,0.15)',
             transform: 'rotate(-1deg)',
             padding: '24px 20px 16px',
             borderRadius: '2px',
             backgroundImage: `
               repeating-linear-gradient(
                 180deg,
                 transparent 0px,
                 transparent 23px,
                 #bfd8ff 23px,
                 #bfd8ff 24px
               ),
               linear-gradient(
                 transparent 14px,
                 #ff9c9c 14px,
                 #ff9c9c 15px,
                 transparent 15px
               ),
               linear-gradient(
                 180deg,
                 #fff7e6 0%,
                 #fff9ed 100%
               )
             `,
             backgroundSize: '100% 24px, 100% 100%, 100% 100%',
             backgroundRepeat: 'repeat, no-repeat, no-repeat',
             backgroundPosition: '0 0, 0 8px, 0 0'
           }}>
        <p className="text-sm leading-[24px] relative" 
           style={{ 
             fontFamily: "'Walter Turncoat', cursive",
             color: '#2c4a73'
           }}>
          {text}
        </p>
        <p className="text-sm leading-[24px] relative" 
          style={{ 
            fontFamily: "'Walter Turncoat', cursive",
            color: '#2c4a73',
            opacity: 0.8
          }}>
          {text2}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return shell('Translating sentence...');
  }

  if (!info) {
    return shell('Error fetching sentence translation');
  }

  return shell(info.fullSentence, info.translation);
}

/**
 * Component to display Wiktionary information
 */
function WiktionaryDisplay({ info, isLoading }: { info?: WiktionaryInfo, isLoading: boolean }) {
  // Helper function to decode HTML entities
  const decodeHTML = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  if (isLoading) {
    return (
      <div className="relative min-w-[300px] max-w-[400px] p-4"
           style={{
             background: '#f7f3eb',
             boxShadow: '2px 3px 10px rgba(0,0,0,0.2)',
             clipPath: 'polygon(0% 0%, 98% 1%, 100% 98%, 1% 100%)',
           }}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="relative min-w-[300px] max-w-[400px] p-4"
           style={{
             background: '#f7f3eb',
             boxShadow: '2px 3px 10px rgba(0,0,0,0.2)',
             clipPath: 'polygon(0% 0%, 98% 1%, 100% 98%, 1% 100%)',
           }}>
        <p className="text-sm text-gray-700">Error fetching Wiktionary data</p>
      </div>
    );
  }

  return (
    <div className="relative min-w-[300px] max-w-[400px]">
      {/* Paper texture and torn effect container */}
      <div className="relative p-5"
           style={{
             background: '#f7f3eb',
             boxShadow: '2px 3px 10px rgba(0,0,0,0.2)',
             clipPath: 'polygon(0% 0%, 98% 1%, 100% 98%, 1% 100%)',
             backgroundImage: `
               linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px),
               linear-gradient(0deg, rgba(0,0,0,0.02) 1px, transparent 1px),
               radial-gradient(circle at 50% 50%, transparent 98%, rgba(0,0,0,0.05) 100%)
             `,
             backgroundSize: '8px 8px, 8px 8px, 100% 100%'
           }}>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header with word and pronunciation */}
          <div className="flex justify-between items-baseline mb-3 border-b border-gray-300">
            <h3 className="text-xl font-serif text-gray-800" 
                style={{ 
                  fontFamily: 'Garamond, serif',
                  letterSpacing: '0.02em'
                }}>
              {decodeHTML(info.word)}
            </h3>
            {info.pronunciation && (
              <span className="text-sm font-mono text-gray-600 italic">/{decodeHTML(info.pronunciation)}/</span>
            )}
          </div>
          
          {/* Etymology section */}
          {info.etymology && (
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-1"
                 style={{ fontFamily: 'Garamond, serif' }}>
                Etymology
              </p>
              <p className="text-sm text-gray-700 italic pl-3 border-l-2 border-gray-200">
                {decodeHTML(info.etymology)}
              </p>
            </div>
          )}

          {/* Definitions section */}
          {info.definitions.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-2"
                 style={{ fontFamily: 'Garamond, serif' }}>
                Definitions
              </p>
              <ol className="list-decimal list-outside pl-5 space-y-2">
                {info.definitions.map((def, index) => (
                  <li key={index} className="text-sm text-gray-700 leading-snug"
                      style={{ fontFamily: 'Garamond, serif' }}>
                    {decodeHTML(def)}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Wiktionary link */}
          <a 
            href={info.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-700 mt-3 block transition-colors duration-200 italic"
            style={{ fontFamily: 'Garamond, serif' }}
          >
            — See full entry in Wiktionary
          </a>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Page number effect */}
          <div className="absolute bottom-2 right-2 text-gray-400 opacity-50"
               style={{ fontFamily: 'Garamond, serif' }}>
            {Math.floor(Math.random() * 900 + 100)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display phrase detection information (highlighter strip effect)
 */
function PhraseDetectionDisplay({ info, isLoading }: { info?: PhraseDetectionInfo, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="relative min-w-[250px] max-w-[350px]">
        {/* Highlighter strip background */}
        <div className="relative px-4 py-3 rounded-sm"
             style={{
               background: 'linear-gradient(135deg, rgba(255,235,59,0.85) 0%, rgba(255,241,118,0.85) 50%, rgba(255,235,59,0.85) 100%)',
               boxShadow: `
                 0 2px 8px rgba(255,193,7,0.3),
                 inset 0 1px 0 rgba(255,255,255,0.2),
                 inset 0 -1px 0 rgba(255,193,7,0.2)
               `,
               transform: 'rotate(-0.5deg)',
               border: '1px solid rgba(255,193,7,0.3)',
             }}>
          
          {/* Highlighter texture overlay */}
          <div className="absolute inset-0 opacity-20"
               style={{
                 background: `
                   repeating-linear-gradient(
                     45deg,
                     transparent 0px,
                     transparent 2px,
                     rgba(255,193,7,0.1) 2px,
                     rgba(255,193,7,0.1) 4px
                   )
                 `,
               }}>
          </div>
          
          <div className="relative z-10">
            <div className="animate-pulse space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 opacity-60 rounded"></div>
                <div className="h-3 bg-yellow-600 opacity-60 rounded w-1/3"></div>
              </div>
              <div className="h-3 bg-yellow-600 opacity-60 rounded w-2/3"></div>
            </div>
          </div>
          
          {/* Highlighter cap effect */}
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-yellow-400 rounded-r-full opacity-70"></div>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="relative min-w-[250px] max-w-[350px]">
        {/* Highlighter strip background */}
        <div className="relative px-4 py-3 rounded-sm"
             style={{
               background: 'linear-gradient(135deg, rgba(255,87,87,0.85) 0%, rgba(255,118,118,0.85) 50%, rgba(255,87,87,0.85) 100%)',
               boxShadow: `
                 0 2px 8px rgba(244,67,54,0.3),
                 inset 0 1px 0 rgba(255,255,255,0.2),
                 inset 0 -1px 0 rgba(244,67,54,0.2)
               `,
               transform: 'rotate(0.5deg)',
               border: '1px solid rgba(244,67,54,0.3)',
             }}>
          
          <div className="relative z-10">
            <p className="text-sm text-red-800 font-medium">
              Error analyzing phrases
            </p>
          </div>
          
          {/* Highlighter cap effect */}
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-red-400 rounded-r-full opacity-70"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-[250px] max-w-[350px]">
      {/* Highlighter strip background */}
      <div className="relative px-4 py-3 rounded-sm"
           style={{
             background: 'linear-gradient(135deg, rgba(129,199,132,0.85) 0%, rgba(165,214,167,0.85) 50%, rgba(129,199,132,0.85) 100%)',
             boxShadow: `
               0 2px 8px rgba(76,175,80,0.3),
               inset 0 1px 0 rgba(255,255,255,0.2),
               inset 0 -1px 0 rgba(76,175,80,0.2)
             `,
             transform: 'rotate(-0.8deg)',
             border: '1px solid rgba(76,175,80,0.3)',
           }}>
        
        {/* Highlighter texture overlay */}
        <div className="absolute inset-0 opacity-15"
             style={{
               background: `
                 repeating-linear-gradient(
                   45deg,
                   transparent 0px,
                   transparent 2px,
                   rgba(76,175,80,0.1) 2px,
                   rgba(76,175,80,0.1) 4px
                 )
               `,
             }}>
        </div>
        
        {/* Ink bleed effect at edges */}
        <div className="absolute inset-0 opacity-10"
             style={{
               background: `
                 radial-gradient(ellipse at left, rgba(76,175,80,0.4) 0%, transparent 70%),
                 radial-gradient(ellipse at right, rgba(76,175,80,0.4) 0%, transparent 70%)
               `,
             }}>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            {/* Highlighter icon */}
            <div className="flex items-center">
              <div className="w-1 h-4 bg-green-600 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-r-full ml-0.5"></div>
            </div>
            <p className="text-xs font-medium text-green-800 uppercase tracking-wider">
              Detected Phrases
            </p>
          </div>
          
          <div className="space-y-1">
            {info.phrases.length > 0 ? (
              info.phrases.map((phrase, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                  <p className="text-sm text-green-800 font-medium leading-tight">
                    "{phrase}"
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-green-700 italic">
                No phrases detected
              </p>
            )}
          </div>
          
          {/* Original word reference */}
          <div className="mt-2 pt-2 border-t border-green-300 border-opacity-50">
            <p className="text-xs text-green-700 opacity-80">
              in context of: <span className="font-medium">"{info.originalWord}"</span>
            </p>
          </div>
        </div>
        
        {/* Highlighter cap effect */}
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-green-400 rounded-r-full opacity-70"
             style={{
               boxShadow: 'inset 1px 0 2px rgba(76,175,80,0.3)'
             }}>
        </div>
      </div>
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
  isLoading,
  isClickable,
  onTokenClick
}: VocabTokenProps) {
  return (
    <span
      className={`${className} ${isClickable ? 'cursor-pointer' : ''}`}
      data-lemma={spacyToken.lemma}
      data-pos={spacyToken.pos}
      onClick={onTokenClick}
    >
      {originalText}
      {isCurrentWord && showInformation && tokenInfo && tokenInfo.displayType && (
        <div
          className="absolute z-50"
          style={{
            top: (tokenInfo.displayType === 'sentenceTranslation' ? '-140px' : '-40px'),
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          {tokenInfo.displayType === 'wordTranslation' && (
            <WordTranslationDisplay info={tokenInfo.wordTranslation} isLoading={isLoading} />
          )}
          {tokenInfo.displayType === 'sentenceTranslation' && (
            <SentenceTranslationDisplay info={tokenInfo.sentenceTranslation} isLoading={isLoading} />
          )}
          {tokenInfo.displayType === 'wiktionary' && (
            <WiktionaryDisplay info={tokenInfo.wiktionary} isLoading={isLoading} />
          )}
          {tokenInfo.displayType === 'phraseDetection' && (
            <PhraseDetectionDisplay info={tokenInfo.phraseDetection} isLoading={isLoading} />
          )}
        </div>
      )}
    </span>
  );
} 