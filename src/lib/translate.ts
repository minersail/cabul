interface GoogleTranslationResponse {
  data: {
    translations: {
      translatedText: string;
      detectedSourceLanguage?: string;
    }[];
  };
}

export type TranslationAPI = 'google' | 'deepl';

/**
 * Translates text using Google Cloud Translation API
 * @param text The text to translate
 * @returns The translated text
 */
async function translateGoogle(text: string): Promise<string> {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY is not set in environment variables');
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'fr',
          target: 'en',
          format: 'text'
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data: GoogleTranslationResponse = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Google translation error:', error);
    throw error;
  }
}

/**
 * Translates text using DeepL API
 * @param text The text to translate
 * @param context Optional context to improve translation accuracy
 * @returns The translated text
 */
async function translateDeepL(text: string, context?: string): Promise<string> {
  if (!process.env.DEEPL_API_KEY) {
    throw new Error('DEEPL_API_KEY is not set in environment variables');
  }

  try {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: 'FR',
        target_lang: 'EN',
        context: context,
        model_type: 'prefer_quality_optimized',
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error('DeepL translation error:', error);
    throw error;
  }
}

/**
 * Translates text from French to English using the specified translation API
 * @param text The text to translate
 * @param api The translation API to use (default: 'google')
 * @param context Optional context for DeepL translations
 * @returns The translated text
 */
export async function translateText(
  text: string, 
  api: TranslationAPI,
  context?: string
): Promise<string> {
  switch (api) {
    case 'google':
      return translateGoogle(text);
    case 'deepl':
      return translateDeepL(text, context);
    default:
      throw new Error(`Unsupported translation API: ${api}`);
  }
}
