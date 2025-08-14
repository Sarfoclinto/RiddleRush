export const capitalize = (str: string): string => {
  // use regex
  return str.replace(/^[a-z]/, (match) => match.toUpperCase());
};
