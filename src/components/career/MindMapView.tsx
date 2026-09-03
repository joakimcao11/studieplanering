import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import type { CareerProfile, CategorySelection } from '@/types/careerProfile';
import { careerColor } from './careerTheme';
import { allItems } from '@/hooks/useCareerProfile';

export type MapVariant = 'mindmap' | 'creative';

interface Props {
  profile: CareerProfile;
  variant: MapVariant;
  collapsed: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  onSelectWord: (categoryId: string, label: string) => void;
  onPositionsChange: (positions: Record<string, { x: number; y: number }>) => void;
}

const CenterNode = ({ data }: NodeProps) => {
  const d = data as { label: string; variant: MapVariant };
  return (
    <div
      className="rounded-full text-primary-foreground font-bold flex flex-col items-center justify-center text-center shadow-lg px-6"
      style={{
        background: 'hsl(var(--primary))',
        width: 168,
        height: 168,
        border: d.variant === 'creative' ? '3px dashed hsl(var(--accent))' : '2px solid hsl(var(--primary))',
      }}
    >
      {d.variant === 'creative' && <User className="w-7 h-7 mb-1 opacity-90" aria-hidden />}
      <span className="text-base leading-tight break-words">{d.label}</span>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};

const CategoryNode = ({ data }: NodeProps) => {
  const d = data as {
    label: string;
    color: string;
    count: number;
    collapsed: boolean;
    variant: MapVariant;
    onToggle: () => void;
  };
  return (
    <div
      className="shadow-md text-sm font-semibold flex items-center gap-2 px-3 py-2 bg-card"
      style={{
        borderRadius: d.variant === 'creative' ? 24 : 10,
        border: `2px solid ${d.color}`,
        color: d.color,
        maxWidth: 220,
      }}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <span className="break-words">{d.label}</span>
      <span className="text-xs text-muted-foreground">· {d.count}</span>
      <button
        type="button"
        onClick={d.onToggle}
        aria-label={d.collapsed ? `Expandera ${d.label}` : `Minimera ${d.label}`}
        className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"
      >
        {d.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};

const WordNode = ({ data }: NodeProps) => {
  const d = data as { label: string; color: string; variant: MapVariant; onClick: () => void };
  return (
    <button
      type="button"
      onClick={d.onClick}
      className="text-xs bg-card px-2.5 py-1.5 shadow-sm hover:shadow transition-shadow"
      style={{
        borderRadius: d.variant === 'creative' ? 999 : 8,
        border: `1px solid ${d.color}`,
        maxWidth: 190,
      }}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      {d.label}
    </button>
  );
};

const nodeTypes = { center: CenterNode, category: CategoryNode, word: WordNode };

const RADIUS: Record<CareerProfile['visualization']['layout'], number> = {
  compact: 320,
  balanced: 430,
  airy: 560,
};

export const MindMapView = ({
  profile,
  variant,
  collapsed,
  onToggleCollapse,
  onSelectWord,
  onPositionsChange,
}: Props) => {
  const active: CategorySelection[] = useMemo(
    () => profile.categories.filter((c) => allItems(c).length > 0),
    [profile.categories],
  );

  const layout = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const saved = profile.nodePositions || {};
    const pos = (id: string, x: number, y: number) => saved[id] ?? { x, y };

    nodes.push({
      id: 'center',
      type: 'center',
      position: pos('center', 0, 0),
      data: { label: profile.profileName || 'Min Karriärprofil', variant },
      draggable: true,
    });

    const n = Math.max(active.length, 1);
    const baseR = RADIUS[profile.visualization.layout];
    // Öka radien när det är många kategorier så att noder inte hamnar ovanpå varandra.
    const r = baseR + Math.max(0, n - 6) * 34;

    active.forEach((c, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const cx = Math.cos(angle) * r;
      const cy = Math.sin(angle) * r * (variant === 'creative' ? 0.92 : 0.82);
      const color = careerColor(c.colorIndex ?? i, profile.visualization.theme);
      const catId = `cat-${c.id}`;
      nodes.push({
        id: catId,
        type: 'category',
        position: pos(catId, cx, cy),
        data: {
          label: c.title,
          color,
          count: allItems(c).length,
          collapsed: !!collapsed[c.id],
          variant,
          onToggle: () => onToggleCollapse(c.id),
        },
      });
      edges.push({
        id: `e-center-${catId}`,
        source: 'center',
        target: catId,
        type: variant === 'creative' ? 'default' : 'smoothstep',
        animated: false,
        style: { stroke: color, strokeWidth: 2, strokeDasharray: variant === 'creative' ? '6 5' : undefined },
      });

      if (profile.visualization.display === 'categories' || collapsed[c.id]) return;

      const words = allItems(c);
      const spread = Math.min(words.length, 8);
      words.forEach((label, j) => {
        const offset = (j - (spread - 1) / 2) * (variant === 'creative' ? 52 : 46);
        const wr = variant === 'creative' ? 210 : 190;
        const wx = cx + Math.cos(angle) * wr;
        const wy = cy + Math.sin(angle) * wr * 0.5 + offset;
        const wid = `w-${c.id}-${j}`;
        nodes.push({
          id: wid,
          type: 'word',
          position: pos(wid, wx, wy),
          data: { label, color, variant, onClick: () => onSelectWord(c.id, label) },
        });
        edges.push({
          id: `e-${catId}-${wid}`,
          source: catId,
          target: wid,
          type: variant === 'creative' ? 'default' : 'smoothstep',
          style: { stroke: color, strokeWidth: 1, opacity: 0.6 },
        });
      });
    });

    return { nodes, edges };
  }, [active, profile, variant, collapsed, onToggleCollapse, onSelectWord]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

  useEffect(() => {
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [layout, setNodes, setEdges]);

  const handleDragStop = useCallback(() => {
    const next: Record<string, { x: number; y: number }> = {};
    nodes.forEach((nd) => {
      next[nd.id] = { x: Math.round(nd.position.x), y: Math.round(nd.position.y) };
    });
    onPositionsChange(next);
  }, [nodes, onPositionsChange]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={handleDragStop}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.15}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      <Background gap={variant === 'creative' ? 28 : 20} color="hsl(var(--border))" />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable className="!hidden md:!block" />
    </ReactFlow>
  );
};
