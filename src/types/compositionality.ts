export interface WordContribution {
  word: string;
  similarity_to_phrase: number;
}

export interface CompositionAnalysisResponse {
  phrase: string;
  words: string[];
  word_count: number;
  compositionality_score: number | null;
  interpretation: string;
  word_contributions: WordContribution[];
  embedding_dimensions: number;
}

export interface BatchAnalysisResponse {
  results: CompositionAnalysisResponse[];
}

export interface ErrorResponse {
  error: string;
} 