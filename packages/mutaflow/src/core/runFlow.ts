import type {
  FlowDefinition,
  FlowRunOptions,
  FlowRunResult,
  InvalidateEntry,
  MutationEvent,
} from "../types.js";

function getFlowName<TInput, TResult>(flow: FlowDefinition<TInput, TResult>): string {
  return flow.config.action.name || "anonymousFlow";
}

function createEvent<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
  event: Omit<MutationEvent, "flowName" | "timestamp">,
): MutationEvent {
  return {
    ...event,
    flowName: getFlowName(flow),
    timestamp: Date.now(),
  };
}

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

function createFlowId() {
  return `flow_${Math.random().toString(36).slice(2, 10)}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError(): Error {
  const error = new Error("Mutation cancelled");
  error.name = "AbortError";
  return error;
}

export async function runFlow<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
  input: TInput,
  options: FlowRunOptions = {},
): Promise<FlowRunResult<TResult>> {
  const { store, events, signal, retries = 0 } = options;
  const flowId = options.flowId ?? createFlowId();
  const optimisticTarget = flow.config.optimistic?.target;
  const reconcileTarget = flow.config.reconcile?.target;
  const shouldApplyOptimistic = Boolean(
    store && optimisticTarget && flow.config.optimistic?.apply,
  );
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  let optimisticSnapshot: unknown;
  let attempts = 0;

  events?.emit(createEvent(flow, {
    type: "flow:start",
    flowId,
    attempt: 1,
    stage: "running",
    input,
    target: optimisticTarget,
  }));

  if (shouldApplyOptimistic && store && optimisticTarget) {
    optimisticSnapshot = store.get(optimisticTarget);
    store.set(
      optimisticTarget,
      flow.config.optimistic?.apply?.(optimisticSnapshot, input),
    );

    events?.emit(createEvent(flow, {
      type: "flow:optimistic-applied",
      flowId,
      attempt: 1,
      stage: "optimistic",
      input,
      target: optimisticTarget,
    }));
  }

  while (attempts <= retries) {
    attempts += 1;

    try {
      if (controller.signal.aborted) {
        throw createAbortError();
      }

      const result = await flow.config.action(input, {
        flowId,
        attempt: attempts,
        signal: controller.signal,
      });
      const invalidations = resolveInvalidations(flow, input, result);
      const redirectTo = resolveRedirect(flow, input, result);

      if (store && reconcileTarget && flow.config.reconcile?.onSuccess) {
        const current = store.get(reconcileTarget);
        store.set(reconcileTarget, flow.config.reconcile.onSuccess(current, result));

        events?.emit(createEvent(flow, {
          type: "flow:reconciled",
          flowId,
          attempt: attempts,
          stage: "success",
          input,
          result,
          target: reconcileTarget,
        }));
      } else if (store && optimisticTarget && flow.config.optimistic?.onSuccess) {
        const current = store.get(optimisticTarget);
        store.set(
          optimisticTarget,
          flow.config.optimistic.onSuccess(current, result, input),
        );

        events?.emit(createEvent(flow, {
          type: "flow:reconciled",
          flowId,
          attempt: attempts,
          stage: "success",
          input,
          result,
          target: optimisticTarget,
        }));
      }

      await flow.config.onSuccess?.({ input, result });

      events?.emit(createEvent(flow, {
        type: "flow:success",
        flowId,
        attempt: attempts,
        stage: "success",
        input,
        result,
        target: reconcileTarget ?? optimisticTarget,
        invalidations,
        redirectTo,
      }));

      return {
        flowId,
        attempts,
        cancelled: false,
        data: result,
        invalidations,
        redirectTo,
        optimisticTarget,
      };
    } catch (caughtError) {
      const cancelled = controller.signal.aborted || isAbortError(caughtError);
      const shouldRetry = !cancelled && attempts <= retries;

      if (shouldRetry) {
        events?.emit(createEvent(flow, {
          type: "flow:retrying",
          flowId,
          attempt: attempts,
          stage: "running",
          input,
          error: caughtError,
          target: optimisticTarget,
        }));
        continue;
      }

      if (store && optimisticTarget) {
        if (flow.config.optimistic?.rollback) {
          const current = store.get(optimisticTarget);
          store.set(
            optimisticTarget,
            flow.config.optimistic.rollback(current, input, caughtError),
          );
        } else if (shouldApplyOptimistic) {
          store.set(optimisticTarget, optimisticSnapshot);
        }

        events?.emit(createEvent(flow, {
          type: "flow:rolled-back",
          flowId,
          attempt: attempts,
          stage: cancelled ? "cancelled" : "rolled_back",
          input,
          error: caughtError,
          target: optimisticTarget,
        }));
      }

      if (cancelled) {
        events?.emit(createEvent(flow, {
          type: "flow:cancelled",
          flowId,
          attempt: attempts,
          stage: "cancelled",
          input,
          error: caughtError,
          target: optimisticTarget,
        }));
      }

      await flow.config.onError?.({ input, error: caughtError });

      if (!cancelled) {
        events?.emit(createEvent(flow, {
          type: "flow:error",
          flowId,
          attempt: attempts,
          stage: flow.config.optimistic ? "rolled_back" : "error",
          input,
          error: caughtError,
          target: optimisticTarget,
        }));
      }

      return {
        flowId,
        attempts,
        cancelled,
        error: caughtError,
        optimisticTarget,
      };
    }
  }

  return {
    flowId,
    attempts,
    cancelled: false,
    optimisticTarget,
  };
}
