import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

export function getErrorStatus(
  error: FetchBaseQueryError | SerializedError | undefined,
) {
  return error && 'status' in error ? error.status : undefined;
}
