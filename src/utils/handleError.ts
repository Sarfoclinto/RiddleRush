import type { FieldsErros, RequestError } from "@/types/error";

export const parseApiError = (err: RequestError): string => {
  switch (err.request?.status) {
    case 422:
      return err.response.data.errors
        ? parseUnprocessableContent(err.response.data.errors)
        : err.response.data.message;
    default:
      return typeof err.response?.data === "string"
        ? err.response.data
        : (err.response?.data?.message ?? err.message);
  }
};

const parseUnprocessableContent = (errFields: FieldsErros[]): string => {
  const fields = Object.values(errFields);
  return fields.join(",");
};
