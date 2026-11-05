// Stub (WP-0). Error codes with their owning module; owner WP-2.

/** Shape of every error response (architecture §8.1). */
export type ApiErrorBody = {
  error: {
    code: string;
    message_key: string;
    details?: Record<string, unknown>;
  };
};
