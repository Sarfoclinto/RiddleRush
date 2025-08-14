import type { MutationFunction } from "@tanstack/react-query";
import type { RequestError } from "./error";

export type AddHookProps = {
  addFn: MutationFunction<unknown, unknown>;
  onSuccessFn?: (res: unknown) => void;
  title: string;
  successMsg?: string;
};

export type QueryFetchProps<TData, TError extends RequestError> = {
  queryFn: () => Promise<TData>;
  title: string;
  queryKeys: string[];
  enabled?: boolean;
  error?: TError;
};