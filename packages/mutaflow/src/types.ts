export type FlowStage =
  | "idle"
  | "optimistic"
  | "running"
  | "success"
  | "error"
  | "rolled_back";

export type InvalidateEntry =
  | { kind: "tag"; value: string }
  | { kind: "path"; value: string };

export type SuccessContext<TInput, TResult> = {
  input: TInput;
  result: TResult;
};

export type ErrorContext<TInput> = {
  input: TInput;
  error: unknown;
};

export type OptimisticConfig<TInput, TResult> = {
  target?: string;
  apply?: (current: unknown, input: TInput) => unknown;
  rollback?: (current: unknown, input: TInput, error: unknown) => unknown;
  onSuccess?: (current: unknown, result: TResult, input: TInput) => unknown;
};

export type ReconcileConfig<TResult> = {
  target?: string;
  onSuccess?: (current: unknown, result: TResult) => unknown;
};

export type FlowConfig<TInput, TResult> = {
  action: (input: TInput) => Promise<TResult>;
  optimistic?: OptimisticConfig<TInput, TResult>;
  reconcile?: ReconcileConfig<TResult>;
  invalidate?: InvalidateEntry[] | ((ctx: SuccessContext<TInput, TResult>) => InvalidateEntry[]);
  redirect?: string | ((ctx: SuccessContext<TInput, TResult>) => string | void);
  onSuccess?: (ctx: SuccessContext<TInput, TResult>) => void | Promise<void>;
  onError?: (ctx: ErrorContext<TInput>) => void | Promise<void>;
};

export type FlowDefinition<TInput, TResult> = {
  kind: "mutaflow.flow";
  config: FlowConfig<TInput, TResult>;
};

export type FlowRunResult<TResult> = {
  data?: TResult;
  error?: unknown;
  invalidations?: InvalidateEntry[];
  redirectTo?: string;
};

export type UseFlowResult<TInput, TResult> = {
  run: (input: TInput) => Promise<FlowRunResult<TResult>>;
  pending: boolean;
  stage: FlowStage;
  error: unknown;
  lastResult: TResult | null;
  reset: () => void;
  flow: FlowDefinition<TInput, TResult>;
};
