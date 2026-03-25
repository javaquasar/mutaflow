import type { InvalidateEntry } from "../types";

type BuilderKind = "tag" | "path";

type BuilderNode = {
  [key: string]: BuilderNode;
  (...parts: Array<string | number>): InvalidateEntry;
};

function createBuilder(kind: BuilderKind, segments: string[] = []): BuilderNode {
  const callable = ((...parts: Array<string | number>) => {
    const allSegments = [...segments, ...parts.map(String)];

    if (kind === "tag") {
      return {
        kind,
        value: allSegments.join("."),
      } satisfies InvalidateEntry;
    }

    return {
      kind,
      value: `/${allSegments.join("/")}`,
    } satisfies InvalidateEntry;
  }) as BuilderNode;

  return new Proxy(callable, {
    get(_, property) {
      if (typeof property !== "string") {
        return undefined;
      }

      return createBuilder(kind, [...segments, property]);
    },
  });
}

export const tags = createBuilder("tag");
export const paths = createBuilder("path");
