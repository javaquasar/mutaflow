export {
  createNextSafeActionAdapter,
  createServerActionAdapter,
  isNextSafeActionError,
  NextSafeActionError,
} from "./adapters.js";

import type { ConsistencyPreset, InvalidateEntry } from "../types.js";

type BuilderResult = {
  kind: "tag" | "path";
  value: string;
};

type BuilderProxy = ((...args: unknown[]) => BuilderResult) & {
  kind: "tag" | "path";
  value: string;
} & Record<string, unknown>;

export type InvalidationRegistryShape = Record<string, unknown>;

function createBuilder(kind: "tag" | "path", segments: string[] = []): BuilderProxy {
  const buildValue = (nextSegments: string[]): BuilderResult => ({
    kind,
    value: kind === "tag" ? nextSegments.join(".") : `/${nextSegments.join("/")}`,
  });

  const callable = (...args: unknown[]) => buildValue([
    ...segments,
    ...args.map((arg) => String(arg)),
  ]);

  return new Proxy(callable as BuilderProxy, {
    get(_target, property: string | symbol) {
      if (property === "value") {
        return buildValue(segments).value;
      }

      if (property === "kind") {
        return kind;
      }

      if (property === Symbol.toPrimitive) {
        return () => buildValue(segments).value;
      }

      return createBuilder(kind, [...segments, String(property)]);
    },
    apply(_target, _thisArg, args: unknown[]) {
      return buildValue([
        ...segments,
        ...args.map((arg) => String(arg)),
      ]);
    },
  });
}

function normalizeInvalidations(entries: Array<InvalidateEntry | undefined> = []): InvalidateEntry[] {
  return entries.filter((entry): entry is InvalidateEntry => Boolean(entry));
}

function createConsistencyPreset(
  strategy: ConsistencyPreset["strategy"],
  options: {
    tags?: InvalidateEntry[];
    paths?: InvalidateEntry[];
    invalidate?: InvalidateEntry[];
    readYourOwnWrites?: boolean;
  } = {},
): ConsistencyPreset {
  return {
    strategy,
    readYourOwnWrites: options.readYourOwnWrites ?? strategy === "immediate",
    invalidations: normalizeInvalidations([
      ...(options.invalidate ?? []),
      ...(options.tags ?? []),
      ...(options.paths ?? []),
    ]),
  };
}

export const tags = createBuilder("tag");
export const paths = createBuilder("path");

export const consistency = {
  immediate(options: { tags?: InvalidateEntry[]; paths?: InvalidateEntry[]; invalidate?: InvalidateEntry[] } = {}) {
    return createConsistencyPreset("immediate", {
      ...options,
      readYourOwnWrites: true,
    });
  },
  staleWhileRevalidate(options: { tags?: InvalidateEntry[]; paths?: InvalidateEntry[]; invalidate?: InvalidateEntry[] } = {}) {
    return createConsistencyPreset("stale-while-revalidate", {
      ...options,
      readYourOwnWrites: false,
    });
  },
  manual(options: { tags?: InvalidateEntry[]; paths?: InvalidateEntry[]; invalidate?: InvalidateEntry[]; readYourOwnWrites?: boolean } = {}) {
    return createConsistencyPreset("manual", options);
  },
  tags(entries: InvalidateEntry[]) {
    return createConsistencyPreset("stale-while-revalidate", {
      tags: entries,
      readYourOwnWrites: false,
    });
  },
  paths(entries: InvalidateEntry[]) {
    return createConsistencyPreset("immediate", {
      paths: entries,
      readYourOwnWrites: true,
    });
  },
};

export function defineTags<T extends InvalidationRegistryShape>(
  factory: (builder: typeof tags) => T,
): T {
  return factory(tags);
}

export function definePaths<T extends InvalidationRegistryShape>(
  factory: (builder: typeof paths) => T,
): T {
  return factory(paths);
}

export function createInvalidationRegistry<T extends InvalidationRegistryShape>(
  registry: T,
): T {
  return registry;
}
