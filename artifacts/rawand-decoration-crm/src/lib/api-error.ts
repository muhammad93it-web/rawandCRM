type ApiErrorShape = {
  message?: unknown;
  response?: {
    data?: {
      error?: unknown;
      message?: unknown;
    };
  };
};

export function getApiError(error: unknown): string {
  const candidate = error as ApiErrorShape;
  const message =
    candidate?.response?.data?.error ??
    candidate?.response?.data?.message ??
    candidate?.message;

  return typeof message === "string" && message.trim()
    ? message
    : "هەڵەیەک ڕوویدا";
}