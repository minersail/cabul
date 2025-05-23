import { NextRequest } from 'next/server';
import type { CompositionAnalysisResponse, ErrorResponse, BatchAnalysisResponse } from '@/types/compositionality';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const API_URL = "https://d17kpd2uvgl6br2y.us-east-1.aws.endpoints.huggingface.cloud";

export async function POST(request: NextRequest) {
  if (!HUGGINGFACE_API_KEY) {
    return Response.json(
      { error: 'HuggingFace API key not configured' } as ErrorResponse,
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { phrase, phrases } = body;

    // Handle batch analysis
    if (phrases && Array.isArray(phrases)) {
      const results = await Promise.all(
        phrases.map(async (p) => {
          try {
            const response = await fetch(API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
              },
              body: JSON.stringify({ inputs: p })
            });

            if (!response.ok) {
              console.error(`Error analyzing phrase "${p}":`, await response.text());
              return null;
            }

            return await response.json();
          } catch (error) {
            console.error(`Error analyzing phrase "${p}":`, error);
            return null;
          }
        })
      );

      // Filter out null results and cast to correct type
      const validResults = results.filter((r): r is CompositionAnalysisResponse => r !== null);
      
      return Response.json({ results: validResults } as BatchAnalysisResponse);
    }

    // Handle single phrase analysis
    if (!phrase || typeof phrase !== 'string') {
      return Response.json(
        { error: 'Invalid request: phrase is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
      },
      body: JSON.stringify({ inputs: phrase })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${error}`);
    }

    const data = await response.json();
    return Response.json(data as CompositionAnalysisResponse);
  } catch (error) {
    console.error('Error analyzing phrase:', error);
    return Response.json(
      { error: 'Failed to analyze phrase' } as ErrorResponse,
      { status: 500 }
    );
  }
} 