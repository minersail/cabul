import { NextRequest, NextResponse } from 'next/server';
import { translateToEnglish } from '@/utils/translate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mode } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!mode || !['toEnglish'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be: toEnglish' },
        { status: 400 }
      );
    }

    let result;
    switch (mode) {
      case 'toEnglish':
        result = await translateToEnglish(text);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid mode' },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
} 