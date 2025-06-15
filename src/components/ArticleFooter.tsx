import { ArticleSource } from "@/reducers/articleLoaderReducer";

interface ArticleFooterProps {
  articleSource: ArticleSource;
  isLoading: boolean;
  currentPosition: number;
  totalCount: number;
  onNextArticle: () => void;
  onLoadNewArticle: () => void;
}

export default function ArticleFooter({ 
  articleSource, 
  isLoading, 
  currentPosition,
  totalCount,
  onNextArticle, 
  onLoadNewArticle 
}: ArticleFooterProps) {
  return (
    <div className="border-t-2 border-black" style={{ backgroundColor: '#f8f7f2' }}>
      <div className="mt-4">        
        <div className="flex items-center justify-between">
          {/* Article Position Indicator */}
          <div className="flex-1 pl-2">
            {totalCount > 0 && (
              <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-crimson-text)' }}>
                Article {currentPosition + 1} of {totalCount}
              </span>
            )}
          </div>
          
          {/* Buttons */}
          <div className="flex items-center gap-4">
            <button
            onClick={onNextArticle}
            className="flex items-center px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors duration-200 shadow-sm"
            style={{ fontFamily: 'var(--font-crimson-text)' }}
          >
            Next Article
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {articleSource === 'lemonde' && (
            <button
              onClick={onLoadNewArticle}
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
              style={{ fontFamily: 'var(--font-crimson-text)' }}
            >
              Random Article
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {articleSource === 'scriptslug' && (
            <button
              onClick={onLoadNewArticle}
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
              style={{ fontFamily: 'var(--font-crimson-text)' }}
            >
              Random Scene
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Newspaper Bottom Border */}
      <div className="mt-4 pt-4 border-t border-black text-center">
        <p className="text-xs text-gray-600" style={{ fontFamily: 'var(--font-crimson-text)' }}>
          © 2024 The Vocab Herald • All rights reserved • Printed on recycled pixels
        </p>
      </div>
    </div>
  );
} 