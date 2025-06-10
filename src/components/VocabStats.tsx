'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { deleteUserVocabulary, getUserVocabulary, VocabularyEntry } from '@/lib/actions/vocabularyActions';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@supabase/supabase-js';

interface VocabStatsProps {
  refreshTrigger?: number; // When this number changes, refresh the vocabulary
}

// Shared paper-style container component
function PaperContainer({ children }: { children: React.ReactNode }) {
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
      {children}
      
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

// Unified header component that handles all states
function VocabStatsHeader({
  user, 
  onClearStats, 
  isClearing,
}: { 
  user: User | null; 
  onClearStats: () => void; 
  isClearing: boolean; 
}) {
  return (
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
      
      <div 
        className="text-xs mb-2 transform rotate-1 text-blue-600"
        style={{ fontFamily: 'var(--font-pangolin)' }}
      >
        ✨ Anonymous session - Create account to save forever!
      </div>
      
      <button 
        onClick={onClearStats} 
        disabled={isClearing || !user}
        className="absolute top-0 right-0 text-xs transform rotate-2 hover:rotate-0 transition-transform disabled:opacity-50"
        style={{ 
          fontFamily: 'var(--font-pangolin)', 
          color: '#ef4444',
          cursor: isClearing ? 'wait' : 'pointer'
        }}
      >
        {isClearing ? '⏳ clearing...' : '✗ erase all'}
      </button>
    </div>
  );
}

export default function VocabStats({ refreshTrigger }: VocabStatsProps) {
  const [rawStats, setRawStats] = useState<VocabularyEntry[]>([]);
  const [sortBy, setSortBy] = useState<'word' | 'total' | 'percentage'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isClearing, setIsClearing] = useState(false);
  
  const { user } = useAuth();

  // Load vocabulary from database
  const loadVocabulary = useCallback(async () => {
    if (!user) {
      setRawStats([]);
      return;
    }

    try {
      const result = await getUserVocabulary(user.id);
      
      if (result.success) {
        setRawStats(result.data);
      } else {
        console.error('Failed to load vocabulary:', result.error);
        setRawStats([]);
      }
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      setRawStats([]);
    }
  }, [user]);

  // Load vocabulary when user changes or refreshTrigger changes
  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary, refreshTrigger]);

  // Compute sorted stats - no infinite loop!
  const sortedStats = useMemo(() => {
    return [...rawStats].sort((a, b) => {
      if (sortBy === 'word') {
        return sortOrder === 'asc' ? 
          a.lemma.localeCompare(b.lemma) : 
          b.lemma.localeCompare(a.lemma);
      }
      
      let aValue: number;
      let bValue: number;
      
      if (sortBy === 'total') {
        aValue = a.seen;
        bValue = b.seen;
      } else { // percentage
        aValue = (a.correct / a.seen) * 100;
        bValue = (b.correct / b.seen) * 100;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [rawStats, sortBy, sortOrder]);

  const handleClearStats = async () => {
    if (!user) return;
    
    try {
      setIsClearing(true);
      
      // Clear vocabulary from database
      const result = await deleteUserVocabulary(user.id);
      
      if (result.success) {
        // Update local state
        setRawStats([]);
        console.log('Vocabulary cleared successfully');
      } else {
        console.error('Failed to clear vocabulary:', result.error);
        alert('Failed to clear vocabulary. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing vocabulary:', error);
      alert('Failed to clear vocabulary. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSort = (newSortBy: 'word' | 'total' | 'percentage') => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <PaperContainer>
      <VocabStatsHeader 
        user={user} 
        onClearStats={handleClearStats} 
        isClearing={isClearing} 
      />

      { sortedStats.length === 0 &&
        <p style={{ fontFamily: 'var(--font-pangolin)', color: '#374151' }}className="transform rotate-1">No words practiced yet... Start learning to fill this page!</p>
      }

      { !isClearing && sortedStats.length > 0 && 
      <>
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
          {sortedStats.map((stat, index) => (
            <div 
              key={stat.lemma} 
              className={`grid grid-cols-3 gap-4 py-2 transform ${index % 2 === 0 ? 'rotate-0' : '-rotate-0'} hover:rotate-0 transition-transform`}
              style={{ 
                borderBottom: '1px dashed rgba(107, 114, 128, 0.3)',
                fontFamily: 'var(--font-pangolin)',
                color: '#374151'
              }}
            >
              {/* Word */}
              <div className="font-medium transform hover:scale-105 transition-transform">
                {stat.lemma}
              </div>
              
              {/* Encounters */}
              <div className="flex items-center space-x-2">
                <span>{stat.seen}</span>
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
                      width: `${stat.correct / stat.seen * 100}%`,
                      background: (stat.correct / stat.seen * 100) >= 80 
                        ? 'repeating-linear-gradient(45deg, #10b981, #10b981 2px, #059669 2px, #059669 4px)'
                        : (stat.correct / stat.seen * 100) >= 60 
                        ? 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 2px, #d97706 2px, #d97706 4px)'
                        : 'repeating-linear-gradient(45deg, #ef4444, #ef4444 2px, #dc2626 2px, #dc2626 4px)',
                      transform: 'rotate(1deg)',
                      clipPath: 'polygon(0 20%, 100% 0%, 100% 80%, 0% 100%)'
                    }}
                  />
                </div>
                <span className="text-sm transform rotate-1">
                  {Math.round(stat.correct / stat.seen * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
      }
    </PaperContainer>
  );
} 