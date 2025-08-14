import type { AxiosError, AxiosResponse } from "axios";

export interface FieldsErros {
  [key: string]: string;
}

interface CustomResponseData {
  message: string;
  error: string;
  errors: FieldsErros[];
}

interface CustomAxiosResponse<T = CustomResponseData> extends AxiosResponse<T> {
  data: T;
}

export interface RequestError extends AxiosError<CustomResponseData> {
  response: CustomAxiosResponse;
}

export type ErrorResponse = {
  response: {
    data: {
      message: string;
    };
  };
  message?: string;
};
