import type { RequestError } from "@/types/error";
import type { AddHookProps } from "@/types/hook";
import { parseApiError } from "@/utils/handleError";
import { useMutation } from "@tanstack/react-query";
import { notification } from "antd";
import { useEffect } from "react";

export const useCreate = ({
  addFn,
  onSuccessFn,
  title,
  successMsg,
}: AddHookProps) => {
  const { isPending, mutate, isError, error, isSuccess } = useMutation({
    mutationFn: addFn,
    onSuccess: (res) => {
      notification["success"]({
        message: successMsg || `Added ${title} Successfully`,
        showProgress: true,
        duration: 8,
      });
      if (onSuccessFn) {
        onSuccessFn(res);
      }
    },
  });

  useEffect(() => {
    if (isError) {
      notification["error"]({
        message: parseApiError(error as RequestError),
        duration: 8,
      });
    }
  }, [isError, title, error]);

  return { isPending, isSuccess, mutate, error };
};
