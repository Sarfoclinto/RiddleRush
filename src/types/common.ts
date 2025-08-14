type Category = "science" | "math" | "mystery" | "funny" | "logic" | "who-am-i";

export interface Riddle {
  riddle: string;
  answer: string;
  category: Category;
}

export type CatRiddle = Omit<Riddle, "category">;

export interface CatRiddles {
  riddlesArray: CatRiddle[];
  category: Category;
}
