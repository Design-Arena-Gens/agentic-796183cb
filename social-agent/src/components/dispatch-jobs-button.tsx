'use client';

import { useState, useTransition } from "react";
import { dispatchJobsAction } from "@/app/actions/trend-actions";

export function DispatchJobsButton() {
  const [isPending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleDispatch = () => {
    startTransition(async () => {
      const processed = await dispatchJobsAction();
      setLastResult(processed);
    });
  };

  return (
    <div className="stack-sm">
      <button className="button" onClick={handleDispatch} disabled={isPending}>
        {isPending ? "Dispatching..." : "Run Due Jobs"}
      </button>
      {lastResult !== null && (
        <span className="muted">
          Processed {lastResult} job{lastResult === 1 ? "" : "s"} in the latest batch.
        </span>
      )}
    </div>
  );
}
