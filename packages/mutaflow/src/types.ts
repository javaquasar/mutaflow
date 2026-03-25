export type FlowStage =
  | "idle"
  | "optimistic"
  | "running"
  | "success"
  | "error"
  | "rolled_back"
  | "cancelled";

export type FlowMeta = Record<string, unknown>;

export type InvalidateEntry =
  | { kind: "tag"; value: string }
  | { kind: "path"; value: string };

export type ConsistencyStrategy =
  | "immediate"
  | "stale-while-revalidate"
  | "manual";

export type ConsistencyPreset = {
  strategy: ConsistencyStrategy;
  readYourOwnWrites: boolean;
  invalidations: InvalidateEntry[];
};

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
  meta?: FlowMeta;
  target?: string;
  input?: unknown;
  result?: unknown;
  error?: unknown;
  invalidations?: InvalidateEntry[];
  consistency?: ConsistencyPreset;
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

export type NextSafeActionErrorKind =
  | "server"
  | "validation"
  | "missing-data";

export type NextSafeActionLike<TInput, TResult> = (
  input: TInput,
) => Promise<NextSafeActionResult<TResult>>;

export type NextSafeActionAdapterOptions = {
  name?: string;
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

export type FlowBaseContext<TInput, TResult, TMeta extends FlowMeta = FlowMeta> = {
  flow: FlowDefinition<TInput, TResult, TMeta>;
  input: TInput;
  flowId: string;
  attempt: number;
  signal: AbortSignal;
  meta: TMeta;
};

export type FlowMiddlewareNext<TResult> = () => Promise<TResult>;

export type FlowMiddlewareContext<TInput, TResult, TMeta extends FlowMeta = FlowMeta> =
  FlowBaseContext<TInput, TResult, TMeta>;

export type FlowMiddleware<TInput, TResult, TMeta extends FlowMeta = FlowMeta> = (
  context: FlowMiddlewareContext<TInput, TResult, TMeta>,
  next: FlowMiddlewareNext<TResult>,
) => Promise<TResult>;

export type FlowSuccessHookContext<TInput, TResult, TMeta extends FlowMeta = FlowMeta> =
  FlowBaseContext<TInput, TResult, TMeta> & {
    result: TResult;
    invalidations: InvalidateEntry[];
    consistency?: ConsistencyPreset;
    redirectTo?: string;
  };

export type FlowErrorHookContext<TInput, TResult, TMeta extends FlowMeta = FlowMeta> =
  FlowBaseContext<TInput, TResult, TMeta> & {
    error: unknown;
    cancelled: boolean;
  };

export type FlowSettledHookContext<TInput, TResult, TMeta extends FlowMeta = FlowMeta> =
  FlowBaseContext<TInput, TResult, TMeta> & {
    result?: TResult;
    error?: unknown;
    cancelled: boolean;
    invalidations?: InvalidateEntry[];
    consistency?: ConsistencyPreset;
    redirectTo?: string;
  };

export type FlowConfig<TInput, TResult, TMeta extends FlowMeta = FlowMeta> = {
  action: FlowAction<TInput, TResult> | FlowActionAdapter<TInput, TResult>;
  meta?: TMeta;
  middleware?: FlowMiddleware<TInput, TResult, TMeta>[];
  optimistic?: OptimisticConfig<TInput, TResult>;
  reconcile?: ReconcileConfig<TResult>;
  invalidate?: InvalidateEntry[] | ((ctx: SuccessContext<TInput, TResult>) => InvalidateEntry[]);
  consistency?: ConsistencyPreset | ((ctx: SuccessContext<TInput, TResult>) => ConsistencyPreset);
  redirect?: string | ((ctx: SuccessContext<TInput, TResult>) => string | void);
  beforeRun?: (ctx: FlowBaseContext<TInput, TResult, TMeta>) => void | Promise<void>;
  onSuccess?: (ctx: SuccessContext<TInput, TResult>) => void | Promise<void>;
  afterSuccess?: (ctx: FlowSuccessHookContext<TInput, TResult, TMeta>) => void | Promise<void>;
  onError?: (ctx: ErrorContext<TInput>) => void | Promise<void>;
  afterError?: (ctx: FlowErrorHookContext<TInput, TResult, TMeta>) => void | Promise<void>;
  onSettled?: (ctx: FlowSettledHookContext<TInput, TResult, TMeta>) => void | Promise<void>;
};

export type FlowDefinition<TInput, TResult, TMeta extends FlowMeta = FlowMeta> = {
  kind: "mutaflow.flow";
  config: FlowConfig<TInput, TResult, TMeta>;
};

export type FlowRunOptions<TMeta extends FlowMeta = FlowMeta> = {
  store?: ResourceStore;
  events?: MutationEventStore;
  flowId?: string;
  retries?: number;
  signal?: AbortSignal;
  meta?: Partial<TMeta> & FlowMeta;
};

export type FlowRunResult<TResult, TMeta extends FlowMeta = FlowMeta> = {
  flowId: string;
  attempts: number;
  cancelled: boolean;
  data?: TResult;
  error?: unknown;
  invalidations?: InvalidateEntry[];
  consistency?: ConsistencyPreset;
  redirectTo?: string;
  optimisticTarget?: string;
  meta: TMeta;
};

export type UseFlowRunOptions<TMeta extends FlowMeta = FlowMeta> = {
  flowId?: string;
  retries?: number;
  meta?: Partial<TMeta> & FlowMeta;
};

export type UseFlowOptions<TMeta extends FlowMeta = FlowMeta> = {
  store?: ResourceStore;
  events?: MutationEventStore;
  retries?: number;
  generateFlowId?: () => string;
  meta?: Partial<TMeta> & FlowMeta;
};

export type UseFlowResult<TInput, TResult, TMeta extends FlowMeta = FlowMeta> = {
  run: (input: TInput, options?: UseFlowRunOptions<TMeta>) => Promise<FlowRunResult<TResult, TMeta>>;
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
  flow: FlowDefinition<TInput, TResult, TMeta>;
};
