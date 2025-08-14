import { getHelper } from "@/services/crud";

export const getRiddles = ({cat,number}:{cat: string, number: string}) => {
  return getHelper(`${cat}/${number}`);
};
