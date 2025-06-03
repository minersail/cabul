import { OpenAI } from 'openai';
import { MOVIE_LOCALIZATION_SYSTEM_PROMPT, buildMovieTranslationPrompt } from './prompts/movieLocalization';

interface MovieTranslationResponse {
  translatedText: string;
  confidence?: number;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Translates movie script scenes using OpenAI for natural, idiomatic French localization
 * @param text The English script scene to translate
 * @param sceneHeader Optional scene header for context (e.g., "INT. HOTEL LOBBY - DAY")
 * @param movieTitle Optional movie title for additional context
 * @returns The translated French text with movie localization styling
 */
export async function translateMovieScene(
  text: string,
  sceneHeader?: string,
  movieTitle?: string
): Promise<MovieTranslationResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Build the user prompt with context
    const userPrompt = buildMovieTranslationPrompt(text, sceneHeader, movieTitle);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using cost-effective but capable model
      messages: [
        {
          role: 'system',
          content: MOVIE_LOCALIZATION_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 2000, // Sufficient for scene content
    });

    const translatedText = response.choices[0]?.message?.content?.trim();
    
    if (!translatedText) {
      throw new Error('OpenAI returned empty translation');
    }

    return {
      translatedText,
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      confidence: response.choices[0]?.finish_reason === 'stop' ? 0.95 : 0.8
    };

  } catch (error) {
    console.error('OpenAI movie translation error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      } else if (error.message.includes('invalid_api_key')) {
        throw new Error('Invalid OpenAI API key. Please check your environment configuration.');
      } else if (error.message.includes('rate_limit')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }
    }
    
    throw new Error(`Movie translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch translate multiple scenes (for future use)
 * @param scenes Array of scene objects to translate
 * @param movieTitle Optional movie title for context
 * @returns Array of translated scenes
 */
export async function translateMovieScenes(
  scenes: Array<{ content: string; header?: string }>,
  movieTitle?: string
): Promise<Array<MovieTranslationResponse & { originalHeader?: string }>> {
  const results = [];
  
  for (const scene of scenes) {
    try {
      const translation = await translateMovieScene(
        scene.content,
        scene.header,
        movieTitle
      );
      
      results.push({
        ...translation,
        originalHeader: scene.header
      });
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Failed to translate scene with header: ${scene.header}`, error);
      // Continue with other scenes even if one fails
      results.push({
        translatedText: `[Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}]`,
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        confidence: 0,
        originalHeader: scene.header
      });
    }
  }
  
  return results;
} 