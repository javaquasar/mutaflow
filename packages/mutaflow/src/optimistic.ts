import type { OptimisticConfig } from "./types";

type InsertConfig<TInput, TItem, TResult> = {
  target: string;
  item: (input: TInput) => TItem;
  position?: "start" | "end";
};

type UpdateConfig<TInput, TItem, TResult> = {
  target: string;
  match: (item: TItem, input: TInput) => boolean;
  update: (item: TItem, input: TInput) => TItem;
};

type RemoveConfig<TInput, TItem, TResult> = {
  target: string;
  match: (item: TItem, input: TInput) => boolean;
};

type ReplaceConfig<TInput, TItem, TResult> = {
  target: string;
  match: (item: TItem, input: TInput) => boolean;
  replace: (item: TItem, input: TInput) => TItem;
};

function toArray<TItem>(current: unknown): TItem[] {
  return Array.isArray(current) ? ([...current] as TItem[]) : [];
}

export const optimistic = {
  insert<TInput, TItem, TResult = unknown>(
    config: InsertConfig<TInput, TItem, TResult>,
  ): OptimisticConfig<TInput, TResult> {
    return {
      target: config.target,
      apply: (current, input) => {
        const items = toArray<TItem>(current);
        const nextItem = config.item(input);

        return config.position === "start"
          ? [nextItem, ...items]
          : [...items, nextItem];
      },
    };
  },

  update<TInput, TItem, TResult = unknown>(
    config: UpdateConfig<TInput, TItem, TResult>,
  ): OptimisticConfig<TInput, TResult> {
    return {
      target: config.target,
      apply: (current, input) =>
        toArray<TItem>(current).map((item) =>
          config.match(item, input) ? config.update(item, input) : item,
        ),
    };
  },

  remove<TInput, TItem, TResult = unknown>(
    config: RemoveConfig<TInput, TItem, TResult>,
  ): OptimisticConfig<TInput, TResult> {
    return {
      target: config.target,
      apply: (current, input) =>
        toArray<TItem>(current).filter((item) => !config.match(item, input)),
    };
  },

  replace<TInput, TItem, TResult = unknown>(
    config: ReplaceConfig<TInput, TItem, TResult>,
  ): OptimisticConfig<TInput, TResult> {
    return {
      target: config.target,
      apply: (current, input) =>
        toArray<TItem>(current).map((item) =>
          config.match(item, input) ? config.replace(item, input) : item,
        ),
    };
  },
};
