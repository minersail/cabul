import { ArticleSource } from '@/reducers/articleLoaderReducer';

/**
 * Get the display label for an article source
 */
export function getSourceLabel(source: ArticleSource): string {
  switch (source) {
    case 'reddit':
      return 'Reddit';
    case 'lemonde':
      return 'Le Monde';
    case 'scriptslug':
      return 'Movie Script';
    default:
      return 'Unknown';
  }
}

/**
 * Get the appropriate external link text for an article source
 */
export function getExternalLinkText(source: ArticleSource): string {
  switch (source) {
    case 'reddit':
      return 'View on Reddit';
    case 'lemonde':
      return 'View on Le Monde';
    case 'scriptslug':
      return 'View PDF';
    default:
      return 'View External';
  }
}

/**
 * Get the CSS classes for the source badge styling
 */
export function getSourceBadgeStyle(source: ArticleSource): string {
  switch (source) {
    case 'reddit':
      return 'bg-orange-100 text-orange-800';
    case 'lemonde':
      return 'bg-blue-100 text-blue-800';
    case 'scriptslug':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 