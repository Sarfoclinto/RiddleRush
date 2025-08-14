import { getHelper } from "@/services/crud";

export const getRandomRiddle = (cat: string) => {
  return getHelper(`/${cat}`);
};
