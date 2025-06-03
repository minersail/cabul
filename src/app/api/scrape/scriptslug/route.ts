import { NextRequest, NextResponse } from 'next/server';
import { translateMovieScene } from '@/lib/stylizedTranslate';

export async function POST(request: NextRequest) {
  try {
    // Dynamic import to avoid initialization issues
    const pdf = (await import('pdf-parse')).default;
    
    const body = await request.json();
    const { pdfUrl } = body;

    // Default to The Grand Budapest Hotel PDF if no URL provided
    const targetUrl = pdfUrl || 'https://assets.scriptslug.com/live/pdf/scripts/the-grand-budapest-hotel-2014.pdf?v=1729115019';

    console.log('Fetching PDF from:', targetUrl);

    // Fetch the PDF file
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `Failed to fetch PDF: ${response.status} ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: targetUrl
          }
        },
        { status: response.status }
      );
    }

    // Get PDF buffer
    const pdfBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(pdfBuffer);

    // Parse PDF
    const pdfData = await pdf(buffer);
    
    // Split content into scenes
    const fullText = pdfData.text;
    const scenes = splitIntoScenes(fullText);
    
    // Get a random scene
    const randomSceneIndex = Math.floor(Math.random() * scenes.length);
    const randomScene = scenes[randomSceneIndex];

    // Extract movie title for translation context
    const movieTitle = extractTitleFromText(fullText);

    // Translate the scene to French
    let translatedScene;
    let translationError;
    
    try {
      const translation = await translateMovieScene(
        randomScene.content,
        randomScene.header,
        movieTitle
      );
      translatedScene = translation.translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      translationError = error instanceof Error ? error.message : 'Translation failed';
      // Fallback to original English text if translation fails
      translatedScene = randomScene.content;
    }

    return NextResponse.json({
      success: true,
      url: targetUrl,
      totalPages: pdfData.numpages,
      totalScenes: scenes.length,
      randomSceneIndex: randomSceneIndex + 1, // 1-indexed for display
      randomSceneContent: translatedScene, // Now returns French translation
      originalSceneContent: randomScene.content, // Include original English for reference
      sceneHeader: randomScene.header || 'Scene',
      sceneWordCount: translatedScene.split(/\s+/).length,
      fullTextLength: fullText.length,
      translationError: translationError, // Include any translation errors
      metadata: {
        title: movieTitle,
        info: pdfData.info || {}
      }
    });

  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to split text into scenes based on screenplay patterns
function splitIntoScenes(text: string): Array<{content: string, header?: string}> {
  // Clean up the text first
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Enhanced scene detection patterns for screenplays
  const scenePatterns = [
    // Standard scene headers
    /\n\s*(INT\.|EXT\.)[^\n]*\n/gi,
    // Scene transitions
    /\n\s*(FADE IN|FADE OUT|FADE TO BLACK|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT)[^\n]*\n/gi,
    // Chapter or section breaks
    /\n\s*(CHAPTER|SCENE|ACT)[^\n]*\n/gi,
    // Time transitions
    /\n\s*(LATER|MEANWHILE|SAME TIME|MOMENTS LATER|THE NEXT DAY|MORNING|EVENING|NIGHT)[^\n]*\n/gi
  ];
  
  let scenes: Array<{content: string, header?: string}> = [];
  let splits: Array<{content: string, header?: string}> = [];
  
  // Try each pattern to find the best scene breaks
  for (const pattern of scenePatterns) {
    const matches = Array.from(cleanText.matchAll(pattern));
    if (matches.length > 2) { // Need at least 3 scenes to be worthwhile
      splits = [];
      let lastIndex = 0;
      
      for (const match of matches) {
        if (match.index !== undefined) {
          // Add content before this scene header
          if (lastIndex < match.index) {
            const content = cleanText.slice(lastIndex, match.index).trim();
            if (content.length > 100) { // Filter out very short segments
              splits.push({ content });
            }
          }
          
          // Start next segment from after this scene header
          lastIndex = match.index + match[0].length;
          
          // Store the scene header for context
          const header = match[0].trim();
          if (lastIndex < cleanText.length) {
            const nextSceneMatch = cleanText.slice(lastIndex).search(pattern);
            const endIndex = nextSceneMatch !== -1 ? lastIndex + nextSceneMatch : cleanText.length;
            const content = cleanText.slice(lastIndex, endIndex).trim();
            
            if (content.length > 100) {
              splits.push({ content, header });
            }
            
            if (nextSceneMatch !== -1) {
              lastIndex = endIndex;
            } else {
              break;
            }
          }
        }
      }
      
      // Add remaining content
      if (lastIndex < cleanText.length) {
        const content = cleanText.slice(lastIndex).trim();
        if (content.length > 100) {
          splits.push({ content });
        }
      }
      
      if (splits.length > scenes.length) {
        scenes = splits;
      }
    }
  }
  
  // If no good scene breaks found, fall back to chunk by length
  if (scenes.length < 3) {
    const chunkSize = Math.ceil(cleanText.length / 15); // Aim for ~15 scenes
    scenes = [];
    for (let i = 0; i < cleanText.length; i += chunkSize) {
      const content = cleanText.slice(i, i + chunkSize).trim();
      if (content.length > 100) {
        scenes.push({ 
          content,
          header: `Section ${Math.floor(i / chunkSize) + 1}`
        });
      }
    }
  }
  
  // Ensure we have at least one scene
  if (scenes.length === 0) {
    scenes = [{ 
      content: cleanText.slice(0, 3000), // First 3000 characters as fallback
      header: 'Opening Scene'
    }];
  }
  
  // Limit to reasonable number of scenes
  return scenes.slice(0, 100);
}

// Helper function to extract title from the beginning of the text
function extractTitleFromText(text: string): string {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for the title in the first several lines
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    // Skip very short lines or lines that look like metadata
    if (line.length > 10 && line.length < 100 && !line.includes('by') && !line.includes('©')) {
      // Check if it looks like a title (mostly uppercase or title case)
      const upperCaseRatio = (line.match(/[A-Z]/g) || []).length / line.length;
      if (upperCaseRatio > 0.3) {
        return line;
      }
    }
  }
  
  return 'Unknown Script';
} 