import { SpaCyTokenizationResponse } from "@/types/tokenization";
import { RedditPost, LeMondeArticle, Article, articleToCreateData } from "@/types/articles";
import { addArticle } from "@/lib/actions/articleActions";
import { Dispatch } from "react";
import { ArticleLoaderAction } from "@/reducers/articleLoaderReducer";
export interface ErrorMessage {
  error: string;
}

export interface TokenizationResponse extends SpaCyTokenizationResponse {
  error?: string;
}

export async function tokenizeText(text: string): Promise<TokenizationResponse> {
  try {
    const response = await fetch('/api/tokenize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        parameters: {
          mode: 'full',
          include_entities: true,
          include_pos: true,
          include_lemmas: true,
          include_dependencies: true
        }
      }),
    });
    
    const data = (await response.json())[0];
    console.log("Tokenization result:", data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to tokenize content (server response not OK)');
    }
    
    // Even if response.ok, the Hugging Face API might return an error structure
    // or a success structure that doesn't contain tokens (e.g. model loading message)
    if (!data.tokens || !Array.isArray(data.tokens)) {
      console.error("Tokenization successful but tokens are missing or not an array:", data);
      throw new Error(data.error || 'Tokenization API returned unexpected payload.');
    }
    
    return data;
  } catch (error) {
    console.error('Tokenization error:', error);
    return {
      text: text,
      language: 'unknown',
      tokens: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getRedditPosts(): Promise<RedditPost[] | ErrorMessage> {
  try {
    const response = await fetch('/api/scrape/reddit', {
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Reddit posts: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch Reddit posts');
    }

    // Transform the posts to include the type discriminator
    return data.posts.map((post: any) => ({
      type: 'reddit' as const,
      title: post.title,
      content: post.content,
      url: post.url,
      score: post.score,
      author: post.author
    }));

  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getRandomLeMondeArticle(): Promise<LeMondeArticle | ErrorMessage> {
  try {
    const response = await fetch('/api/scrape/lemonde', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'getRandomArticle'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch random Le Monde article: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch random Le Monde article');
    }

    return {
      type: 'lemonde' as const,
      title: data.title,
      content: data.content,
      url: data.url,
      description: data.description,
      author: data.author,
      publishDate: data.publishDate,
      wordCount: data.wordCount
    };

  } catch (error) {
    console.error('Error fetching random Le Monde article:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Type guard to check if a response is an error message
export function isErrorMessage(response: any): response is ErrorMessage {
  return response && typeof response === 'object' && 'error' in response && typeof response.error === 'string';
} 

export async function saveCurrentArticle(currentArticle: Article, dispatch: Dispatch<ArticleLoaderAction>) {
  if (!currentArticle) {
    console.warn('No current article to save');
    return;
  }

  dispatch({ type: 'START_SAVING_ARTICLE' });

  try {
    const createData = articleToCreateData(currentArticle);
    const result = await addArticle(createData);

    if (result.success) {
      dispatch({ 
        type: 'ARTICLE_SAVED', 
        payload: { message: `Article saved.` }
      });
      
      // Clear the save message after 3 seconds
      setTimeout(() => {
        dispatch({ 
          type: 'ARTICLE_SAVED', 
          payload: { message: "" }
        });
      }, 3000);
    } else {
      dispatch({ 
        type: 'SAVE_ARTICLE_ERROR', 
        payload: { error: result.error }
      });
    }
  } catch (error) {
    console.error('Error saving article:', error);
    dispatch({ 
      type: 'SAVE_ARTICLE_ERROR', 
      payload: { error: 'Failed to save article to database' }
    });
  }
};