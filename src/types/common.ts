type Category = "science" | "math" | "mystery" | "funny" | "logic" | "who-am-i";

export interface Riddle {
  riddle: string;
  answer: string;
  category: Category;
}

export type CatRiddle = Omit<Riddle, "category">;
export type StorageKeys = "playtime" | "playtimeForm"

export interface CatRiddles {
  riddlesArray: CatRiddle[];
  category: Category;
}

export interface PlaytimeForm {
  username: string;
  numberOfRiddles: number;
  category: Category;
  timeSpan: number;
}
