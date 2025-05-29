import { InformationDisplayType, TokenInformation } from "@/components/VocabToken";
import { WiktionaryResponse } from "@/utils/fetchApi";

export interface UIState {
  flashState: 'none' | 'green' | 'red';
  showInformation: boolean;
  isLoading: boolean;
}

export interface CanvasState {
  currentWordIndex: number;
  furthestWordIndex: number;
  result: TokenInformation | null;
  uiState: UIState;
}

export type CanvasAction =
  | { type: 'ADVANCE'; payload: { wordCount: number } }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'NAVIGATE_TO_INDEX'; payload: { index: number } }
  | { type: 'TRANSLATE_WORD'; payload: { translation: string } }
  | { type: 'TRANSLATE_SENTENCE'; payload: { sentenceContext: string; translation: string } }
  | { type: 'LOOKUP_WIKTIONARY'; payload: { response: WiktionaryResponse } }
  | { type: 'DETECT_PHRASES'; payload: { originalWord: string; phrases: string[] } }
  | { type: 'LOAD_INFO'; payload: { displayType: InformationDisplayType } }
  | { type: 'SET_FLASH_STATE'; payload: 'none' | 'green' | 'red' }

export const initialState: CanvasState = {
  currentWordIndex: 0,
  furthestWordIndex: 0,
  result: null,
  uiState: {
    flashState: 'none',
    showInformation: false,
    isLoading: false
  }
};

const finishUILoad = (uiState: UIState): UIState => ({
  ...uiState,
  showInformation: true,
  isLoading: false
});

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'ADVANCE':
      const newCurrentIndex = state.currentWordIndex < action.payload.wordCount - 1 
        ? state.currentWordIndex + 1 
        : state.currentWordIndex;
      
      return {
        ...state,
        currentWordIndex: newCurrentIndex,
        furthestWordIndex: Math.max(state.furthestWordIndex, newCurrentIndex),
        result: null,
        uiState: {
          ...state.uiState,
          flashState: 'none',
          showInformation: false
        }
      };

    case 'NAVIGATE_BACK':
      return {
        ...state,
        currentWordIndex: Math.max(0, state.currentWordIndex - 1),
        result: null,
        uiState: {
          ...state.uiState,
          flashState: 'none',
          showInformation: false
        }
      };

    case 'NAVIGATE_TO_INDEX':
      return {
        ...state,
        currentWordIndex: action.payload.index,
        result: null,
        uiState: {
          ...state.uiState,
          flashState: 'none',
          showInformation: false
        }
      };

    case 'TRANSLATE_WORD':
      return {
        ...state,
        result: {
          ...state.result,
          wordTranslation: {
            translation: action.payload.translation
          }
        },
        uiState: finishUILoad(state.uiState)
      }

    case 'TRANSLATE_SENTENCE':
      return {
        ...state,
        result: {
          ...state.result,
          sentenceTranslation: {
            fullSentence: action.payload.sentenceContext,
            translation: action.payload.translation
          }
        },
        uiState: finishUILoad(state.uiState)
      };

    case 'LOOKUP_WIKTIONARY':
      return {
        ...state,
        result: {
          ...state.result,
          wiktionary: action.payload.response
        },
        uiState: finishUILoad(state.uiState)
      };

    case 'DETECT_PHRASES':
      return {
        ...state,
        result: {
          ...state.result,
          phraseDetection: {
            originalWord: action.payload.originalWord,
            phrases: action.payload.phrases,
          }
        },
        uiState: finishUILoad(state.uiState)
      };

    case 'LOAD_INFO':
      return {
        ...state,
        result: {
          displayType: action.payload.displayType,
        },
        uiState: {
          ...state.uiState,
          isLoading: true,
          showInformation: true
        }
      };

    case 'SET_FLASH_STATE':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          flashState: action.payload
        }
      };

    default:
      return state;
  }
} 