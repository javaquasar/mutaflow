import type { FlowConfig, FlowDefinition } from "../types.js";

export function createFlow<TInput, TResult>(
  config: FlowConfig<TInput, TResult>,
): FlowDefinition<TInput, TResult> {
  return {
    kind: "mutaflow.flow",
    config,
  };
}
