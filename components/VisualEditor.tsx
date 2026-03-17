

import React, { useCallback, memo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  NodeProps,
  MarkerType,
} from 'reactflow';

import { CardData, Choice } from '../types';

// Helper to convert deck data to React Flow nodes and edges
const cardsToFlow = (cards: Omit<CardData, 'id'>[]) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    cards.forEach((card, index) => {
        // Simple grid layout
        nodes.push({
            id: `${index}`,
            type: 'cardNode',
            data: { index, card },
            position: { x: (index % 4) * 350, y: Math.floor(index / 4) * 200 },
        });

        const addEdgeForChoice = (choice: Choice, sourceHandle: string) => {
            if (typeof choice.nextCardIndex === 'number' && choice.nextCardIndex < cards.length) {
                edges.push({
                    id: `e-${index}-${choice.nextCardIndex}-${sourceHandle}`,
                    source: `${index}`,
                    target: `${choice.nextCardIndex}`,
                    sourceHandle,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                });
            }
        };

        addEdgeForChoice(card.leftChoice, 'left');
        addEdgeForChoice(card.rightChoice, 'right');
    });

    return { nodes, edges };
};

const CardNodeComponent: React.FC<NodeProps<{ index: number; card: Omit<CardData, 'id'> }>> = ({ data }) => {
    const { index, card } = data;
    return (
        <div className={`w-80 rounded-lg border-2 bg-slate-800 ${index === 0 ? 'border-cyber-pink' : 'border-gray-700'}`}>
            <div className={`p-2 rounded-t-md ${index === 0 ? 'bg-cyber-pink/20' : 'bg-black/20'}`}>
                <p className="text-xs text-gray-400">CARD #{index}</p>
                <p className="text-white truncate">{card.prompt}</p>
            </div>
            <div className="p-2 text-xs grid grid-cols-2 gap-2">
                <div className="text-left">
                    <p className="font-bold text-gray-400">Left Choice</p>
                    <p className="truncate">{card.leftChoice.text}</p>
                </div>
                 <div className="text-right">
                    <p className="font-bold text-gray-400">Right Choice</p>
                    <p className="truncate">{card.rightChoice.text}</p>
                </div>
            </div>
            <Handle type="target" position={Position.Top} id="a" />
            <Handle type="source" position={Position.Left} id="left" style={{left: '25%'}}/>
            <Handle type="source" position={Position.Right} id="right" style={{left: '75%'}} />
        </div>
    );
};

const nodeTypes = {
  cardNode: memo(CardNodeComponent),
};

interface VisualEditorProps {
    cards: Omit<CardData, 'id'>[];
    onCardsChange: (newCards: Omit<CardData, 'id'>[]) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ cards, onCardsChange }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        const { nodes: newNodes, edges: newEdges } = cardsToFlow(cards);
        setNodes(newNodes);
        setEdges(newEdges);
    }, [cards, setNodes, setEdges]);


    const onConnect = useCallback((params: Connection) => {
        const { source, sourceHandle, target } = params;
        if (!source || !target || !sourceHandle) return;

        const sourceIndex = parseInt(source, 10);
        const targetIndex = parseInt(target, 10);
        
        const newCards = [...cards];
        const sourceCard = newCards[sourceIndex];
        if (!sourceCard) return;

        if (sourceHandle === 'left') {
            sourceCard.leftChoice.nextCardIndex = targetIndex;
        } else if (sourceHandle === 'right') {
            sourceCard.rightChoice.nextCardIndex = targetIndex;
        }
        
        onCardsChange(newCards);
    }, [cards, onCardsChange]);

    const handleEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
         const newCards = [...cards];
         edgesToDelete.forEach(edge => {
             const { source, sourceHandle } = edge;
             if (!source || !sourceHandle) return;

             const sourceIndex = parseInt(source, 10);
             const sourceCard = newCards[sourceIndex];
             if (!sourceCard) return;

             if (sourceHandle === 'left') {
                 delete sourceCard.leftChoice.nextCardIndex;
             } else if (sourceHandle === 'right') {
                 delete sourceCard.rightChoice.nextCardIndex;
             }
         });
         onCardsChange(newCards);
    }, [cards, onCardsChange]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgesDelete={handleEdgesDelete}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-900"
        >
            <Controls />
            <MiniMap nodeColor={(node: Node) => node.data.index === 0 ? '#ff52e1' : '#4b5563'} />
            <Background color="#4b5563" gap={16} />
        </ReactFlow>
    );
};
