import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, action } = body;

    // Handle different actions
    if (action === 'getArchiveArticles') {
      return await handleGetArchiveArticles(body.archiveDate);
    } else if (action === 'getRandomArticle') {
      return await handleGetRandomArticle();
    } else {
      // Default single article scraping
      if (!url || typeof url !== 'string') {
        return NextResponse.json(
          { error: 'URL is required and must be a string' },
          { status: 400 }
        );
      }

      // Basic URL validation for Le Monde
      if (!url.includes('lemonde.fr')) {
        return NextResponse.json(
          { error: 'URL must be from lemonde.fr domain' },
          { status: 400 }
        );
      }

      console.log('Fetching article from:', url);

      // Fetch the HTML content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch article: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const html = await response.text();

      // Basic HTML parsing to extract article content
      const articleData = parseLeMondeArticle(html, url);

      return NextResponse.json({
        success: true,
        url,
        ...articleData,
        rawHtmlLength: html.length
      });
    }

  } catch (error) {
    console.error('Scraping API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during scraping' },
      { status: 500 }
    );
  }
}

async function handleGetArchiveArticles(archiveDate: string) {
  try {
    if (!archiveDate || typeof archiveDate !== 'string') {
      return NextResponse.json(
        { error: 'archiveDate is required and must be a string in format DD-MM-YYYY' },
        { status: 400 }
      );
    }

    // Validate date format (DD-MM-YYYY)
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(archiveDate)) {
      return NextResponse.json(
        { error: 'archiveDate must be in format DD-MM-YYYY' },
        { status: 400 }
      );
    }

    const archiveUrl = `https://www.lemonde.fr/archives-du-monde/${archiveDate}/`;
    console.log('Fetching archive from:', archiveUrl);

    const response = await fetch(archiveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch archive: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const articles = parseArchiveArticles(html);

    return NextResponse.json({
      success: true,
      archiveDate,
      archiveUrl,
      totalArticles: articles.length,
      premiumArticles: articles.filter(a => a.isPremium).length,
      freeArticles: articles.filter(a => !a.isPremium).length,
      articles
    });

  } catch (error) {
    console.error('Archive scraping error:', error);
    return NextResponse.json(
      { error: 'Internal server error during archive scraping' },
      { status: 500 }
    );
  }
}

async function handleGetRandomArticle() {
  try {
    const randomDate = generateRandomArchiveDate();
    
    // First, get the archive page to find articles
    const response = await fetch(`https://www.lemonde.fr/archives-du-monde/${randomDate}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch archive: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const archiveHtml = await response.text();
    const articles = parseArchiveArticles(archiveHtml);
    
    if (articles.length === 0) {
      return NextResponse.json(
        { error: 'No articles found in the selected archive date' },
        { status: 404 }
      );
    }
    
    // Pick a random article from the archive
    const randomArticle = articles[Math.floor(Math.random() * articles.length)];
    
    // Now scrape the actual article content
    const articleResponse = await fetch(randomArticle.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!articleResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch selected article: ${articleResponse.status} ${articleResponse.statusText}` },
        { status: articleResponse.status }
      );
    }

    const articleHtml = await articleResponse.text();
    const articleData = parseLeMondeArticle(articleHtml, randomArticle.url);

    return NextResponse.json({
      success: true,
      randomDate,
      archiveUrl: `https://www.lemonde.fr/archives-du-monde/${randomDate}/`,
      selectedFromArchive: {
        totalArticles: articles.length,
        premiumArticles: articles.filter(a => a.isPremium).length,
        freeArticles: articles.filter(a => !a.isPremium).length
      },
      url: randomArticle.url,
      ...articleData,
      rawHtmlLength: articleHtml.length
    });

  } catch (error) {
    console.error('Random article scraping error:', error);
    return NextResponse.json(
      { error: 'Internal server error during random article scraping' },
      { status: 500 }
    );
  }
}

function parseArchiveArticles(html: string) {
  const articles: Array<{
    url: string;
    title: string;
    description: string;
    isPremium: boolean;
    category: string;
    author: string;
    publishDate: string;
  }> = [];

  try {
    // Find all teaser sections that contain article links
    const teaserPattern = /<section class="teaser teaser--inline-picture[^"]*"[^>]*>(.*?)<\/section>/g;
    let teaserMatch;
    
    while ((teaserMatch = teaserPattern.exec(html)) !== null) {
      const teaserHtml = teaserMatch[1];
      
      // Extract article URL
      const urlMatch = teaserHtml.match(/<a class="[^"]*teaser__link[^"]*" href="([^"]+)"/);
      if (!urlMatch) continue;
      
      const url = urlMatch[1];
      
      // Skip if not a Le Monde article URL
      if (!url.includes('lemonde.fr') || !url.includes('/article/')) continue;
      
      // Extract title
      let title = '';
      const titleMatch = teaserHtml.match(/<h3 class="teaser__title"[^>]*>([^<]+)</);
      if (titleMatch) {
        title = titleMatch[1].trim();
        // Clean up HTML entities
        title = decodeHtmlEntities(title);
      }
      
      // Extract description
      let description = '';
      const descMatch = teaserHtml.match(/<p class="teaser__desc"[^>]*>([^<]+)</);
      if (descMatch) {
        description = descMatch[1].trim();
        // Clean up HTML entities
        description = decodeHtmlEntities(description);
      }
      
      // Check if premium
      const isPremium = teaserHtml.includes('Article réservé à nos abonnés') || 
                       teaserHtml.includes('icon__premium');
      
      // Extract category/kicker
      let category = '';
      const categoryMatch = teaserHtml.match(/<span class="teaser__kicker[^"]*">([^<]+)</);
      if (categoryMatch) {
        category = categoryMatch[1].trim();
        category = decodeHtmlEntities(category);
      }
      
      // Extract author
      let author = '';
      const authorMatch = teaserHtml.match(/<span class="meta__author[^"]*">([^<]+)</);
      if (authorMatch) {
        author = authorMatch[1].trim();
        author = decodeHtmlEntities(author);
      }
      
      // Extract publish date
      let publishDate = '';
      const dateMatch = teaserHtml.match(/<span class="meta__date[^"]*">([^<]+)</);
      if (dateMatch) {
        publishDate = dateMatch[1].trim();
        publishDate = decodeHtmlEntities(publishDate);
      }
      
      articles.push({
        url,
        title: title || 'Title not found',
        description: description || 'Description not found',
        isPremium,
        category: category || 'Uncategorized',
        author: author || 'Author not found',
        publishDate: publishDate || 'Date not found'
      });
    }
    
    return articles;
    
  } catch (error) {
    console.error('Error parsing archive articles:', error);
    return [];
  }
}

function generateRandomArchiveDate(): string {
  try {
    // Le Monde archives go from 1944 to current year (2025)
    const currentYear = new Date().getFullYear();
    const minYear = 1944;
    const maxYear = Math.min(currentYear, 2025);
    
    // Generate random year
    const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
    
    // Generate random month (1-12)
    const month = Math.floor(Math.random() * 12) + 1;
    
    // Generate random day based on month/year
    let maxDays = 31;
    if (month === 2) {
      // February - check for leap year
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      maxDays = isLeapYear ? 29 : 28;
    } else if ([4, 6, 9, 11].includes(month)) {
      // April, June, September, November
      maxDays = 30;
    }
    
    // For current year/month, don't go beyond today
    const today = new Date();
    if (year === currentYear && month === today.getMonth() + 1) {
      maxDays = Math.min(maxDays, today.getDate());
    }
    
    const day = Math.floor(Math.random() * maxDays) + 1;
    
    // Format as DD-MM-YYYY
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');
    
    return `${formattedDay}-${formattedMonth}-${year}`;
    
  } catch (error) {
    console.error('Error generating random date:', error);
    // Return a safe default date
    return '01-01-2020';
  }
}

function decodeHtmlEntities(text: string): string {
  // Handle common named entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&laquo;/g, '«');
  text = text.replace(/&raquo;/g, '»');
  
  // Handle hexadecimal entities (&#xNN;)
  text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Handle decimal entities (&#NNN;)
  text = text.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  return text;
}

function parseLeMondeArticle(html: string, url: string) {
  try {
    // Extract title from the specific Le Monde title class
    let title = '';
    const titleMatch = html.match(/<h1[^>]*class="[^"]*article__title[^"]*"[^>]*>([^<]+)<\/h1>/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      // Decode HTML entities in title
      title = decodeHtmlEntities(title);
    }

    // Extract description from article__desc class
    let description = '';
    const descMatch = html.match(/<p[^>]*class="[^"]*article__desc[^"]*"[^>]*>(.*?)<\/p>/);
    if (descMatch) {
      description = descMatch[1].trim();
      // Remove HTML tags and decode entities
      description = decodeHtmlEntities(description);
    }

    // Extract author from meta__author class
    let author = '';
    const authorMatch = html.match(/<span[^>]*class="[^"]*meta__author[^"]*"[^>]*>([^<]+)<\/span>/);
    if (authorMatch) {
      author = authorMatch[1].trim();
      // Decode HTML entities in author
      author = decodeHtmlEntities(author);
    }

    // Extract publication date from meta__date class
    let publishDate = '';
    const dateMatch = html.match(/<span[^>]*class="[^"]*meta__date[^"]*"[^>]*>([^<]+)<\/span>/);
    if (dateMatch) {
      publishDate = dateMatch[1].trim();
      // Decode HTML entities in publishDate
      publishDate = decodeHtmlEntities(publishDate);
    }

    // Extract article content from article__paragraph classes
    let content = '';
    const articleContentMatch = html.match(/<article[^>]*class="[^"]*article__content[^"]*"[^>]*>(.*?)<\/article>/);
    
    if (articleContentMatch) {
      const articleHtml = articleContentMatch[1];
      
      // Extract all paragraphs with article__paragraph class
      const paragraphMatches: string[] = [];
      const paragraphRegex = /<p[^>]*class="[^"]*article__paragraph[^"]*"[^>]*>(.*?)<\/p>/;
      const paragraphSplit = articleHtml.split(paragraphRegex);
      for (let i = 1; i < paragraphSplit.length; i += 2) {
        if (paragraphSplit[i]) {
          paragraphMatches.push(paragraphSplit[i]);
        }
      }
      
      // Extract subtitles with article__sub-title class
      const subtitleMatches: string[] = [];
      const subtitleRegex = /<h2[^>]*class="[^"]*article__sub-title[^"]*"[^>]*>(.*?)<\/h2>/;
      const subtitleSplit = articleHtml.split(subtitleRegex);
      for (let i = 1; i < subtitleSplit.length; i += 2) {
        if (subtitleSplit[i]) {
          subtitleMatches.push(subtitleSplit[i]);
        }
      }
      
      let contentParts: string[] = [];
      
      if (paragraphMatches.length > 0) {
        paragraphMatches.forEach(paragraph => {
          contentParts.push(paragraph.trim());
        });
      }
      
      if (subtitleMatches.length > 0) {
        subtitleMatches.forEach(subtitle => {
          contentParts.push('## ' + subtitle.trim());
        });
      }
      
      content = contentParts.join('\n\n');
      
      // Clean up the content - remove remaining HTML tags and decode entities
      if (content) {
        // Remove script and style tags completely
        content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
        content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
        
        // Remove HTML tags but keep text content
        content = content.replace(/<[^>]+>/g, ' ');
        
        // Decode common HTML entities
        content = decodeHtmlEntities(content);
        
        // Clean up excess whitespace within paragraphs but preserve paragraph breaks
        content = content.replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
        content = content.replace(/\n[ \t]+/g, '\n'); // Remove spaces at start of lines
        content = content.replace(/[ \t]+\n/g, '\n'); // Remove spaces at end of lines
        content = content.replace(/\n{3,}/g, '\n\n'); // Replace 3+ line breaks with 2
        content = content.trim();
      }
    }

    // If no content found with the specific classes, try a fallback approach
    if (!content) {
      const paragraphs = html.match(/<p[^>]*>.*?<\/p>/g);
      if (paragraphs && paragraphs.length > 3) {
        // Filter out likely navigation/footer paragraphs and keep main content
        const contentParagraphs = paragraphs.slice(0, -2).filter(p => {
          const text = p.replace(/<[^>]+>/g, '').trim();
          return text.length > 50; // Only keep substantial paragraphs
        });
        content = contentParagraphs.join('\n\n');
        
        // Clean up HTML and decode entities
        content = content.replace(/<[^>]+>/g, ' ');
        content = decodeHtmlEntities(content);
        content = content.replace(/\s+/g, ' ').trim();
      }
    }

    return {
      title: title || 'Title not found',
      description: description || 'Description not found',
      content: content || 'Content not found',
      author: author || 'Author not found',
      publishDate: publishDate || 'Date not found',
      wordCount: content ? content.split(/\s+/).filter(word => word.length > 0).length : 0
    };

  } catch (error) {
    console.error('Error parsing article:', error);
    return {
      title: 'Parse error',
      description: 'Failed to parse article',
      content: 'Content extraction failed',
      author: 'Unknown',
      publishDate: 'Unknown',
      wordCount: 0
    };
  }
} 