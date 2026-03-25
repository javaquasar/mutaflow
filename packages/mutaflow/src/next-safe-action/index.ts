import { createFlow } from "../core/createFlow.js";
import {
  createNextSafeActionAdapter,
  isNextSafeActionError,
  NextSafeActionError,
} from "../next/adapters.js";
import type {
  FlowConfig,
  FlowDefinition,
  NextSafeActionAdapterOptions,
  NextSafeActionErrorKind,
  NextSafeActionLike,
  NextSafeActionResult,
} from "../types.js";

export type NextSafeActionFlowConfig<TInput, TResult> = Omit<FlowConfig<TInput, TResult>, "action"> & {
  action: NextSafeActionLike<TInput, TResult>;
  adapter?: NextSafeActionAdapterOptions;
};

export type NextSafeActionHandlerOptions = NextSafeActionAdapterOptions;

export function nextSafeAction<TInput, TResult>(
  action: NextSafeActionLike<TInput, TResult>,
  options: NextSafeActionHandlerOptions = {},
) {
  return createNextSafeActionAdapter(action, options);
}

export function createNextSafeActionFlow<TInput, TResult>(
  config: NextSafeActionFlowConfig<TInput, TResult>,
): FlowDefinition<TInput, TResult> {
  const { action, adapter, ...rest } = config;
  return createFlow({
    ...rest,
    action: createNextSafeActionAdapter(action, adapter),
  });
}

export function unwrapNextSafeActionResult<TResult>(
  result: NextSafeActionResult<TResult>,
): TResult {
  if (result.serverError) {
    throw new NextSafeActionError("next-safe-action server error", result, "server");
  }

  if (result.validationErrors) {
    throw new NextSafeActionError("next-safe-action validation error", result, "validation");
  }

  if (typeof result.data === "undefined") {
    throw new NextSafeActionError("next-safe-action returned no data", result, "missing-data");
  }

  return result.data;
}

export function getNextSafeActionErrorKind(error: unknown): NextSafeActionErrorKind | null {
  return isNextSafeActionError(error) ? error.kind : null;
}

export {
  createNextSafeActionAdapter,
  isNextSafeActionError,
  NextSafeActionError,
};
