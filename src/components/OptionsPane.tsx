import { Walter_Turncoat } from 'next/font/google';

const walterTurncoat = Walter_Turncoat({
  weight: '400',
  subsets: ['latin'],
});

export interface OptionsPaneProps {
  useReddit: boolean;
  autoNav: boolean;
  onUseRedditChange: (value: boolean) => void;
  onAutoNavChange: (value: boolean) => void;
}

export default function OptionsPane({
  useReddit,
  autoNav,
  onUseRedditChange,
  onAutoNavChange,
}: OptionsPaneProps) {
  return (
    <div className="mt-4">
      <div className="rounded-lg p-[6px] shadow-lg"
           style={{
             background: 'linear-gradient(45deg, #b8b8b8 0%, rgb(194, 194, 194) 25%, #b0b0b0 50%, #c8c8c8 75%, #e0e0e0 100%)',
           }}>
        {/* Whiteboard surface */}
        <div className="relative rounded-md overflow-hidden"
             style={{
               background: '#ffffff',
               boxShadow: `
                 inset 0 0 40px rgba(0,0,0,0.1)
               `,
             }}>
          <div className="p-6 relative">
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-[0.02]" 
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                   backgroundSize: '150px 150px',
                 }}>
            </div>
            
            {/* Options with expo marker effect */}
            <div className="space-y-4 relative z-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded"></div>
                <label htmlFor="useReddit" className="relative z-20 flex items-center gap-3 cursor-pointer">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <input
                      id="useReddit"
                      type="checkbox"
                      checked={useReddit}
                      onChange={(e) => onUseRedditChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`absolute inset-0 rounded-sm ${useReddit ? 'border-[black]' : ''}`}
                         style={{
                           border: '2px solid black',
                           borderTopWidth: '3px',
                           borderRightWidth: '2px',
                           borderRadius: '2px',
                           transform: 'rotate(-2deg)',
                           boxShadow: useReddit ? '0 0 2px rgba(30,136,229,0.4)' : 'none'
                         }}
                    />
                    {useReddit && (
                      <div className="text-[black] text-2xl font-bold pointer-events-none absolute" 
                           style={{ 
                             textShadow: '0 0 1px rgba(30,136,229,0.4)',
                             filter: 'blur(0.3px)',
                             transform: 'rotate(-5deg) translate(-1px, -2px)',
                             opacity: 0.9
                           }}>
                        ✗
                      </div>
                    )}
                  </div>
                  <span className={`${walterTurncoat.className} text-sm pointer-events-none`}
                        style={{
                          filter: 'blur(0.3px)',
                          color: 'black',
                          opacity: 0.9
                        }}>
                    Use Reddit Content
                  </span>
                </label>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded"></div>
                <label htmlFor="autoNav" className="relative z-20 flex items-center gap-3 cursor-pointer">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <input
                      id="autoNav"
                      type="checkbox"
                      checked={autoNav}
                      onChange={(e) => onAutoNavChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`absolute inset-0 rounded-sm ${autoNav ? 'border-[black]' : ''}`}
                         style={{
                           border: '2px solid black',
                           borderTopWidth: '3px',
                           borderRightWidth: '2px',
                           borderRadius: '2px',
                           transform: 'rotate(1deg)',
                           boxShadow: autoNav ? '0 0 2px rgba(30,136,229,0.4)' : 'none'
                         }}
                    />
                    {autoNav && (
                      <div className="text-[black] text-2xl font-bold pointer-events-none absolute" 
                           style={{ 
                             textShadow: '0 0 1px rgba(30,136,229,0.4)',
                             filter: 'blur(0.3px)',
                             transform: 'rotate(3deg) translate(-1px, -2px)',
                             opacity: 0.9
                           }}>
                        ✗
                      </div>
                    )}
                  </div>
                  <span className={`${walterTurncoat.className} text-sm pointer-events-none`}
                        style={{
                          filter: 'blur(0.3px)',
                          color: 'black',
                          opacity: 0.9
                        }}>
                    Auto Navigation
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 