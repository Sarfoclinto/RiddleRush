import type { RequestError } from "@/types/error";
import type { QueryFetchProps } from "@/types/hook";
import { parseApiError } from "@/utils/handleError";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { notification } from "antd";
import { useEffect } from "react";

const useFetch = <TData, TError extends RequestError>({
  queryFn,
  queryKeys,
  title,
  enabled = true,
}: QueryFetchProps<TData, TError>): UseQueryResult<TData, TError> => {
  const queryResult = useQuery<TData, TError>({
    queryFn: queryFn,
    queryKey: queryKeys,
    enabled: enabled,
  });

  const { isPending, error } = queryResult;

  useEffect(() => {
    if (!isPending && error) {
      console.log("error: ", error);
      notification["error"]({
        duration: 8,
        showProgress: true,
        message: parseApiError(error as RequestError),
      });
    }
  }, [error, isPending, title]);

  return queryResult;
};
export default useFetch;
