'use client';

import { useState } from 'react';
import type { CompositionAnalysisResponse, ErrorResponse } from '@/types/compositionality';

interface WordHeatMap {
  word: string;
  score: number | null;
}

function getNGrams(text: string, n: number = 3): string[] {
  const words = text.trim().split(/\s+/);
  const ngrams: string[] = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}

function getWordScores(words: string[], ngramResults: CompositionAnalysisResponse[]): WordHeatMap[] {
  const wordScores: WordHeatMap[] = words.map(word => ({ word, score: null }));
  
  ngramResults.forEach((result, index) => {
    // Each result corresponds to a 3-gram starting at index
    if (result.compositionality_score !== null) {
      wordScores[index].score = result.compositionality_score;
    }
  });
  
  return wordScores;
}

function getColorForScore(score: number | null): string {
  if (score === null) return 'text-gray-500';
  // Convert score from 0-1 to RGB where 0 is red (255,0,0) and 1 is green (0,255,0)
  const red = Math.round(255 * (1 - score));
  const green = Math.round(255 * score);
  return `rgb(${red}, ${green}, 0)`;
}

export default function CompositionAnalysisPage() {
  const [phrase, setPhrase] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [result, setResult] = useState<CompositionAnalysisResponse | null>(null);
  const [paragraphResults, setParagraphResults] = useState<WordHeatMap[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paragraphLoading, setParagraphLoading] = useState(false);

  const analyzePhrase = async () => {
    if (!phrase.trim()) {
      setError('Please enter a phrase');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/compositionality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrase: phrase.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze phrase');
      }

      setResult(data as CompositionAnalysisResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const analyzeParagraph = async () => {
    if (!paragraph.trim()) {
      setError('Please enter a paragraph');
      return;
    }

    setParagraphLoading(true);
    setError(null);
    setParagraphResults([]);

    try {
      const words = paragraph.trim().split(/\s+/);
      const ngrams = getNGrams(paragraph);
      
      // Batch analyze all 3-grams
      const response = await fetch('/api/compositionality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrases: ngrams })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze paragraph');
      }

      const results = data.results as CompositionAnalysisResponse[];
      const wordScores = getWordScores(words, results);
      setParagraphResults(wordScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setParagraphLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Phrase Compositionality Analysis</h1>
      
      {/* Single Phrase Analysis */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Single Phrase Analysis</h2>
        <div className="mb-6">
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Enter a phrase (e.g., 'red car', 'hot dog')"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={analyzePhrase}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {result && (
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
            <div className="space-y-4">
              <div>
                <strong>Phrase:</strong> {result.phrase}
              </div>
              <div>
                <strong>Word Count:</strong> {result.word_count}
              </div>
              <div>
                <strong>Compositionality Score:</strong>{' '}
                {result.compositionality_score !== null
                  ? result.compositionality_score.toFixed(3)
                  : 'N/A'}
              </div>
              <div>
                <strong>Interpretation:</strong> {result.interpretation}
              </div>
              <div>
                <strong>Word Contributions:</strong>
                <ul className="mt-2 space-y-2">
                  {result.word_contributions.map((contribution, index) => (
                    <li key={index}>
                      {contribution.word}: {contribution.similarity_to_phrase.toFixed(3)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paragraph Analysis */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Paragraph Analysis</h2>
        <div className="mb-6">
          <textarea
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            placeholder="Enter a paragraph to analyze compositionality of each word in context..."
            className="w-full p-2 border rounded h-32"
          />
          <button
            onClick={analyzeParagraph}
            disabled={paragraphLoading}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {paragraphLoading ? 'Analyzing...' : 'Analyze Paragraph'}
          </button>
        </div>

        {paragraphResults.length > 0 && (
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Heat Map</h3>
            <p className="mb-2 text-sm text-gray-600">
              Colors indicate compositionality scores of 3-word phrases starting with each word:
              <span className="ml-2 font-semibold" style={{ color: 'rgb(255,0,0)' }}>Red (0.0)</span>
              {' → '}
              <span className="font-semibold" style={{ color: 'rgb(0,255,0)' }}>Green (1.0)</span>
            </p>
            <div className="p-4 bg-gray-50 rounded">
              {paragraphResults.map((wordScore, index) => (
                <span
                  key={index}
                  className="inline-block"
                  style={{ 
                    color: getColorForScore(wordScore.score),
                    marginRight: '0.25em'
                  }}
                >
                  {wordScore.word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}
    </div>
  );
} 