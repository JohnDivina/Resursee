declare module 'jstat' {
  export const jStat: {
    // Descriptive
    mean: (arr: number[]) => number;
    median: (arr: number[]) => number;
    mode: (arr: number[]) => number | number[];
    variance: (arr: number[], isSample?: boolean) => number;
    stdev: (arr: number[], isSample?: boolean) => number;
    min: (arr: number[]) => number;
    max: (arr: number[]) => number;
    quartiles: (arr: number[]) => [number, number, number];
    percentile: (arr: number[], k: number) => number;
    skewness: (arr: number[]) => number;
    kurtosis: (arr: number[]) => number;
    corrcoeff: (arr1: number[], arr2: number[]) => number;
    covariance: (arr1: number[], arr2: number[]) => number;
    
    // Distributions & Tests
    normal: {
      pdf: (x: number, mean: number, std: number) => number;
      cdf: (x: number, mean: number, std: number) => number;
      inv: (p: number, mean: number, std: number) => number;
    };
    studentt: {
      pdf: (x: number, df: number) => number;
      cdf: (x: number, df: number) => number;
      inv: (p: number, df: number) => number;
    };
    centralF: {
      pdf: (x: number, df1: number, df2: number) => number;
      cdf: (x: number, df1: number, df2: number) => number;
      inv: (p: number, df1: number, df2: number) => number;
    };
    chisquare: {
      pdf: (x: number, df: number) => number;
      cdf: (x: number, df: number) => number;
      inv: (p: number, df: number) => number;
    };
    anovaftest: (...args: number[][]) => number;
    ttest: (value: number, array: number[], sides?: number) => number;
    pairedttest: (arr1: number[], arr2: number[]) => number;
  };
}
