import createapi from "./api";

export const getHelper = async (path: string, url?: string) => {
  const { data } = await createapi(url).get(path);
  return data;
};
