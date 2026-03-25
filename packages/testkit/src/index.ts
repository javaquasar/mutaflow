import {
  createMutationEventStore,
  createResourceStore,
  runFlow,
  type FlowDefinition,
  type FlowRunOptions,
  type FlowRunResult,
  type MutationEvent,
  type MutationEventStore,
  type MutationEventType,
  type ResourceStore,
} from "mutaflow";

export type MutaflowTestStore = {
  store: ResourceStore;
  events: MutationEventStore;
  getResource: <TValue>(target: string) => TValue | undefined;
  setResource: <TValue>(target: string, value: TValue) => TValue;
  snapshot: () => Record<string, unknown>;
  getEvents: () => MutationEvent[];
  clearEvents: () => void;
};

export type RunFlowAndCollectEventsResult<TResult> = {
  result: FlowRunResult<TResult>;
  store: ResourceStore;
  events: MutationEventStore;
  resourceSnapshot: Record<string, unknown>;
  eventList: MutationEvent[];
  eventTypes: MutationEventType[];
};

export function createTestStore(initialState: Record<string, unknown> = {}): MutaflowTestStore {
  const store = createResourceStore(initialState);
  const events = createMutationEventStore();

  return {
    store,
    events,
    getResource(target) {
      return store.get(target);
    },
    setResource(target, value) {
      return store.set(target, value);
    },
    snapshot() {
      return store.snapshot();
    },
    getEvents() {
      return events.getEvents();
    },
    clearEvents() {
      events.clear();
    },
  };
}

export async function runFlowAndCollectEvents<TInput, TResult>(
  flow: FlowDefinition<TInput, TResult>,
  input: TInput,
  options: (FlowRunOptions & { store?: ResourceStore; events?: MutationEventStore }) | MutaflowTestStore = {},
): Promise<RunFlowAndCollectEventsResult<TResult>> {
  const testStore = isMutaflowTestStore(options) ? options : undefined;
  const store = testStore?.store ?? options.store ?? createResourceStore();
  const events = testStore?.events ?? options.events ?? createMutationEventStore();

  const result = await runFlow(flow, input, {
    ...(!testStore ? options : {}),
    store,
    events,
  });

  const eventList = events.getEvents();

  return {
    result,
    store,
    events,
    resourceSnapshot: store.snapshot(),
    eventList,
    eventTypes: eventList.map((event) => event.type),
  };
}

export function expectEvents(
  source: MutationEvent[] | MutationEventStore | RunFlowAndCollectEventsResult<unknown> | MutaflowTestStore,
  expectedTypes: MutationEventType[],
) {
  assertDeepEqual(readEvents(source).map((event) => event.type), expectedTypes, "Expected mutation event sequence to match.");
}

export function expectResource(
  source: ResourceStore | RunFlowAndCollectEventsResult<unknown> | MutaflowTestStore | Record<string, unknown>,
  target: string,
  expected: unknown,
) {
  assertDeepEqual(readResource(source, target), expected, `Expected resource '${target}' to match.`);
}

export function expectOptimisticState(
  source: ResourceStore | RunFlowAndCollectEventsResult<unknown> | MutaflowTestStore | Record<string, unknown>,
  target: string,
  expected: unknown,
) {
  expectResource(source, target, expected);
}

export function expectRollback(
  source: RunFlowAndCollectEventsResult<unknown>,
  target: string,
  expected: unknown,
) {
  assertTruthy(source.result.error, "Expected flow result to include an error for rollback assertion.");
  expectResource(source, target, expected);
}

export function expectReconciled(
  source: RunFlowAndCollectEventsResult<unknown>,
  target: string,
  expected: unknown,
) {
  if (source.result.error) {
    throw new Error("Expected flow result to be successful for reconcile assertion.");
  }
  expectResource(source, target, expected);
}

function assertTruthy(value: unknown, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string) {
  const actualSerialized = JSON.stringify(actual);
  const expectedSerialized = JSON.stringify(expected);

  if (actualSerialized !== expectedSerialized) {
    throw new Error(`${message}\nExpected: ${expectedSerialized}\nReceived: ${actualSerialized}`);
  }
}

function isMutaflowTestStore(value: unknown): value is MutaflowTestStore {
  return Boolean(
    value
      && typeof value === "object"
      && "store" in value
      && "events" in value
      && "getResource" in value
      && "getEvents" in value,
  );
}

function isRunCollectionResult(value: unknown): value is RunFlowAndCollectEventsResult<unknown> {
  return Boolean(
    value
      && typeof value === "object"
      && "resourceSnapshot" in value
      && "eventList" in value,
  );
}

function isResourceStore(value: unknown): value is ResourceStore {
  return Boolean(
    value
      && typeof value === "object"
      && "get" in value
      && typeof (value as { get?: unknown }).get === "function",
  );
}

function readEvents(
  source: MutationEvent[] | MutationEventStore | RunFlowAndCollectEventsResult<unknown> | MutaflowTestStore,
): MutationEvent[] {
  if (Array.isArray(source)) {
    return source;
  }

  if (isRunCollectionResult(source)) {
    return source.eventList;
  }

  if (isMutaflowTestStore(source)) {
    return source.getEvents();
  }

  return source.getEvents();
}

function readResource(
  source: ResourceStore | RunFlowAndCollectEventsResult<unknown> | MutaflowTestStore | Record<string, unknown>,
  target: string,
): unknown {
  if (isRunCollectionResult(source)) {
    return source.resourceSnapshot[target];
  }

  if (isMutaflowTestStore(source)) {
    return source.getResource(target);
  }

  if (isResourceStore(source)) {
    return source.get(target);
  }

  return source[target];
}

