'use client';

import { useState, useEffect } from 'react';

interface WordData {
  word: string;
  total: number;
  correct: number;
  percentage: number;
}

export default function VocabStats() {
  const [stats, setStats] = useState<WordData[]>([]);
  const [sortBy, setSortBy] = useState<'word' | 'total' | 'percentage'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Get stats from localStorage
    const rawStats = localStorage.getItem('vocabStats');
    if (!rawStats) return;

    const parsedStats: Record<string, [number, number]> = JSON.parse(rawStats);
    const processedStats: WordData[] = Object.entries(parsedStats).map(([word, [total, correct]]) => ({
      word,
      total,
      correct,
      percentage: Math.round((correct / total) * 100)
    }));

    // Sort stats
    const sortedStats = processedStats.sort((a, b) => {
      if (sortBy === 'word') {
        return sortOrder === 'asc' ? 
          a.word.localeCompare(b.word) : 
          b.word.localeCompare(a.word);
      }
      const aValue = sortBy === 'total' ? a.total : a.percentage;
      const bValue = sortBy === 'total' ? b.total : b.percentage;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setStats(sortedStats);
  }, [sortBy, sortOrder]);

  const handleSort = (newSortBy: 'word' | 'total' | 'percentage') => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  if (stats.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Vocabulary Statistics</h2>
        <p className="text-gray-500">No vocabulary data available yet. Start practicing to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Vocabulary Statistics</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th 
                className="py-2 px-4 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('word')}
              >
                Word {sortBy === 'word' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="py-2 px-4 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('total')}
              >
                Encounters {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="py-2 px-4 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('percentage')}
              >
                Success Rate {sortBy === 'percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.word} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-4 font-medium">{stat.word}</td>
                <td className="py-2 px-4">
                  <div className="flex items-center">
                    <span className="mr-2">{stat.total}</span>
                    <span className="text-sm text-gray-500">({stat.correct} correct)</span>
                  </div>
                </td>
                <td className="py-2 px-4">
                  <div className="flex items-center">
                    <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className={`h-full rounded-full ${
                          stat.percentage >= 80 ? 'bg-green-500' :
                          stat.percentage >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <span>{stat.percentage}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 