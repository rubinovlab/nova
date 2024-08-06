export interface Filter {
  line: number;
  phenotype: string[];
  grex: string[];
  correction: string;
}

export interface GrexVol {
  grexes: number[];
  volumes: number[];
}
