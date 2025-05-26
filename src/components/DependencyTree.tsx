import { useCallback, useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { SpaCyToken } from '@/types/tokenization';
import { FC } from 'react';

interface DependencyNode {
  name: string;
  attributes?: {
    pos?: string;
    dep?: string;
  };
  children: DependencyNode[];
}

interface DependencyTreeProps {
  tokens: SpaCyToken[];
}

// Color mapping for different parts of speech
const posColors: { [key: string]: string } = {
  NOUN: '#4f46e5', // indigo
  VERB: '#059669', // emerald
  ADJ: '#0ea5e9', // sky blue
  ADV: '#8b5cf6', // violet
  ADP: '#f59e0b', // amber
  DET: '#ec4899', // pink
  PRON: '#6366f1', // indigo
  PUNCT: '#6b7280', // gray
  default: '#3b82f6', // blue
};

const getColorForPos = (pos?: string) => {
  if (!pos) return posColors.default;
  return posColors[pos] || posColors.default;
};

const DependencyTree: FC<DependencyTreeProps> = ({ tokens }) => {
  const [treeData, setTreeData] = useState<DependencyNode[]>([]);

  const buildTreeData = useCallback(() => {
    if (!tokens || tokens.length === 0) return [];

    // Create a map of tokens by their text for easy lookup
    const tokenMap = new Map<string, SpaCyToken>();
    tokens.forEach(token => {
      tokenMap.set(token.text, token);
    });

    // Find all root tokens
    const rootTokens = tokens.filter(token => token.dep === 'ROOT');
    if (rootTokens.length === 0) return [];

    // Recursive function to build the tree
    const buildNode = (token: SpaCyToken): DependencyNode => {
      const children: DependencyNode[] = [];
      
      // Get children tokens and build their subtrees
      if (token.children) {
        token.children.forEach(childText => {
          const childToken = tokenMap.get(childText);
          if (childToken) {
            children.push(buildNode(childToken));
          }
        });
      }

      return {
        name: token.text,
        attributes: {
          pos: token.pos,
          dep: token.dep
        },
        children
      };
    };

    // Build a tree for each root token
    return rootTokens.map(rootToken => buildNode(rootToken));
  }, [tokens]);

  useEffect(() => {
    const data = buildTreeData();
    setTreeData(data);
  }, [tokens, buildTreeData]);

  if (treeData.length === 0) {
    return <div>No dependency data available</div>;
  }

  // Create a container for each tree
  return (
    <div className="flex flex-col gap-6">
      {treeData.map((tree, index) => (
        <div key={index} className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-4">Sentence {index + 1}</div>
          <div style={{ width: '100%', height: '400px' }}>
            <Tree
              data={tree}
              orientation="vertical"
              pathFunc="step"
              translate={{ x: 300, y: 80 }}
              nodeSize={{ x: 150, y: 100 }}
              separation={{ siblings: 2, nonSiblings: 2.5 }}
              renderCustomNodeElement={({ nodeDatum }) => (
                <g>
                  {/* Node circle */}
                  <circle 
                    r={30} 
                    fill={getColorForPos(nodeDatum.attributes?.pos)}
                    strokeWidth={2}
                    stroke="white"
                  />
                  
                  {/* Word text */}
                  <text
                    dy="-5"
                    textAnchor="middle"
                    style={{ 
                      fill: 'black',
                      fontSize: '16px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontWeight: '300',
                      letterSpacing: '0.05em',
                      paintOrder: 'stroke',
                      stroke: 'white',
                      strokeWidth: '3px',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round'
                    }}
                  >
                    {nodeDatum.name}
                  </text>

                  {/* POS tag */}
                  {nodeDatum.attributes?.pos && (
                    <text
                      dy="15"
                      textAnchor="middle"
                      style={{ 
                        fill: 'black',
                        fontSize: '13px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: '300',
                        letterSpacing: '0.05em',
                        paintOrder: 'stroke',
                        stroke: 'white',
                        strokeWidth: '2px',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round'
                      }}
                    >
                      {nodeDatum.attributes.pos}
                    </text>
                  )}

                  {/* Dependency relation */}
                  {nodeDatum.attributes?.dep && nodeDatum.attributes.dep !== 'ROOT' && (
                    <text
                      dy="-45"
                      textAnchor="middle"
                      style={{ 
                        fill: 'black',
                        fontSize: '12px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: '300',
                        letterSpacing: '0.05em',
                        paintOrder: 'stroke',
                        stroke: 'white',
                        strokeWidth: '2px',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round'
                      }}
                    >
                      {nodeDatum.attributes.dep}
                    </text>
                  )}
                </g>
              )}
            />
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="text-sm font-medium text-gray-700 mb-2">Parts of Speech</div>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(posColors).map(([pos, color]) => (
            pos !== 'default' && (
              <div key={pos} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600">{pos}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default DependencyTree; 