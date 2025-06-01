'use client';

import { Suspense } from 'react';
import { Walter_Turncoat } from 'next/font/google';
import { KEY_MAPPINGS } from '@/hooks/useInput';

const walterTurncoat = Walter_Turncoat({
  weight: '400',
  subsets: ['latin'],
});

export interface InstructionPaneProps {
  isLearningMode: boolean;
}

// Helper function to extract the display key from KeyCode (e.g., 'KeyE' -> 'E')
function getDisplayKey(keyCode: string): string {
  return keyCode.replace('Key', '');
}

export default function InstructionPane({ isLearningMode }: InstructionPaneProps) {
  const keyMappings = isLearningMode ? KEY_MAPPINGS.LEARNING_MODE : KEY_MAPPINGS.NAVIGATION_MODE;

  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-4 rounded-lg border-[6px] border-[#8B4513] shadow-xl overflow-hidden"
           style={{
             background: '#1a1a1a url(/assets/chalk-texture.png) repeat',
             backgroundSize: '500px 500px',
             backgroundPosition: 'center center',
             boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.3)'
           }}>
        <div className="p-6 relative">
          {/* Chalk dust and texture effect */}
          <div className="absolute inset-0 bg-black/30 mix-blend-multiply"></div>
          
          {/* Instructions with chalk effect */}
          <div className="space-y-6 relative">
            {Object.entries(keyMappings).map(([actionName, action]) => (
              <div key={actionName} className="relative group">
                <div className="flex items-center gap-3">
                  <kbd className={`${walterTurncoat.className} flex-shrink-0 flex items-center justify-center w-10 h-10 text-white/90 text-sm bg-transparent border-[2px] border-white/70`}
                       style={{
                         textShadow: '0 0 3px rgba(255,255,255,0.4)',
                         letterSpacing: '0.5px',
                         borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
                       }}>
                    {getDisplayKey(action.key)}
                  </kbd>
                  <span className={`${walterTurncoat.className} text-white/90 text-sm`}
                        style={{
                          textShadow: '0 0 3px rgba(255,255,255,0.4)',
                          letterSpacing: '0.5px'
                        }}>
                    {action.instruction}
                  </span>
                </div>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 