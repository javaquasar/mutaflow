export {
  createNextSafeActionAdapter,
  createServerActionAdapter,
  isNextSafeActionError,
  NextSafeActionError,
} from "./adapters.js";

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

export const tags = createBuilder("tag");
export const paths = createBuilder("path");

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
