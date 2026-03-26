import type { ConsistencyPreset, InvalidateEntry } from "../../types.js";

export type NextPathType = "page" | "layout";

export type NextCacheBindings = {
  revalidateTag?: (tag: string, profile?: string) => void | Promise<void>;
  updateTag?: (tag: string) => void | Promise<void>;
  revalidatePath?: (path: string, type?: NextPathType) => void | Promise<void>;
};

export type NextServerExecutionSummary = {
  strategy: ConsistencyPreset["strategy"];
  readYourOwnWrites: boolean;
  invalidations: InvalidateEntry[];
  updatedTags: string[];
  revalidatedTags: string[];
  revalidatedPaths: string[];
};

export type ApplyInvalidationsOptions = {
  strategy?: ConsistencyPreset["strategy"];
  readYourOwnWrites?: boolean;
  pathType?: NextPathType;
};

function dedupe(values: string[]) {
  return [...new Set(values)];
}

function splitInvalidations(invalidations: InvalidateEntry[]) {
  return {
    tags: dedupe(invalidations.filter((entry) => entry.kind === "tag").map((entry) => entry.value)),
    paths: dedupe(invalidations.filter((entry) => entry.kind === "path").map((entry) => entry.value)),
  };
}

export async function applyNextInvalidations(
  invalidations: InvalidateEntry[],
  bindings: NextCacheBindings,
  options: ApplyInvalidationsOptions = {},
): Promise<NextServerExecutionSummary> {
  const strategy = options.strategy ?? "manual";
  const readYourOwnWrites = options.readYourOwnWrites ?? strategy === "immediate";
  const { tags, paths } = splitInvalidations(invalidations);
  const updatedTags: string[] = [];
  const revalidatedTags: string[] = [];
  const revalidatedPaths: string[] = [];

  for (const tag of tags) {
    if (readYourOwnWrites && bindings.updateTag) {
      await bindings.updateTag(tag);
      updatedTags.push(tag);
      continue;
    }

    if (bindings.revalidateTag) {
      const profile = strategy === "stale-while-revalidate" ? "max" : undefined;
      await bindings.revalidateTag(tag, profile);
      revalidatedTags.push(tag);
    }
  }

  for (const path of paths) {
    if (bindings.revalidatePath) {
      await bindings.revalidatePath(path, options.pathType);
      revalidatedPaths.push(path);
    }
  }

  return {
    strategy,
    readYourOwnWrites,
    invalidations,
    updatedTags,
    revalidatedTags,
    revalidatedPaths,
  };
}

export async function applyNextServerConsistency(
  preset: ConsistencyPreset,
  bindings: NextCacheBindings,
  options: Omit<ApplyInvalidationsOptions, "strategy" | "readYourOwnWrites"> = {},
): Promise<NextServerExecutionSummary> {
  return applyNextInvalidations(preset.invalidations, bindings, {
    ...options,
    strategy: preset.strategy,
    readYourOwnWrites: preset.readYourOwnWrites,
  });
}

export function createNextServerHelpers(bindings: NextCacheBindings) {
  return {
    applyConsistency(
      preset: ConsistencyPreset,
      options: Omit<ApplyInvalidationsOptions, "strategy" | "readYourOwnWrites"> = {},
    ) {
      return applyNextServerConsistency(preset, bindings, options);
    },
    applyInvalidations(
      invalidations: InvalidateEntry[],
      options: ApplyInvalidationsOptions = {},
    ) {
      return applyNextInvalidations(invalidations, bindings, options);
    },
  };
}
