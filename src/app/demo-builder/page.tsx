"use client";

import { Suspense } from "react";
import { DemoBuilder } from "@/components/demo-builder/DemoBuilder";

export default function DemoBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/50">
          불러오는 중...
        </div>
      }
    >
      <DemoBuilder />
    </Suspense>
  );
}
