// TSX escape hatch — scene-grammar.md Section 0 TSX 노드 렌더러.
// stack_root 의 { type: "TSX", data: { component: "scene-XX" } } 노드를 처리.
// 씬당 최대 1개 (validate-tsx-escape.js 가드).
import React from "react";
import type { NodeProps } from "@/types/stack-nodes";
import { CUSTOM_COMPONENTS } from "../custom/registry";

export const TSXEscapeRenderer: React.FC<NodeProps> = (props) => {
  const key = (props.node.data as { component?: string } | undefined)?.component;
  if (!key) {
    return (
      <div style={{ color: "#f44", fontFamily: "Inter", fontSize: 16, padding: 20 }}>
        TSX node missing data.component
      </div>
    );
  }
  const Comp = CUSTOM_COMPONENTS[key];
  if (!Comp) {
    return (
      <div style={{ color: "#f44", fontFamily: "Inter", fontSize: 16, padding: 20 }}>
        Custom component not registered: {key}
      </div>
    );
  }
  return <Comp {...props} />;
};
