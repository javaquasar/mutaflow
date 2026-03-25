import type {
  FlowDefinition,
  FlowRunOptions,
  FlowRunResult,
  InvalidateEntry,
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

export async function runFlow<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
  input: TInput,
  options: FlowRunOptions = {},
): Promise<FlowRunResult<TResult>> {
  const { store } = options;
  const optimisticTarget = flow.config.optimistic?.target;
  const reconcileTarget = flow.config.reconcile?.target;
  const shouldApplyOptimistic = Boolean(
    store && optimisticTarget && flow.config.optimistic?.apply,
  );

  let optimisticSnapshot: unknown;

  if (shouldApplyOptimistic && store && optimisticTarget) {
    optimisticSnapshot = store.get(optimisticTarget);
    store.set(
      optimisticTarget,
      flow.config.optimistic?.apply?.(optimisticSnapshot, input),
    );
  }

  try {
    const result = await flow.config.action(input);
    const invalidations = resolveInvalidations(flow, input, result);
    const redirectTo = resolveRedirect(flow, input, result);

    if (store && reconcileTarget && flow.config.reconcile?.onSuccess) {
      const current = store.get(reconcileTarget);
      store.set(reconcileTarget, flow.config.reconcile.onSuccess(current, result));
    } else if (store && optimisticTarget && flow.config.optimistic?.onSuccess) {
      const current = store.get(optimisticTarget);
      store.set(
        optimisticTarget,
        flow.config.optimistic.onSuccess(current, result, input),
      );
    }

    await flow.config.onSuccess?.({ input, result });

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
    }

    await flow.config.onError?.({ input, error: caughtError });

    return {
      error: caughtError,
      optimisticTarget,
    };
  }
}
