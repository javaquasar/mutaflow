import { useState } from "react";

import { runFlow } from "../core/runFlow.js";
import type {
  FlowDefinition,
  FlowStage,
  UseFlowOptions,
  UseFlowResult,
} from "../types.js";

export function useFlow<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
  options: UseFlowOptions = {},
): UseFlowResult<TInput, TResult> {
  const [stage, setStage] = useState<FlowStage>("idle");
  const [error, setError] = useState<unknown>(null);
  const [lastResult, setLastResult] = useState<TResult | null>(null);

  async function run(input: TInput) {
    setError(null);

    if (flow.config.optimistic) {
      setStage("optimistic");
    }

    setStage("running");

    const result = await runFlow(flow, input, options);

    if (result.error) {
      setError(result.error);
      setStage(flow.config.optimistic ? "rolled_back" : "error");
      return result;
    }

    setLastResult(result.data ?? null);
    setStage("success");

    return result;
  }

  function reset() {
    setStage("idle");
    setError(null);
    setLastResult(null);
  }

  return {
    run,
    pending: stage === "optimistic" || stage === "running",
    stage,
    error,
    lastResult,
    reset,
    flow,
  };
}
