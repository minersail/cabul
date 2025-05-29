'use client';

import { useState, useEffect } from 'react';

interface WordData {
  word: string;
  total: number;
  correct: number;
  percentage: number;
}

const rawStatsToWordData = (wordStats: Record<string, [number, number]>): WordData[] => {
  return Object.entries(wordStats).map(([word, [total, correct]]) => ({
    word,
    total,
    correct,
    percentage: Math.round((correct / total) * 100)
  }));
};

export default function VocabStats({ wordStats }: { wordStats: Record<string, [number, number]> }) {
  const [stats, setStats] = useState<WordData[]>([]);
  const [sortBy, setSortBy] = useState<'word' | 'total' | 'percentage'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const handleClearStats = () => {
    localStorage.removeItem('vocabStats');
    setStats([]);
  }

  useEffect(() => {
    setStats(rawStatsToWordData(wordStats));
  }, [wordStats]);

  useEffect(() => {
    const processedStats: WordData[] = rawStatsToWordData(wordStats);

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
      <div 
        className="p-6 relative"
        style={{ 
          backgroundColor: '#fefefe',
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        <div className="text-center" style={{ fontFamily: 'var(--font-pangolin)', color: '#374151' }}>
          <h3 className="text-lg mb-4 transform -rotate-1">📝 Vocabulary Progress Sheet</h3>
          <p className="transform rotate-1">No words practiced yet... Start learning to fill this page!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-6 relative"
      style={{ 
        backgroundColor: '#fefefe',
        backgroundImage: `
          linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}
    >
      {/* Hand-drawn title */}
      <div className="mb-6 relative">
        <h3 
          className="text-xl mb-2 transform -rotate-1" 
          style={{ 
            fontFamily: 'var(--font-pangolin)', 
            color: '#374151',
            textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
          }}
        >
          📝 Vocabulary Statistics
        </h3>
        <button 
          onClick={handleClearStats} 
          className="absolute top-0 right-0 text-xs transform rotate-2 hover:rotate-0 transition-transform"
          style={{ 
            fontFamily: 'var(--font-pangolin)', 
            color: '#ef4444',
            cursor: 'pointer'
          }}
        >
          ✗ erase all
        </button>
      </div>

      {/* Hand-drawn headers */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div 
          className="cursor-pointer transform hover:-rotate-1 transition-transform"
          onClick={() => handleSort('word')}
          style={{ fontFamily: 'var(--font-pangolin)', color: '#374151' }}
        >
          <span className="underline decoration-wavy">Word</span>
          {sortBy === 'word' && <span className="ml-1">{sortOrder === 'asc' ? '↗️' : '↘️'}</span>}
        </div>
        <div 
          className="cursor-pointer transform hover:rotate-1 transition-transform"
          onClick={() => handleSort('total')}
          style={{ fontFamily: 'var(--font-pangolin)', color: '#374151' }}
        >
          <span className="underline decoration-wavy">Times Seen</span>
          {sortBy === 'total' && <span className="ml-1">{sortOrder === 'asc' ? '↗️' : '↘️'}</span>}
        </div>
        <div 
          className="cursor-pointer transform hover:-rotate-1 transition-transform"
          onClick={() => handleSort('percentage')}
          style={{ fontFamily: 'var(--font-pangolin)', color: '#374151' }}
        >
          <span className="underline decoration-wavy">Success Rate</span>
          {sortBy === 'percentage' && <span className="ml-1">{sortOrder === 'asc' ? '↗️' : '↘️'}</span>}
        </div>
      </div>

      {/* Hand-drawn vocabulary entries */}
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div 
            key={stat.word} 
            className={`grid grid-cols-3 gap-4 py-2 transform ${index % 2 === 0 ? 'rotate-0' : '-rotate-0'} hover:rotate-0 transition-transform`}
            style={{ 
              borderBottom: '1px dashed rgba(107, 114, 128, 0.3)',
              fontFamily: 'var(--font-pangolin)',
              color: '#374151'
            }}
          >
            {/* Word */}
            <div className="font-medium transform hover:scale-105 transition-transform">
              {stat.word}
            </div>
            
            {/* Encounters */}
            <div className="flex items-center space-x-2">
              <span>{stat.total}</span>
              <span className="text-xs text-gray-500 transform -rotate-1">
                ({stat.correct} ✓)
              </span>
            </div>
            
            {/* Hand-drawn progress bar */}
            <div className="flex items-center space-x-2">
              <div className="relative w-20 h-3">
                {/* Background "pencil marks" */}
                <div 
                  className="absolute inset-0 border-2 border-dashed"
                  style={{ 
                    borderColor: '#d1d5db',
                    transform: 'rotate(-1deg)'
                  }}
                />
                {/* Fill "pencil shading" */}
                <div 
                  className="absolute top-0 left-0 h-full"
                  style={{ 
                    width: `${stat.percentage}%`,
                    background: stat.percentage >= 80 
                      ? 'repeating-linear-gradient(45deg, #10b981, #10b981 2px, #059669 2px, #059669 4px)'
                      : stat.percentage >= 60 
                      ? 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 2px, #d97706 2px, #d97706 4px)'
                      : 'repeating-linear-gradient(45deg, #ef4444, #ef4444 2px, #dc2626 2px, #dc2626 4px)',
                    transform: 'rotate(1deg)',
                    clipPath: 'polygon(0 20%, 100% 0%, 100% 80%, 0% 100%)'
                  }}
                />
              </div>
              <span className="text-sm transform rotate-1">
                {stat.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Hand-drawn decorative elements */}
      <div className="absolute top-2 left-2 text-blue-400 opacity-30 transform rotate-12">
        📐
      </div>
      <div className="absolute bottom-2 right-2 text-blue-400 opacity-30 transform -rotate-12">
        ✏️
      </div>
      
      {/* Paper holes */}
      <div className="absolute left-0 top-1/4 w-2 h-2 bg-white border border-blue-200 rounded-full"></div>
      <div className="absolute left-0 top-2/4 w-2 h-2 bg-white border border-blue-200 rounded-full"></div>
      <div className="absolute left-0 top-3/4 w-2 h-2 bg-white border border-blue-200 rounded-full"></div>
    </div>
  );
} 