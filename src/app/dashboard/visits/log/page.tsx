import { Suspense } from "react";
import { VisitLogForm } from "@/components/visits/visit-log-form";

export default function LogVisitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin h-6 w-6 border-2 border-[#1B4332] border-t-transparent rounded-full" />
        </div>
      }
    >
      <VisitLogForm />
    </Suspense>
  );
}
