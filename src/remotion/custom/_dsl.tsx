// _dsl.tsx — 원칙 B adapter. TSX 안에서 DSL 노드를 React 컴포넌트처럼 import 가능.
// 74 노드 자산 보존 + JSX 자유도 동시 확보.
//
// 사용 예:
//   import { D } from "./_dsl";
//   <div style={{position:"absolute", top:180, left:160}}>
//     <D type="ImpactStat" data={{value: 75000, suffix:"+", label:"GitHub stars"}} frame={frame} durationFrames={dur} />
//   </div>
import React from "react";
import type { StackNode } from "@/types/stack-nodes";
import { NODE_REGISTRY } from "../nodes/registry";

let _id = 0;

interface DProps {
  type: string;
  data?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  style?: Record<string, unknown>;
  motion?: Record<string, unknown>;
  frame: number;
  durationFrames: number;
}

export const D: React.FC<DProps> = ({ type, data, layout, style, motion, frame, durationFrames }) => {
  const Comp = NODE_REGISTRY[type];
  if (!Comp) {
    return <span style={{ color: "#ff4444", fontSize: 14, fontFamily: "monospace" }}>DSL node not found: {type}</span>;
  }
  const id = `dsl-${type}-${_id++}`;
  const node = { id, type, data, layout, style, motion } as unknown as StackNode;
  return <Comp node={node} frame={frame} durationFrames={durationFrames} />;
};
