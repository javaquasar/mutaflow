import { resolveFlowAction } from "./action.js";
import type {
  FlowBaseContext,
  FlowDefinition,
  FlowMeta,
  FlowMiddleware,
  FlowRunOptions,
  FlowRunResult,
  FlowSettledHookContext,
  FlowSuccessHookContext,
  InvalidateEntry,
  MutationEvent,
} from "../types.js";

function getFlowName<TInput, TResult, TMeta extends FlowMeta>(flow: FlowDefinition<TInput, TResult, TMeta>): string {
  const action = flow.config.action;

  if (typeof action === "function") {
    return action.name || "anonymousFlow";
  }

  return action.name || action.run.name || action.kind || "anonymousFlow";
}

function createEvent<TInput, TResult, TMeta extends FlowMeta>(
  flow: FlowDefinition<TInput, TResult, TMeta>,
  event: Omit<MutationEvent, "flowName" | "timestamp">,
): MutationEvent {
  return {
    ...event,
    flowName: getFlowName(flow),
    timestamp: Date.now(),
  };
}

function resolveInvalidations<TInput, TResult, TMeta extends FlowMeta>(
  flow: FlowDefinition<TInput, TResult, TMeta>,
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

function resolveRedirect<TInput, TResult, TMeta extends FlowMeta>(
  flow: FlowDefinition<TInput, TResult, TMeta>,
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

function mergeMeta<TMeta extends FlowMeta>(
  flowMeta: TMeta | undefined,
  runMeta: Record<string, unknown> | undefined,
): TMeta {
  return {
    ...(flowMeta ?? {}),
    ...(runMeta ?? {}),
  } as TMeta;
}

async function runWithMiddleware<TInput, TResult, TMeta extends FlowMeta>(
  middleware: FlowMiddleware<TInput, TResult, TMeta>[],
  context: FlowBaseContext<TInput, TResult, TMeta>,
  action: () => Promise<TResult>,
): Promise<TResult> {
  let index = -1;

  async function dispatch(currentIndex: number): Promise<TResult> {
    if (currentIndex <= index) {
      throw new Error("Mutaflow middleware cannot call next() multiple times.");
    }

    index = currentIndex;
    const current = middleware[currentIndex];

    if (!current) {
      return action();
    }

    return current(context, () => dispatch(currentIndex + 1));
  }

  return dispatch(0);
}

export async function runFlow<TInput, TResult, TMeta extends FlowMeta = FlowMeta>(
  flow: FlowDefinition<TInput, TResult, TMeta>,
  input: TInput,
  options: FlowRunOptions<TMeta> = {},
): Promise<FlowRunResult<TResult, TMeta>> {
  const action = resolveFlowAction(flow.config.action);
  const { store, events, signal, retries = 0 } = options;
  const flowId = options.flowId ?? createFlowId();
  const optimisticTarget = flow.config.optimistic?.target;
  const reconcileTarget = flow.config.reconcile?.target;
  const shouldApplyOptimistic = Boolean(
    store && optimisticTarget && flow.config.optimistic?.apply,
  );
  const controller = new AbortController();
  const meta = mergeMeta(flow.config.meta, options.meta);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  let optimisticSnapshot: unknown;
  let attempts = 0;

  const initialContext: FlowBaseContext<TInput, TResult, TMeta> = {
    flow,
    input,
    flowId,
    attempt: 1,
    signal: controller.signal,
    meta,
  };

  if (flow.config.beforeRun) {
    await flow.config.beforeRun(initialContext);
  }

  events?.emit(createEvent(flow, {
    type: "flow:start",
    flowId,
    attempt: 1,
    stage: "running",
    meta,
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
      meta,
      input,
      target: optimisticTarget,
    }));
  }

  while (attempts <= retries) {
    attempts += 1;

    const attemptContext: FlowBaseContext<TInput, TResult, TMeta> = {
      flow,
      input,
      flowId,
      attempt: attempts,
      signal: controller.signal,
      meta,
    };

    try {
      if (controller.signal.aborted) {
        throw createAbortError();
      }

      const result = await runWithMiddleware(
        flow.config.middleware ?? [],
        attemptContext,
        () => action(input, {
          flowId,
          attempt: attempts,
          signal: controller.signal,
        }),
      );
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
          meta,
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
          meta,
          input,
          result,
          target: optimisticTarget,
        }));
      }

      await flow.config.onSuccess?.({ input, result });

      const successContext: FlowSuccessHookContext<TInput, TResult, TMeta> = {
        ...attemptContext,
        result,
        invalidations,
        redirectTo,
      };

      await flow.config.afterSuccess?.(successContext);

      events?.emit(createEvent(flow, {
        type: "flow:success",
        flowId,
        attempt: attempts,
        stage: "success",
        meta,
        input,
        result,
        target: reconcileTarget ?? optimisticTarget,
        invalidations,
        redirectTo,
      }));

      const settledContext: FlowSettledHookContext<TInput, TResult, TMeta> = {
        ...attemptContext,
        result,
        cancelled: false,
        invalidations,
        redirectTo,
      };

      await flow.config.onSettled?.(settledContext);

      return {
        flowId,
        attempts,
        cancelled: false,
        data: result,
        invalidations,
        redirectTo,
        optimisticTarget,
        meta,
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
          meta,
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
          meta,
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
          meta,
          input,
          error: caughtError,
          target: optimisticTarget,
        }));
      }

      await flow.config.onError?.({ input, error: caughtError });
      await flow.config.afterError?.({
        ...attemptContext,
        error: caughtError,
        cancelled,
      });

      if (!cancelled) {
        events?.emit(createEvent(flow, {
          type: "flow:error",
          flowId,
          attempt: attempts,
          stage: flow.config.optimistic ? "rolled_back" : "error",
          meta,
          input,
          error: caughtError,
          target: optimisticTarget,
        }));
      }

      await flow.config.onSettled?.({
        ...attemptContext,
        error: caughtError,
        cancelled,
      });

      return {
        flowId,
        attempts,
        cancelled,
        error: caughtError,
        optimisticTarget,
        meta,
      };
    }
  }

  return {
    flowId,
    attempts,
    cancelled: false,
    optimisticTarget,
    meta,
  };
}

