import { MAX_LEMONDE_ARTICLES } from "@/components/ArticleLoader";
import { RedditPost, LeMondeArticle } from "@/types/articles";
import { TokenizationResponse, ErrorMessage } from "@/services/loaderService";

export type ArticleSource = 'reddit' | 'lemonde';

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

export interface ArticleCache<ArticleType> {
  articles: ArticleType[];
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
  };
}

export type ArticleLoaderAction =
  | { type: 'START_LOADING' }
  | { type: 'REDDIT_LOADED'; payload: { posts: RedditPost[] } }
  | { type: 'LEMONDE_LOADED'; payload: { article: LeMondeArticle } }
  | { type: 'DATABASE_ARTICLES_LOADED'; payload: { articles: RedditPost[] | LeMondeArticle[]; source: ArticleSource } }
  | { type: 'LOAD_ERROR'; payload: { error: string } }
  | { type: 'START_TOKENIZING' }
  | { type: 'TOKENIZED'; payload: { result: TokenizationResponse } }
  | { type: 'TOKENIZE_ERROR'; payload: { error: string } }
  | { type: 'START_SAVING_ARTICLE' }
  | { type: 'ARTICLE_SAVED'; payload: { message: string } }
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
  }
};

export function articleLoaderReducer(
  state: ArticleLoaderState, 
  action: ArticleLoaderAction
): ArticleLoaderState {
  console.log(action);
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

    case 'REDDIT_LOADED':
      return {
        ...state,
        articles: {
          ...state.articles,
          redditCache: {
            ...state.articles.redditCache,
            articles: [...action.payload.posts, ...state.articles.redditCache.articles],
          },
        },
        uiState: {
          ...state.uiState,
          isLoading: false,
          loadMessage: { message: "", error: false }
        }
      };

    case 'LEMONDE_LOADED':
      return {
        ...state,
        articles: {
          ...state.articles,
          leMondeCache: {
            ...state.articles.leMondeCache,
            articles: [action.payload.article, ...state.articles.leMondeCache.articles],
          },
        },
        uiState: {
          ...state.uiState,
          isLoading: false,
          loadMessage: { message: "", error: false }
        }
      };

    case 'DATABASE_ARTICLES_LOADED':
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
      } else {
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
      }

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
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isSaving: false,
          saveMessage: { message: action.payload.message, error: false }
        }
      };

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
      const currentCache = articleSource === 'reddit' 
        ? state.articles.redditCache 
        : state.articles.leMondeCache;

      const newIndex = (currentCache.currentIndex + 1) % currentCache.articles.length;

      console.log(newIndex);
      return {
        ...state,
        articles: {
          ...state.articles,
          [articleSource === 'reddit' ? 'redditCache' : 'leMondeCache']: {
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