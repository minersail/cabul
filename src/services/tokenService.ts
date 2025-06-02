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
    return await translate({ text: word, context });
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