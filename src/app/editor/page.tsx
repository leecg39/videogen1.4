"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useEditorStore } from "@/stores/editor-store";
import { EditorLayout } from "@/components/editor/EditorLayout";

function EditorPageInner() {
  const searchParams = useSearchParams();
  const projectId =
    searchParams.get("projectId") ??
    (typeof window !== "undefined"
      ? localStorage.getItem("currentProjectId")
      : null) ??
    null;

  const { loadScenes, isLoading } = useEditorStore();

  useEffect(() => {
    if (projectId) {
      loadScenes(projectId);
    }
  }, [projectId, loadScenes]);

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/50">
        projectId가 필요합니다. ?projectId=rag3 형태로 접속해주세요.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/50">
        불러오는 중...
      </div>
    );
  }

  return <EditorLayout />;
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/50">불러오는 중...</div>}>
      <EditorPageInner />
    </Suspense>
  );
}
