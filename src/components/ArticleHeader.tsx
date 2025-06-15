import { Article } from "@/types/articles";
import { ArticleSource } from "@/reducers/articleLoaderReducer";
import { getSourceLabel, getExternalLinkText, getSourceBadgeStyle } from '@/utils/articleSources';

interface ArticleHeaderProps {
  article: Article;
  articleSource: ArticleSource;
  isSaving: boolean;
  saveMessage: { message: string; error: boolean };
  onSave: (article: Article) => void;
}

export default function ArticleHeader({ 
  article, 
  articleSource, 
  isSaving, 
  saveMessage, 
  onSave 
}: ArticleHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-300" style={{ backgroundColor: '#f8f7f2' }}>
      <div className="border-l-4 border-[#2f2f2f] pl-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair-display)', color: '#2f2f2f' }}>
            {article.title}
          </h2>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getSourceBadgeStyle(articleSource)}`}>
              {getSourceLabel(articleSource)}
            </span>
            <button
              onClick={() => onSave(article)}
              disabled={isSaving || !!article.articleId}
              className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              title={
                article.articleId 
                  ? 'Article already saved' 
                  : isSaving 
                    ? 'Saving article...' 
                    : 'Save article to library'
              }
            >
              {isSaving ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : article.articleId ? (
                // Filled bookmark for saved articles
                <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                // Empty bookmark for unsaved articles
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Save message display */}
        {saveMessage.message && (
          <div className={`text-xs mb-2 ${saveMessage.error ? 'text-red-600' : 'text-gray-400'}`}>
            {saveMessage.message}
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-600 space-x-2" style={{ fontFamily: 'var(--font-crimson-text)' }}>
          <span>By {article.author}</span>
          <span>•</span>
          {article.type === 'reddit' && (
            <>
              <span>{article.score} points</span>
              <span>•</span>
            </>
          )}
          {article.type === 'lemonde' && (
            <>
              <span>{article.publishDate}</span>
              <span>•</span>
            </>
          )}
          {article.type === 'scriptslug' && (
            <>
              <span>{article.sceneHeader}</span>
              <span>•</span>
              <span>{article.sceneIndex} of {article.totalScenes} scenes</span>
              <span>•</span>
            </>
          )}
          <a 
            href={article.url}
            className="text-blue-600 hover:text-blue-800 flex items-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            {getExternalLinkText(articleSource)}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 