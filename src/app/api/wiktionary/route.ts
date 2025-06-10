/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

// Helper function to clean up HTML content
function cleanupDefinition(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

// Example API call:
// https://fr.wiktionary.org/w/api.php?action=parse&page=quand&format=json&prop=sections&formatversion=2

export async function POST(request: Request) {
  try {
    const { word } = await request.json();
    
    if (!word) {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      );
    }

    // First, get the sections to find the relevant section indexes
    const sectionsResponse = await fetch(
      `https://fr.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&format=json&prop=sections&formatversion=2`
    );
    const sectionsData = await sectionsResponse.json();
    
    if (!sectionsData.parse) {
      return NextResponse.json(
        { error: 'Word not found in Wiktionary' },
        { status: 404 }
      );
    }

    // Find the French section and its subsections
    const sections = sectionsData.parse.sections;
    const frenchSection = sections.find(
      (section: any) => section.line.includes('Français')
    );

    if (!frenchSection) {
      return NextResponse.json(
        { error: 'No French entry found' },
        { status: 404 }
      );
    }

    // Find relevant subsection indexes
    const etymologySection = sections.find(
      (section: any) => section.line.includes('Étymologie') && 
      section.number.startsWith(frenchSection.number + '.')
    );

    const pronunciationSection = sections.find(
      (section: any) => section.line.includes('Prononciation') && 
      section.number.startsWith(frenchSection.number + '.')
    );

    // Get the word type sections (Nom, Verbe, Adjectif, etc.)
    const wordTypeSections = sections.filter(
      (section: any) => 
        section.level === '3' && 
        section.number.startsWith(frenchSection.number + '.') &&
        !['Étymologie', 'Prononciation', 'Références'].some(header => 
          section.line.includes(header)
        )
    );

    // Get the content for each relevant section
    const contentPromises = [
      etymologySection,
      pronunciationSection,
      ...wordTypeSections
    ].filter(Boolean).map(section => 
      fetch(`https://fr.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&section=${section.index}&format=json&prop=text&formatversion=2`)
        .then(res => res.json())
    );

    const contentResults = await Promise.all(contentPromises);

    // Process etymology
    let etymology = null;
    if (etymologySection && contentResults[0]?.parse?.text) {
      const etymText = contentResults[0].parse.text;
      etymology = cleanupDefinition(etymText.split('\n')[0]); // Usually the first line
    }

    // Process pronunciation
    let pronunciation = null;
    if (pronunciationSection && contentResults[1]?.parse?.text) {
      const pronText = contentResults[1].parse.text;
      const ipaMatch = pronText.match(/\\\/(.*?)\\\//);
      pronunciation = ipaMatch ? ipaMatch[1] : null;
    }

    // Process definitions
    const definitions: string[] = [];
    const wordTypes: string[] = [];
    
    // Start from index 2 as 0 and 1 were etymology and pronunciation
    for (let i = 2; i < contentResults.length; i++) {
      const content = contentResults[i]?.parse?.text;
      if (content) {
        // Get the word type (section header)
        const wordType = wordTypeSections[i - 2].line.replace(/<[^>]*>/g, '');
        wordTypes.push(wordType);

        // Extract definitions from ordered lists
        const defList = content.match(/<ol>[\s\S]*?<\/ol>/);
        if (defList) {
          const defs = defList[0]
            .match(/<li>[\s\S]*?<\/li>/g)
            ?.map((def: string) => cleanupDefinition(def))
            .filter((def: unknown): def is string => Boolean(def)) || [];
          
          definitions.push(...defs.map((def: string) => `(${wordType}) ${def}`));
        }
      }
    }

    return NextResponse.json({
      word,
      etymology,
      pronunciation,
      definitions: definitions.slice(0, 3), // Limit to top 3 definitions
      wordTypes,
      url: `https://fr.wiktionary.org/wiki/${encodeURIComponent(word)}`,
    });

  } catch (error) {
    console.error('Wiktionary API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Wiktionary' },
      { status: 500 }
    );
  }
} 