interface BaseArticle {
  title: string;
  content: string;
  url: string;
  author: string;
}

export interface RedditPost extends BaseArticle {
  type: 'reddit';
  score: number;
}

export interface LeMondeArticle extends BaseArticle {
  type: 'lemonde';
  description: string;
  publishDate: string;
  wordCount: number;
}

// Unified article type - automatically stays in sync!
export type Article = RedditPost | LeMondeArticle;

// Import the database types
import type { ArticleData, CreateArticleData } from '@/lib/actions/articleActions';

// Conversion functions for database integration

/**
 * Convert a RedditPost to database format for saving
 */
export function redditPostToCreateData(post: RedditPost): CreateArticleData {
  return {
    title: post.title,
    text: post.content,
    source: 'reddit',
    url: post.url,
    author: post.author,
    metadata: {
      score: post.score,
      type: 'reddit'
    }
  };
}

/**
 * Convert a LeMondeArticle to database format for saving
 */
export function leMondeArticleToCreateData(article: LeMondeArticle): CreateArticleData {
  return {
    title: article.title,
    text: article.content,
    source: 'lemonde',
    url: article.url,
    author: article.author,
    metadata: {
      description: article.description,
      publishDate: article.publishDate,
      wordCount: article.wordCount
    }
  };
}

/**
 * Convert database ArticleData back to typed article format
 */
export function articleDataToTypedArticle(dbArticle: ArticleData): Article {
  const baseFields = {
    title: dbArticle.title,
    content: dbArticle.text,
    url: dbArticle.url,
    author: dbArticle.author || 'Unknown'
  };

  if (dbArticle.source === 'reddit') {
    return {
      ...baseFields,
      type: 'reddit' as const,
      score: dbArticle.metadata?.score || 0
    };
  } else if (dbArticle.source === 'lemonde') {
    return {
      ...baseFields,
      type: 'lemonde' as const,
      description: dbArticle.metadata?.description || '',
      publishDate: dbArticle.metadata?.publishDate || '',
      wordCount: dbArticle.metadata?.wordCount || 0
    };
  }

  // Fallback to reddit type if source is unrecognized
  return {
    ...baseFields,
    type: 'reddit' as const,
    score: 0
  };
}

/**
 * Convert any article to database format for saving
 */
export function articleToCreateData(article: Article): CreateArticleData {
  if (article.type === 'reddit') {
    return redditPostToCreateData(article);
  } else {
    return leMondeArticleToCreateData(article);
  }
} 