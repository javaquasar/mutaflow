import type {
  FlowActionAdapter,
  FlowActionContext,
  NextSafeActionLike,
  NextSafeActionResult,
} from "../types.js";

export class NextSafeActionError extends Error {
  constructor(
    message: string,
    public readonly details: NextSafeActionResult<unknown>,
  ) {
    super(message);
    this.name = "NextSafeActionError";
  }
}

export function createServerActionAdapter<TInput, TResult>(
  action: (input: TInput, context?: FlowActionContext) => Promise<TResult>,
): FlowActionAdapter<TInput, TResult> {
  return {
    kind: "next.server-action",
    name: action.name || "serverAction",
    run: (input, context) => action(input, context),
  };
}

export function createNextSafeActionAdapter<TInput, TResult>(
  action: NextSafeActionLike<TInput, TResult>,
): FlowActionAdapter<TInput, TResult> {
  return {
    kind: "next-safe-action",
    name: action.name || "nextSafeAction",
    async run(input) {
      const result = await action(input);

      if (result.serverError) {
        throw new NextSafeActionError("next-safe-action server error", result);
      }

      if (result.validationErrors) {
        throw new NextSafeActionError("next-safe-action validation error", result);
      }

      if (typeof result.data === "undefined") {
        throw new NextSafeActionError("next-safe-action returned no data", result);
      }

      return result.data;
    },
  };
}
