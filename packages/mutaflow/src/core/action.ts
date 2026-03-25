import type { FlowAction, FlowActionAdapter, FlowConfig } from "../types.js";

export function resolveFlowAction<TInput, TResult>(
  action: FlowConfig<TInput, TResult>["action"],
): FlowAction<TInput, TResult> {
  return typeof action === "function"
    ? action
    : action.run;
}

export function isFlowActionAdapter<TInput, TResult>(
  action: FlowConfig<TInput, TResult>["action"],
): action is FlowActionAdapter<TInput, TResult> {
  return typeof action !== "function";
}
