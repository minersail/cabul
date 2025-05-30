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