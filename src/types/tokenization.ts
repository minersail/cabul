export interface SpaCyToken {
  text: string;       // The verbatim text of the token.
  start: number;      // The character offset of the token's first character in the original text.
  end: number;        // The character offset of the token's last character + 1 in the original text.
  is_alpha: boolean;  // Is the token comprised of alphabetic characters?
  is_punct: boolean;  // Is the token punctuation?
  is_space: boolean;  // Is the token whitespace? (Note: spaCy's default tokenizer might not create these; this field is from your example output logic)
  is_stop: boolean;   // Is the token a stop word (e.g., 'the', 'is')?

  // Fields from "full" mode with include_pos = true
  pos?: string;        // Coarse-grained part-of-speech tag (e.g., VERB, NOUN).
  tag?: string;        // Fine-grained part-of-speech tag (e.g., VBP for verb, present tense, non-3rd person singular).
  morph?: string;      // Morphological features (e.g., 'Number=Sing|Person=3').

  // Field from "full" mode with include_lemmas = true
  lemma?: string;      // The base form of the token (e.g., 'running' -> 'run').

  // Fields from "full" mode with include_dependencies = true
  dep?: string;        // Syntactic dependency relation (e.g., nsubj, dobj).
  head?: string;       // The text of the syntactic head of this token.
  head_pos?: string;   // The coarse-grained POS tag of the syntactic head.
  children?: string[]; // The text of the syntactic children of this token.
}

export interface SpaCyEntity {
  text: string;        // The verbatim text of the entity.
  label: string;       // The entity label (e.g., PER, ORG, LOC).
  start: number;       // The character offset of the entity's first character in the original text.
  end: number;         // The character offset of the entity's last character + 1 in the original text.
  description?: string;// A human-readable description of the entity label (from spacy.explain).
}

export interface SpaCySentence {
  text: string;        // The verbatim text of the sentence.
  start: number;       // The character offset of the sentence's first character in the original text.
  end: number;         // The character offset of the sentence's last character + 1 in the original text.
}

export interface SpaCyStats {
  num_tokens: number;     // Total number of tokens in the document.
  num_sentences: number;  // Total number of sentences in the document.
  num_entities?: number;  // Total number of entities (if include_entities was true).
}

export interface SpaCyTokenizationResponse {
  text: string;             // The original text that was processed.
  language: string;         // Language of the processed text (e.g., "fr").
  tokens: SpaCyToken[];     // Array of token objects.
  entities?: SpaCyEntity[]; // Array of entity objects (if include_entities was true).
  sentences?: SpaCySentence[];// Array of sentence objects (if include_sentences was true).
  stats?: SpaCyStats;         // Document-level statistics.
}

// You might have other types here 