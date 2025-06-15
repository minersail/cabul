import { RedditPost, LeMondeArticle, ScriptSlugScene, Article } from "@/types/articles";
import { TokenizationResponse } from "@/services/loaderService";

export type ArticleSource = 'reddit' | 'lemonde' | 'scriptslug';

export interface Message {
  message: string;
  error: boolean;
}

export interface UIState {
  isLoading: boolean;
  isTokenizing: boolean;
  isSaving: boolean;
  loadMessage: Message;
  tokenMessage: Message;
  saveMessage: Message;
}

export interface ArticleCache<Article> {
  articles: Article[];
  currentIndex: number;
  hasLoadedFromDatabase: boolean;
}

export interface ArticleLoaderState {
  isLearningMode: boolean;
  tokenizationResult: TokenizationResponse | null;
  uiState: UIState;
  articles: {
    redditCache: ArticleCache<RedditPost>;
    leMondeCache: ArticleCache<LeMondeArticle>;
    scriptSlugCache: ArticleCache<ScriptSlugScene>;
  };
}

export type ArticleLoaderAction =
  | { type: 'START_LOADING' }
  | { type: 'API_LOADED'; payload: { source: ArticleSource, articles: Article[] } }
  | { type: 'DATABASE_LOADED'; payload: { articles: RedditPost[] | LeMondeArticle[] | ScriptSlugScene[]; source: ArticleSource } }
  | { type: 'LOAD_ERROR'; payload: { error: string } }
  | { type: 'START_TOKENIZING' }
  | { type: 'TOKENIZED'; payload: { result: TokenizationResponse } }
  | { type: 'TOKENIZE_ERROR'; payload: { error: string } }
  | { type: 'START_SAVING_ARTICLE' }
  | { type: 'ARTICLE_SAVED'; payload: { message: string; articleId?: number; source?: ArticleSource } }
  | { type: 'SAVE_ARTICLE_ERROR'; payload: { error: string } }
  | { type: 'NEXT_POST'; payload: { articleSource: ArticleSource } }
  | { type: 'SET_LEARNING_MODE'; payload: { isLearningMode: boolean } }

export const initialState: ArticleLoaderState = {
  isLearningMode: false,
  tokenizationResult: null,
  uiState: {
    isLoading: false,
    isTokenizing: false,
    isSaving: false,
    loadMessage: { message: "Page uninitialized", error: false },
    tokenMessage: { message: "Page uninitialized", error: false },
    saveMessage: { message: "", error: false }
  },
  articles: {
    redditCache: { articles: [], currentIndex: 0, hasLoadedFromDatabase: false },
    leMondeCache: { articles: [], currentIndex: 0, hasLoadedFromDatabase: false },
    scriptSlugCache: { articles: [], currentIndex: 0, hasLoadedFromDatabase: false },
  }
};

export function articleLoaderReducer(
  state: ArticleLoaderState, 
  action: ArticleLoaderAction
): ArticleLoaderState {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isLoading: true,
          loadMessage: { message: "Loading articles...", error: false }
        }
      };

    case 'API_LOADED':
      {
        const [currentCache, cacheKey] = getCache(state, action.payload.source);
        
        return {
          ...state,
          articles: {
            ...state.articles,
            [cacheKey]: {
              ...currentCache,
              articles: [...action.payload.articles, ...currentCache.articles]
            }
          },
          uiState: {
            ...state.uiState,
            isLoading: false,
            loadMessage: { message: "", error: false }
          }
        };
      }

    case 'DATABASE_LOADED':
      if (action.payload.source === 'reddit') {
        return {
          ...state,
          articles: {
            ...state.articles,
            redditCache: {
              articles: action.payload.articles as RedditPost[],
              currentIndex: state.articles.redditCache.currentIndex,
              hasLoadedFromDatabase: true
            }
          },
          uiState: {
            ...state.uiState,
            loadMessage: { message: "", error: false }
          }
        };
      } else if (action.payload.source === 'lemonde') {
        return {
          ...state,
          articles: {
            ...state.articles,
            leMondeCache: {
              articles: action.payload.articles as LeMondeArticle[],
              currentIndex: state.articles.leMondeCache.currentIndex,
              hasLoadedFromDatabase: true
            }
          },
          uiState: {
            ...state.uiState,
            isLoading: false,
            loadMessage: { message: "", error: false }
          }
        };
      } else if (action.payload.source === 'scriptslug') {
        return {
          ...state,
          articles: {
            ...state.articles,
            scriptSlugCache: {
              articles: action.payload.articles as ScriptSlugScene[],
              currentIndex: state.articles.scriptSlugCache.currentIndex,
              hasLoadedFromDatabase: true
            }
          },
          uiState: {
            ...state.uiState,
            isLoading: false,
            loadMessage: { message: "", error: false }
          }
        };
      }

      return state;

    case 'LOAD_ERROR':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isLoading: false,
          loadMessage: { message: action.payload.error, error: true }
        }
      };

    case 'START_TOKENIZING':
      return {
        ...state,
        tokenizationResult: null,
        uiState: {
          ...state.uiState,
          isTokenizing: true,
          tokenMessage: { message: "Tokenizing article...", error: false }
        }
      };

    case 'TOKENIZED':
      return {
        ...state,
        tokenizationResult: action.payload.result,
        uiState: {
          ...state.uiState,
          isTokenizing: false,
          tokenMessage: { message: "", error: false }
        }
      };

    case 'TOKENIZE_ERROR':
      return {
        ...state,
        tokenizationResult: null,
        uiState: {
          ...state.uiState,
          isTokenizing: false,
          tokenMessage: { message: action.payload.error, error: true }
        }
      };

    case 'START_SAVING_ARTICLE':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isSaving: true,
          saveMessage: { message: "Saving article...", error: false }
        }
      };

    case 'ARTICLE_SAVED':
      let updatedState = {
        ...state,
        uiState: {
          ...state.uiState,
          isSaving: false,
          saveMessage: { message: action.payload.message, error: false }
        }
      };

      // If articleId and source are provided, update the current article's ID
      if (action.payload.articleId && action.payload.source) {
        const [currentCache, cacheKey] = getCache(state, action.payload.source);
        
        updatedState = {
          ...updatedState,
          articles: {
            ...updatedState.articles,
            [cacheKey]: {
              ...currentCache,
              articles: currentCache.articles.map((article, index) =>
                index === currentCache.currentIndex 
                  ? { ...article, articleId: action.payload.articleId }
                  : article
              )
            }
          }
        };
      }

      return updatedState;

    case 'SAVE_ARTICLE_ERROR':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isSaving: false,
          saveMessage: { message: action.payload.error, error: true }
        }
      };

    case 'NEXT_POST':
      const articleSource = action.payload.articleSource;
      const [currentCache, cacheKey] = getCache(state, articleSource);

      if (currentCache.articles.length === 1) {
        return state;
      }

      const newIndex = (currentCache.currentIndex + 1) % currentCache.articles.length;

      return {
        ...state,
        articles: {
          ...state.articles,
          [cacheKey]: {
            ...currentCache,
            currentIndex: newIndex
          }
        },
        tokenizationResult: null,
        uiState: {
          ...state.uiState,
          loadMessage: { message: "", error: false }
        }
      };

    case 'SET_LEARNING_MODE':
      return {
        ...state,
        isLearningMode: action.payload.isLearningMode
      };

    default:
      return state;
  }
}

function getCache(state: ArticleLoaderState, source: ArticleSource): [ArticleCache<Article>, string] {
  if (source === 'reddit') {
    return [state.articles.redditCache, 'redditCache'];
  } else if (source === 'lemonde') {
    return [state.articles.leMondeCache, 'leMondeCache'];
  } else {
    return [state.articles.scriptSlugCache, 'scriptSlugCache'];
  }
}
