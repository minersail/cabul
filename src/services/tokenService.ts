export interface TranslationResponse {
  result: string;
  error?: string;
}

export interface WiktionaryResponse {
  word: string;
  etymology: string | null;
  pronunciation: string | null;
  definitions: string[];
  url: string;
  error?: string;
}

interface TranslationRequest {
  text: string;
  context?: string;
}

async function translate(request: TranslationRequest): Promise<TranslationResponse> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: request.text,
      mode: 'toEnglish',
      api: 'deepl',
      ...(request.context && { context: request.context })
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Translation failed');
  }

  return data;
}

export async function translateWord(
  word: string,
  context: string
): Promise<TranslationResponse> {
  try {
    // Extract context by truncating sentence up to the word
    const wordIndex = context.toLowerCase().indexOf(word.toLowerCase());
    const truncatedContext = wordIndex !== -1 
      ? context.substring(0, wordIndex).trim()
      : context;
    
    // Make parallel translation calls
    const [fullContextResult, truncatedContextResult] = await Promise.all([
      translate({ text: word, context }),
      translate({ text: word, context: truncatedContext || undefined })
    ]);
    
    const fullTranslation = fullContextResult.result.trim();
    const truncatedTranslation = truncatedContextResult.result.trim();
    
    // Helper function to check if a string is empty or just punctuation
    const isEmptyOrPunctuation = (str: string): boolean => {
      return !str || /^[^\w\s]*$/.test(str);
    };
    
    // Helper function to check if translation is untranslated (same as original word)
    const isUntranslated = (translation: string, originalWord: string): boolean => {
      return translation.toLowerCase() === originalWord.toLowerCase();
    };
    
    // Apply logic based on translation results
    let finalResult: string;
    
    // 1) If translations are the same, return just one
    if (fullTranslation.toLowerCase() === truncatedTranslation.toLowerCase()) {
      finalResult = fullTranslation;
    }
    // 2) If one is empty/punctuation, return the other
    else if (isEmptyOrPunctuation(fullTranslation) && !isEmptyOrPunctuation(truncatedTranslation)) {
      finalResult = truncatedTranslation;
    }
    else if (isEmptyOrPunctuation(truncatedTranslation) && !isEmptyOrPunctuation(fullTranslation)) {
      finalResult = fullTranslation;
    }
    // 3) If one is untranslated, return the other
    else if (isUntranslated(fullTranslation, word) && !isUntranslated(truncatedTranslation, word)) {
      finalResult = truncatedTranslation;
    }
    else if (isUntranslated(truncatedTranslation, word) && !isUntranslated(fullTranslation, word)) {
      finalResult = fullTranslation;
    }
    // 4) If different and don't fall under above criteria, return both with slash
    else {
      finalResult = `${fullTranslation} / ${truncatedTranslation}`;
    }
    
    return {
      result: finalResult.toLowerCase(),
      error: fullContextResult.error || truncatedContextResult.error
    };
  } catch (error) {
    console.error('Word translation error:', error);
    return {
      result: 'Error analyzing word'
    };
  }
}

export async function translateSentence(
  sentence: string
): Promise<TranslationResponse> {
  try {
    return await translate({ text: sentence });
  } catch (error) {
    console.error('Sentence translation error:', error);
    return {
      result: 'Error translating sentence'
    };
  }
}

export async function lookupWiktionary(
  word: string
): Promise<WiktionaryResponse> {
  try {
    const response = await fetch('/api/wiktionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch Wiktionary data');
    }
    
    return data;
  } catch (error) {
    console.error('Wiktionary error:', error);
    return {
      word,
      etymology: null,
      pronunciation: null,
      definitions: ['Failed to load Wiktionary data'],
      url: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`
    };
  }
} 