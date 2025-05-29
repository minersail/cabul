'use client';

import { Suspense } from 'react';
import { Walter_Turncoat } from 'next/font/google';

const walterTurncoat = Walter_Turncoat({
  weight: '400',
  subsets: ['latin'],
});

export interface InstructionPaneProps {
  isLearningMode: boolean;
}

export default function InstructionPane({ isLearningMode }: InstructionPaneProps) {
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
            {isLearningMode ? (
              <>
                <div className="relative group">
                  <div className="flex items-center gap-3">
                    <kbd className={`${walterTurncoat.className} flex-shrink-0 flex items-center justify-center w-10 h-10 text-white/90 text-sm bg-transparent border-[2px] border-white/70`}
                         style={{
                           textShadow: '0 0 3px rgba(255,255,255,0.4)',
                           letterSpacing: '0.5px',
                           borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
                         }}>
                      Q
                    </kbd>
                    <span className={`${walterTurncoat.className} text-white/90 text-sm`}
                          style={{
                            textShadow: '0 0 3px rgba(255,255,255,0.4)',
                            letterSpacing: '0.5px'
                          }}>
                      Translate whole sentence
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="relative group">
                  <div className="flex items-center gap-3">
                    <kbd className={`${walterTurncoat.className} flex-shrink-0 flex items-center justify-center w-10 h-10 text-white/90 text-sm bg-transparent border-[2px] border-white/70`}
                         style={{
                           textShadow: '0 0 3px rgba(255,255,255,0.4)',
                           letterSpacing: '0.5px',
                           borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
                         }}>
                      W
                    </kbd>
                    <span className={`${walterTurncoat.className} text-white/90 text-sm`}
                          style={{
                            textShadow: '0 0 3px rgba(255,255,255,0.4)',
                            letterSpacing: '0.5px'
                          }}>
                      Look up word on wiktionary
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="relative group">
                  <div className="flex items-center gap-3">
                    <kbd className={`${walterTurncoat.className} flex-shrink-0 flex items-center justify-center w-10 h-10 text-white/90 text-sm bg-transparent border-[2px] border-white/70`}
                         style={{
                           textShadow: '0 0 3px rgba(255,255,255,0.4)',
                           letterSpacing: '0.5px',
                           borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
                         }}>
                      E
                    </kbd>
                    <span className={`${walterTurncoat.className} text-white/90 text-sm`}
                          style={{
                            textShadow: '0 0 3px rgba(255,255,255,0.4)',
                            letterSpacing: '0.5px'
                          }}>
                      Continue, exit "learning mode"
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="relative group">
                  <div className="flex items-center gap-3">
                    <kbd className={`${walterTurncoat.className} flex-shrink-0 flex items-center justify-center w-10 h-10 text-white/90 text-sm bg-transparent border-[2px] border-white/70`}
                         style={{
                           textShadow: '0 0 3px rgba(255,255,255,0.4)',
                           letterSpacing: '0.5px',
                           borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
                         }}>
                      R
                    </kbd>
                    <span className={`${walterTurncoat.className} text-white/90 text-sm`}
                          style={{
                            textShadow: '0 0 3px rgba(255,255,255,0.4)',
                            letterSpacing: '0.5px'
                          }}>
                      Phrase detection
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </>
            ) : (
              <>
                <div className="relative group">
                  <div className="flex items-center gap-3">
                    <kbd className={`${walterTurncoat.className} flex-shrink-0 flex items-center justify-center w-10 h-10 text-white/90 text-sm bg-transparent border-[2px] border-white/70`}
                         style={{
                           textShadow: '0 0 3px rgba(255,255,255,0.4)',
                           letterSpacing: '0.5px',
                           borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
                         }}>
                      E
                    </kbd>
                    <span className={`${walterTurncoat.className} text-white/90 text-sm`}
                          style={{
                            textShadow: '0 0 3px rgba(255,255,255,0.4)',
                            letterSpacing: '0.5px'
                          }}>
                      I know this word
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="relative group">
                  <div className="flex items-start gap-3">
                    <kbd className={`${walterTurncoat.className} flex-shrink-0 flex items-center justify-center w-10 h-10 text-white/90 text-sm bg-transparent border-[2px] border-white/70`}
                         style={{
                           textShadow: '0 0 3px rgba(255,255,255,0.4)',
                           letterSpacing: '0.5px',
                           borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
                         }}>
                      Q
                    </kbd>
                    <span className={`${walterTurncoat.className} text-white/90 text-sm`}
                          style={{
                            textShadow: '0 0 3px rgba(255,255,255,0.4)',
                            letterSpacing: '0.5px'
                          }}>
                      Show me the translation
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 