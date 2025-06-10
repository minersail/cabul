import { NextRequest, NextResponse } from 'next/server';

const HF_TOKENIZATION_API_URL = "https://wf8f2kmllyuy5gkd.us-east-1.aws.endpoints.huggingface.cloud";

// IMPORTANT: Replace with your actual Hugging Face API Key or set as an environment variable
// For local development, you can temporarily hardcode it here, but ensure it's 
// managed via environment variables (e.g., .env.local) for production/sharing.
const HF_AUTH_TOKEN = process.env.HUGGINGFACE_API_KEY || "YOUR_HF_API_KEY_PLACEHOLDER";

export async function POST(request: NextRequest) {
  if (!HF_AUTH_TOKEN || HF_AUTH_TOKEN === "YOUR_HF_API_KEY_PLACEHOLDER") {
    console.error('Hugging Face API key is not configured properly.');
    return NextResponse.json(
      { error: 'Authentication error: Hugging Face API key not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { text, parameters } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!parameters || (parameters.mode !== 'simple' && parameters.mode !== 'full')) {
      return NextResponse.json(
        { error: 'Parameters object with mode ("simple" or "full") is required' },
        { status: 400 }
      );
    }

    const payload = {
      inputs: text,
      parameters: {
        mode: parameters.mode,
        include_entities: parameters.include_entities !== undefined ? parameters.include_entities : true,
        include_pos: parameters.include_pos !== undefined ? parameters.include_pos : true,
        include_lemmas: parameters.include_lemmas !== undefined ? parameters.include_lemmas : true,
        include_dependencies: parameters.include_dependencies !== undefined ? parameters.include_dependencies : true,
        include_sentences: parameters.include_sentences !== undefined ? parameters.include_sentences : true,
      }
    };

    const response = await fetch(HF_TOKENIZATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_AUTH_TOKEN}`
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Hugging Face API error:', responseData);
      return NextResponse.json(
        { error: responseData.error || 'Tokenization failed at Hugging Face API' },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Tokenization API error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error during tokenization' },
      { status: 500 }
    );
  }
} 