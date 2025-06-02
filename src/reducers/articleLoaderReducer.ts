import { MAX_LEMONDE_ARTICLES } from "@/components/ArticleLoader";
import { RedditPost, LeMondeArticle } from "@/types/articles";
import { TokenizationResponse, ErrorMessage } from "@/utils/fetchApi";

export type ArticleSource = 'reddit' | 'lemonde';

export interface Message {
  message: string;
  error: boolean;
}

export interface UIState {
  isLoading: boolean;
  isTokenizing: boolean;
  loadMessage: Message;
  tokenMessage: Message;
}

export interface UserConfig {
  articleSource: ArticleSource;
  autoNav: boolean;
}

export interface ArticleCache<ArticleType> {
  articles: ArticleType[];
  currentIndex: number;
}

export interface ArticleLoaderState {
  isLearningMode: boolean;
  tokenizationResult: TokenizationResponse | null;
  uiState: UIState;
  userConfig: UserConfig;
  articles: {
    redditCache: ArticleCache<RedditPost>;
    leMondeCache: ArticleCache<LeMondeArticle>;
  };
}

export type ArticleLoaderAction =
  | { type: 'START_LOADING' }
  | { type: 'REDDIT_LOADED'; payload: { posts: RedditPost[] } }
  | { type: 'LEMONDE_LOADED'; payload: { article: LeMondeArticle } }
  | { type: 'LOAD_ERROR'; payload: { error: string } }
  | { type: 'START_TOKENIZING' }
  | { type: 'TOKENIZED'; payload: { result: TokenizationResponse } }
  | { type: 'TOKENIZE_ERROR'; payload: { error: string } }
  | { type: 'UPDATE_USER_CONFIG'; payload: Partial<UserConfig> }
  | { type: 'NEXT_POST' }
  | { type: 'SET_LEARNING_MODE'; payload: { isLearningMode: boolean } }

export const initialState: ArticleLoaderState = {
  isLearningMode: false,
  tokenizationResult: null,
  uiState: {
    isLoading: false,
    isTokenizing: false,
    loadMessage: { message: "Page uninitialized", error: false },
    tokenMessage: { message: "Page uninitialized", error: false }
  },
  userConfig: {
    articleSource: 'reddit',
    autoNav: false
  },
  articles: {
    redditCache: { articles: [], currentIndex: 0 },
    leMondeCache: { articles: [], currentIndex: 0 },
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
            articles: action.payload.posts,
            currentIndex: state.articles.redditCache.currentIndex
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
            articles: [...state.articles.leMondeCache.articles, action.payload.article],
            currentIndex: state.articles.leMondeCache.currentIndex
          },
        },
        uiState: {
          ...state.uiState,
          isLoading: false,
          loadMessage: { message: "", error: false }
        }
      };

    case 'LOAD_ERROR':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isLoading: true,
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

    case 'UPDATE_USER_CONFIG':
      return {
        ...state,
        userConfig: {
          ...state.userConfig,
          ...action.payload
        }
      };

    case 'NEXT_POST':
      const currentCache = state.userConfig.articleSource === 'reddit' 
        ? state.articles.redditCache 
        : state.articles.leMondeCache;
      
      const maxArticles = state.userConfig.articleSource === 'reddit' 
        ? currentCache.articles.length 
        : MAX_LEMONDE_ARTICLES;

      const newIndex = (Math.min(currentCache.currentIndex, currentCache.articles.length) + 1) % maxArticles;

      console.log(newIndex);
      return {
        ...state,
        articles: {
          ...state.articles,
          [state.userConfig.articleSource === 'reddit' ? 'redditCache' : 'leMondeCache']: {
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