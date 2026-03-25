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

export async function runFlow<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
  input: TInput,
  options: FlowRunOptions = {},
): Promise<FlowRunResult<TResult>> {
  const { store, events } = options;
  const optimisticTarget = flow.config.optimistic?.target;
  const reconcileTarget = flow.config.reconcile?.target;
  const shouldApplyOptimistic = Boolean(
    store && optimisticTarget && flow.config.optimistic?.apply,
  );

  let optimisticSnapshot: unknown;

  events?.emit(createEvent(flow, {
    type: "flow:start",
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
      stage: "optimistic",
      input,
      target: optimisticTarget,
    }));
  }

  try {
    const result = await flow.config.action(input);
    const invalidations = resolveInvalidations(flow, input, result);
    const redirectTo = resolveRedirect(flow, input, result);

    if (store && reconcileTarget && flow.config.reconcile?.onSuccess) {
      const current = store.get(reconcileTarget);
      store.set(reconcileTarget, flow.config.reconcile.onSuccess(current, result));

      events?.emit(createEvent(flow, {
        type: "flow:reconciled",
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
        stage: "success",
        input,
        result,
        target: optimisticTarget,
      }));
    }

    await flow.config.onSuccess?.({ input, result });

    events?.emit(createEvent(flow, {
      type: "flow:success",
      stage: "success",
      input,
      result,
      target: reconcileTarget ?? optimisticTarget,
      invalidations,
      redirectTo,
    }));

    return {
      data: result,
      invalidations,
      redirectTo,
      optimisticTarget,
    };
  } catch (caughtError) {
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
        stage: "rolled_back",
        input,
        error: caughtError,
        target: optimisticTarget,
      }));
    }

    await flow.config.onError?.({ input, error: caughtError });

    events?.emit(createEvent(flow, {
      type: "flow:error",
      stage: flow.config.optimistic ? "rolled_back" : "error",
      input,
      error: caughtError,
      target: optimisticTarget,
    }));

    return {
      error: caughtError,
      optimisticTarget,
    };
  }
}
