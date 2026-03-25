export type FlowStage =
  | "idle"
  | "optimistic"
  | "running"
  | "success"
  | "error"
  | "rolled_back"
  | "cancelled";

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
  | "flow:retrying"
  | "flow:success"
  | "flow:error"
  | "flow:cancelled"
  | "flow:rolled-back"
  | "flow:reconciled";

export type MutationEvent = {
  type: MutationEventType;
  timestamp: number;
  flowName: string;
  flowId: string;
  attempt: number;
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

export type FlowActionContext = {
  flowId: string;
  attempt: number;
  signal: AbortSignal;
};

export type FlowAction<TInput, TResult> = (
  input: TInput,
  context: FlowActionContext,
) => Promise<TResult>;

export type FlowActionAdapter<TInput, TResult> = {
  kind: string;
  name?: string;
  run: FlowAction<TInput, TResult>;
};

export type NextSafeActionResult<TResult> = {
  data?: TResult;
  validationErrors?: unknown;
  serverError?: unknown;
};

export type NextSafeActionLike<TInput, TResult> = (
  input: TInput,
) => Promise<NextSafeActionResult<TResult>>;

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
  action: FlowAction<TInput, TResult> | FlowActionAdapter<TInput, TResult>;
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
  flowId?: string;
  retries?: number;
  signal?: AbortSignal;
};

export type FlowRunResult<TResult> = {
  flowId: string;
  attempts: number;
  cancelled: boolean;
  data?: TResult;
  error?: unknown;
  invalidations?: InvalidateEntry[];
  redirectTo?: string;
  optimisticTarget?: string;
};

export type UseFlowRunOptions = {
  flowId?: string;
  retries?: number;
};

export type UseFlowOptions = {
  store?: ResourceStore;
  events?: MutationEventStore;
  retries?: number;
  generateFlowId?: () => string;
};

export type UseFlowResult<TInput, TResult> = {
  run: (input: TInput, options?: UseFlowRunOptions) => Promise<FlowRunResult<TResult>>;
  cancel: (flowId?: string) => void;
  cancelAll: () => void;
  pending: boolean;
  activeCount: number;
  activeFlowIds: string[];
  currentFlowId: string | null;
  stage: FlowStage;
  error: unknown;
  lastResult: TResult | null;
  reset: () => void;
  flow: FlowDefinition<TInput, TResult>;
};
