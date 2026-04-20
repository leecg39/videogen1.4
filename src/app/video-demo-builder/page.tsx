"use client";

import { Suspense } from "react";
import { VideoDemoBuilder } from "@/components/demo-builder/VideoDemoBuilder";

export default function VideoDemoBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/50">
          불러오는 중...
        </div>
      }
    >
      <VideoDemoBuilder />
    </Suspense>
  );
}
