import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArticleSource, ArticleCache, ArticleLoaderState } from '@/reducers/articleLoaderReducer';
import { Article, articleDataToTypedArticle } from '@/types/articles';
import { getArticlesBySource } from '@/lib/actions/articleActions';
import { getRedditPosts, getRandomLeMondeArticle, getRandomScriptSlugScene } from '@/services/loaderService';
import { ClientUserConfig } from './useUserConfig';

type ArticleLoaderDispatch = React.Dispatch<any>;

interface UseArticleLoaderProps {
  userConfig: ClientUserConfig | null;
  dispatch: ArticleLoaderDispatch;
  state: ArticleLoaderState;
}

interface UseArticleLoaderReturn {
  currentArticle: Article | null;
  loadNewArticle: () => void;
}

// Get current cache based on selected source
function getCurrentCache(state: ArticleLoaderState, articleSource?: ArticleSource): ArticleCache<Article> {
  switch (articleSource) {
    case 'reddit':
      return state.articles.redditCache;
    case 'lemonde':
      return state.articles.leMondeCache;
    case 'scriptslug':
      return state.articles.scriptSlugCache;
    default:
      return state.articles.redditCache;
  }
};

async function callArticleApi(source: ArticleSource): Promise<Article[]>
{
  if (source === 'reddit') {
    return await getRedditPosts();
  } else if (source === 'lemonde') {
    return [await getRandomLeMondeArticle()];
  } else if (source === 'scriptslug') {
    return [await getRandomScriptSlugScene()];
  }

  throw new Error(`Unsupported article source: ${source}`);
}

export function useArticleCache({
  userConfig,
  dispatch,
  state
}: UseArticleLoaderProps): UseArticleLoaderReturn {
  const [shouldCallApi, setShouldCallApi] = useState(false);
  
  const source = userConfig?.articleSource;
  const currentCache = useMemo(() => getCurrentCache(state, source), [source, state]);

  // Load database articles on component mount and source change
  useEffect(() => {
    const loadDatabaseArticles = async () => {      
      // Only load from database if we haven't already and we have a valid source
      if (!currentCache.hasLoadedFromDatabase && source) {
        const result = await getArticlesBySource(source);
        if (result.success) {
          const typedArticles = result.data.map(articleDataToTypedArticle);
          
          dispatch({
            type: 'DATABASE_LOADED',
            payload: {
              articles: typedArticles,
              source: source
            }
          });

          if (result.data.length === 0) {
            setShouldCallApi(true);
          }
        }
        else {
          dispatch({ type: 'LOAD_ERROR', payload: { error: 'Error loading articles from database' } });
          console.error('Error loading database articles:', result.error);
        }
      }
    };

    loadDatabaseArticles();
  }, [source, currentCache.hasLoadedFromDatabase, dispatch]);

  // Load articles from APIs when needed
  useEffect(() => {
    if (shouldCallApi && source) {
      const fetchArticles = async () => {
        dispatch({ type: 'START_LOADING' });

        callArticleApi(source).then(articles => {
          dispatch({ type: 'API_LOADED', payload: { source: source, articles: articles } });
        }).catch(error => {
          dispatch({ type: 'LOAD_ERROR', payload: { error: error.message } });
        }).finally(() => {
          setShouldCallApi(false);
        });
      };
      
      fetchArticles();
    }
  }, [source, shouldCallApi, dispatch, currentCache]);

  const currentArticle = useMemo(() => {
    return currentCache.articles[currentCache.currentIndex] || null;
  }, [currentCache]);

  const loadNewArticle = useCallback(() => {
    setShouldCallApi(true);
  }, []);

  return {
    currentArticle,
    loadNewArticle
  };
} 