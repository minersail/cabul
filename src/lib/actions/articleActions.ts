'use server'

import { prisma } from '@/lib/prisma';
import { validateAuthOnly } from '@/lib/validateAuth';

/**
 * Server Actions for article management
 * These replace the API routes and provide direct client→server communication
 */

export interface ArticleData {
  id: number;
  title: string;
  text: string;
  source: string;
  url: string;
  author: string | null;
  createdAt: Date;
  metadata: any;
}

export interface CreateArticleData {
  title: string;
  text: string;
  source: string;
  url: string;
  author?: string;
  metadata?: any;
}

/**
 * Add a new article to the database
 */
export async function addArticle(
  articleData: CreateArticleData
): Promise<{ success: true; data: ArticleData } | { success: false; error: string }> {
  // Validate authentication
  const authResult = await validateAuthOnly();
  if (!authResult.success) {
    return authResult;
  }

  try {
    // Check if article already exists by URL to avoid duplicates
    const existingArticle = await prisma.article.findFirst({
      where: { url: articleData.url }
    });

    if (existingArticle) {
      // Return the existing article instead of creating a duplicate
      const result: ArticleData = {
        id: existingArticle.id,
        title: existingArticle.title,
        text: existingArticle.text,
        source: existingArticle.source,
        url: existingArticle.url,
        author: existingArticle.author,
        createdAt: existingArticle.createdAt,
        metadata: existingArticle.metadata
      };
      return { success: true, data: result };
    }

    // Create new article
    const newArticle = await prisma.article.create({
      data: {
        title: articleData.title,
        text: articleData.text,
        source: articleData.source,
        url: articleData.url,
        author: articleData.author || null,
        metadata: articleData.metadata || null
      }
    });

    const result: ArticleData = {
      id: newArticle.id,
      title: newArticle.title,
      text: newArticle.text,
      source: newArticle.source,
      url: newArticle.url,
      author: newArticle.author,
      createdAt: newArticle.createdAt,
      metadata: newArticle.metadata
    };

    return { success: true, data: result };
  } catch (error) {
    console.error('Error adding article:', error);
    return { success: false, error: `Failed to add article "${articleData.title}"` };
  }
}

/**
 * Get all articles of a specific type/source
 */
export async function getArticlesBySource(
  source: string,
  limit?: number,
  offset?: number
): Promise<{ success: true; data: ArticleData[] } | { success: false; error: string }> {
  try {
    const articles = await prisma.article.findMany({
      where: {
        source: source
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const result: ArticleData[] = articles.map(article => ({
      id: article.id,
      title: article.title,
      text: article.text,
      source: article.source,
      url: article.url,
      author: article.author,
      createdAt: article.createdAt,
      metadata: article.metadata
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching articles by source:', error);
    return { success: false, error: `Failed to fetch articles from source "${source}"` };
  }
}

/**
 * Get all articles (optionally paginated)
 */
export async function getAllArticles(
  limit?: number,
  offset?: number
): Promise<{ success: true; data: ArticleData[] } | { success: false; error: string }> {
  try {
    const articles = await prisma.article.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const result: ArticleData[] = articles.map(article => ({
      id: article.id,
      title: article.title,
      text: article.text,
      source: article.source,
      url: article.url,
      author: article.author,
      createdAt: article.createdAt,
      metadata: article.metadata
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching all articles:', error);
    return { success: false, error: 'Failed to fetch articles' };
  }
}

/**
 * Get a single article by ID
 */
export async function getArticleById(
  id: number
): Promise<{ success: true; data: ArticleData } | { success: false; error: string }> {
  try {
    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return { success: false, error: `Article with ID ${id} not found` };
    }

    const result: ArticleData = {
      id: article.id,
      title: article.title,
      text: article.text,
      source: article.source,
      url: article.url,
      author: article.author,
      createdAt: article.createdAt,
      metadata: article.metadata
    };

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    return { success: false, error: `Failed to fetch article with ID ${id}` };
  }
}

/**
 * Delete an article by ID
 */
export async function deleteArticle(
  id: number
): Promise<{ success: true; data: number } | { success: false; error: string }> {
  // Validate authentication
  const authResult = await validateAuthOnly();
  if (!authResult.success) {
    return authResult;
  }

  try {
    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    });

    if (!existingArticle) {
      return { success: false, error: `Article with ID ${id} not found` };
    }

    // Delete the article (cascade will handle related sessions)
    await prisma.article.delete({
      where: { id }
    });

    return { success: true, data: id };
  } catch (error) {
    console.error('Error deleting article:', error);
    return { success: false, error: `Failed to delete article with ID ${id}` };
  }
} 