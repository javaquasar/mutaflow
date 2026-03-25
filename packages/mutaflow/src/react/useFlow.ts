import { useRef, useState } from "react";

import { runFlow } from "../core/runFlow.js";
import type {
  FlowDefinition,
  FlowMeta,
  FlowStage,
  UseFlowOptions,
  UseFlowResult,
  UseFlowRunOptions,
} from "../types.js";

function defaultFlowId() {
  return `flow_${Math.random().toString(36).slice(2, 10)}`;
}

export function useFlow<TInput, TResult, TMeta extends FlowMeta = FlowMeta>(
  flow: FlowDefinition<TInput, TResult, TMeta>,
  options: UseFlowOptions<TMeta> = {},
): UseFlowResult<TInput, TResult, TMeta> {
  const controllersRef = useRef(new Map<string, AbortController>());
  const [stage, setStage] = useState<FlowStage>("idle");
  const [error, setError] = useState<unknown>(null);
  const [lastResult, setLastResult] = useState<TResult | null>(null);
  const [activeFlowIds, setActiveFlowIds] = useState<string[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);

  function removeFlow(flowId: string) {
    controllersRef.current.delete(flowId);
    setActiveFlowIds((current) => current.filter((id) => id !== flowId));
  }

  async function run(input: TInput, runOptions: UseFlowRunOptions<TMeta> = {}) {
    setError(null);

    const flowId = runOptions.flowId ?? options.generateFlowId?.() ?? defaultFlowId();
    const controller = new AbortController();
    controllersRef.current.set(flowId, controller);
    setActiveFlowIds((current) => [...current, flowId]);
    setCurrentFlowId(flowId);

    if (flow.config.optimistic) {
      setStage("optimistic");
    }

    setStage("running");

    const result = await runFlow(flow, input, {
      ...options,
      flowId,
      retries: runOptions.retries ?? options.retries,
      signal: controller.signal,
      meta: runOptions.meta ?? options.meta,
    });

    removeFlow(flowId);

    if (result.cancelled) {
      setError(result.error ?? null);
      setStage("cancelled");
      return result;
    }

    if (result.error) {
      setError(result.error);
      setStage(flow.config.optimistic ? "rolled_back" : "error");
      return result;
    }

    setLastResult(result.data ?? null);
    setStage("success");

    return result;
  }

  function cancel(flowId?: string) {
    const targetFlowId = flowId ?? currentFlowId;

    if (!targetFlowId) {
      return;
    }

    const controller = controllersRef.current.get(targetFlowId);
    controller?.abort();
  }

  function cancelAll() {
    for (const controller of controllersRef.current.values()) {
      controller.abort();
    }
  }

  function reset() {
    setStage("idle");
    setError(null);
    setLastResult(null);
    setCurrentFlowId(null);
    setActiveFlowIds([]);
    controllersRef.current.clear();
  }

  return {
    run,
    cancel,
    cancelAll,
    pending: activeFlowIds.length > 0,
    activeCount: activeFlowIds.length,
    activeFlowIds,
    currentFlowId,
    stage,
    error,
    lastResult,
    reset,
    flow,
  };
}
