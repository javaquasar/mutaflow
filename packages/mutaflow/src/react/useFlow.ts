import { useState } from "react";

import type {
  FlowDefinition,
  FlowRunResult,
  FlowStage,
  InvalidateEntry,
  UseFlowResult,
} from "../types";

function resolveInvalidations<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
  input: TInput,
  result: TResult,
): InvalidateEntry[] {
  const { invalidate } = flow.config;

  if (!invalidate) {
    return [];
  }

  return typeof invalidate === "function"
    ? invalidate({ input, result })
    : invalidate;
}

function resolveRedirect<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
  input: TInput,
  result: TResult,
): string | undefined {
  const { redirect } = flow.config;

  if (!redirect) {
    return undefined;
  }

  return typeof redirect === "function"
    ? redirect({ input, result }) ?? undefined
    : redirect;
}

export function useFlow<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
): UseFlowResult<TInput, TResult> {
  const [stage, setStage] = useState<FlowStage>("idle");
  const [error, setError] = useState<unknown>(null);
  const [lastResult, setLastResult] = useState<TResult | null>(null);

  async function run(input: TInput): Promise<FlowRunResult<TResult>> {
    setError(null);

    if (flow.config.optimistic) {
      setStage("optimistic");
    }

    setStage("running");

    try {
      const result = await flow.config.action(input);
      const invalidations = resolveInvalidations(flow, input, result);
      const redirectTo = resolveRedirect(flow, input, result);

      setLastResult(result);
      setStage("success");

      await flow.config.onSuccess?.({ input, result });

      return {
        data: result,
        invalidations,
        redirectTo,
      };
    } catch (caughtError) {
      setError(caughtError);
      setStage(flow.config.optimistic ? "rolled_back" : "error");

      await flow.config.onError?.({ input, error: caughtError });

      return { error: caughtError };
    }
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
