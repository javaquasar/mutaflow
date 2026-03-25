import type { FlowConfig, FlowDefinition, FlowMeta } from "../types.js";

export function createFlow<TInput, TResult, TMeta extends FlowMeta = FlowMeta>(
  config: FlowConfig<TInput, TResult, TMeta>,
): FlowDefinition<TInput, TResult, TMeta> {
  return {
    kind: "mutaflow.flow",
    config,
  };
}
