import { cat } from "@/assets/data";
import { getHelper } from "@/services/crud";

export const getRandomRiddle = () => {
  const random = Math.floor(Math.random() * cat.length);
  const riddle = cat[random];
  return getHelper(`/${riddle}`);
};
