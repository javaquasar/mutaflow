import type {
  FlowActionAdapter,
  FlowActionContext,
  NextSafeActionAdapterOptions,
  NextSafeActionErrorKind,
  NextSafeActionLike,
  NextSafeActionResult,
} from "../types.js";

function getNextSafeActionErrorKind<TResult>(
  result: NextSafeActionResult<TResult>,
): NextSafeActionErrorKind {
  if (result.serverError) {
    return "server";
  }

  if (result.validationErrors) {
    return "validation";
  }

  return "missing-data";
}

function getNextSafeActionErrorMessage(kind: NextSafeActionErrorKind): string {
  switch (kind) {
    case "server":
      return "next-safe-action server error";
    case "validation":
      return "next-safe-action validation error";
    default:
      return "next-safe-action returned no data";
  }
}

export class NextSafeActionError extends Error {
  constructor(
    message: string,
    public readonly details: NextSafeActionResult<unknown>,
    public readonly kind: NextSafeActionErrorKind,
  ) {
    super(message);
    this.name = "NextSafeActionError";
  }
}

export function isNextSafeActionError(error: unknown): error is NextSafeActionError {
  return error instanceof NextSafeActionError;
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
  options: NextSafeActionAdapterOptions = {},
): FlowActionAdapter<TInput, TResult> {
  return {
    kind: "next-safe-action",
    name: options.name || action.name || "nextSafeAction",
    async run(input) {
      const result = await action(input);

      if (result.serverError || result.validationErrors || typeof result.data === "undefined") {
        const kind = getNextSafeActionErrorKind(result);
        throw new NextSafeActionError(getNextSafeActionErrorMessage(kind), result, kind);
      }

      return result.data;
    },
  };
}
