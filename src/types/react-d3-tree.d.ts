declare module 'react-d3-tree' {
  import { FC } from 'react';

  interface TreeNodeDatum {
    name: string;
    attributes?: Record<string, any>;
    children?: TreeNodeDatum[];
  }

  interface Point {
    x: number;
    y: number;
  }

  interface Separation {
    siblings: number;
    nonSiblings: number;
  }

  interface CustomNodeElementProps {
    nodeDatum: TreeNodeDatum;
    toggleNode?: () => void;
    foreignObjectProps?: {
      width: number;
      height: number;
      x: number;
      y: number;
    };
  }

  interface ReactD3TreeProps {
    data: TreeNodeDatum | TreeNodeDatum[];
    orientation?: 'horizontal' | 'vertical';
    translate?: Point;
    pathFunc?: 'diagonal' | 'elbow' | 'straight' | 'step';
    nodeSize?: Point;
    separation?: Separation;
    zoomable?: boolean;
    draggable?: boolean;
    zoom?: number;
    renderCustomNodeElement?: FC<CustomNodeElementProps>;
    onNodeClick?: (node: TreeNodeDatum) => void;
    onUpdate?: (target: { node: TreeNodeDatum; zoom: number }) => void;
  }

  const Tree: FC<ReactD3TreeProps>;
  export default Tree;
} 