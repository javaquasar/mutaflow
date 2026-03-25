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

export type ResourceListener = () => void;

export type ResourceStore = {
  register: <TValue>(target: string, initialValue: TValue) => void;
  has: (target: string) => boolean;
  get: <TValue>(target: string) => TValue | undefined;
  set: <TValue>(target: string, value: TValue) => TValue;
  update: <TValue>(target: string, updater: (current: TValue | undefined) => TValue) => TValue;
  subscribe: (target: string, listener: ResourceListener) => () => void;
  snapshot: () => Record<string, unknown>;
};

export type MutationEventType =
  | "flow:start"
  | "flow:optimistic-applied"
  | "flow:success"
  | "flow:error"
  | "flow:rolled-back"
  | "flow:reconciled";

export type MutationEvent = {
  type: MutationEventType;
  timestamp: number;
  flowName: string;
  stage: FlowStage;
  target?: string;
  input?: unknown;
  result?: unknown;
  error?: unknown;
  invalidations?: InvalidateEntry[];
  redirectTo?: string;
};

export type MutationEventListener = () => void;

export type MutationEventStore = {
  emit: (event: MutationEvent) => void;
  getEvents: () => MutationEvent[];
  clear: () => void;
  subscribe: (listener: MutationEventListener) => () => void;
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

export type FlowRunOptions = {
  store?: ResourceStore;
  events?: MutationEventStore;
};

export type FlowRunResult<TResult> = {
  data?: TResult;
  error?: unknown;
  invalidations?: InvalidateEntry[];
  redirectTo?: string;
  optimisticTarget?: string;
};

export type UseFlowOptions = {
  store?: ResourceStore;
  events?: MutationEventStore;
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
