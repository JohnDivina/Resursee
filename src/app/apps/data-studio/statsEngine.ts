import { jStat } from 'jstat';

export interface ColumnSummary {
  name: string;
  type: 'numeric' | 'string' | 'boolean' | 'date';
  count: number;
  nullCount: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdev?: number;
  variance?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  skewness?: number;
  kurtosis?: number;
}

export interface RegressionResult {
  formula: string;
  dependentVar: string;
  independentVars: string[];
  coefficients: {
    variable: string;
    estimate: number;
    stdError: number;
    tValue: number;
    pValue: number;
    significance: string;
  }[];
  residuals: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  };
  residualStdError: number;
  dfResiduals: number;
  rSquared: number;
  adjRSquared: number;
  fStatistic: number;
  dfModel: number;
  fPValue: number;
  rSummaryOutput: string;
  residualPoints: { fitted: number; residual: number }[];
}

export interface CorrelationCell {
  var1: string;
  var2: string;
  r: number;
  pValue: number;
}

export interface AnovaResult {
  variable: string;
  groupColumn: string;
  groups: { name: string; count: number; mean: number; stdev: number }[];
  dfBetween: number;
  dfWithin: number;
  ssBetween: number;
  ssWithin: number;
  msBetween: number;
  msWithin: number;
  fStat: number;
  pValue: number;
  rSummaryOutput: string;
}

export interface TTestResult {
  var1: string;
  var2: string;
  mean1: number;
  mean2: number;
  meanDiff: number;
  tStat: number;
  df: number;
  pValue: number;
  ciLower: number;
  ciUpper: number;
  type: 'two-sample' | 'paired';
  rSummaryOutput: string;
}

// Inspect column types & basic summaries
export function inspectColumns(data: Record<string, any>[]): ColumnSummary[] {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0] || {});

  return keys.map((key) => {
    let nonNullCount = 0;
    let nullCount = 0;
    const valuesSet = new Set<any>();
    const numericValues: number[] = [];
    let isNumeric = true;
    let isBoolean = true;

    for (const row of data) {
      const val = row[key];
      if (val === null || val === undefined || val === '') {
        nullCount++;
      } else {
        nonNullCount++;
        valuesSet.add(val);
        const num = Number(val);
        if (!isNaN(num) && typeof val !== 'boolean') {
          numericValues.push(num);
        } else {
          isNumeric = false;
        }
        if (typeof val !== 'boolean' && val !== 'true' && val !== 'false' && val !== true && val !== false) {
          isBoolean = false;
        }
      }
    }

    if (numericValues.length === 0) isNumeric = false;

    let colType: 'numeric' | 'string' | 'boolean' | 'date' = 'string';
    if (isBoolean) colType = 'boolean';
    else if (isNumeric) colType = 'numeric';

    const summary: ColumnSummary = {
      name: key,
      type: colType,
      count: nonNullCount,
      nullCount,
      uniqueCount: valuesSet.size,
    };

    if (colType === 'numeric' && numericValues.length > 0) {
      numericValues.sort((a, b) => a - b);
      const min = numericValues[0];
      const max = numericValues[numericValues.length - 1];
      const mean = jStat.mean(numericValues);
      const median = jStat.median(numericValues);
      const variance = numericValues.length > 1 ? jStat.variance(numericValues, true) : 0;
      const stdev = numericValues.length > 1 ? jStat.stdev(numericValues, true) : 0;
      const quartiles = jStat.quartiles(numericValues);
      const q1 = quartiles[0];
      const q3 = quartiles[2];
      const iqr = q3 - q1;
      const skewness = numericValues.length > 2 ? jStat.skewness(numericValues) : 0;
      const kurtosis = numericValues.length > 3 ? jStat.kurtosis(numericValues) : 0;

      summary.min = min;
      summary.max = max;
      summary.mean = mean;
      summary.median = median;
      summary.variance = variance;
      summary.stdev = stdev;
      summary.q1 = q1;
      summary.q3 = q3;
      summary.iqr = iqr;
      summary.skewness = skewness;
      summary.kurtosis = kurtosis;
    }

    return summary;
  });
}

// Compute correlation matrix
export function computeCorrelationMatrix(data: Record<string, any>[], numericCols: string[]): CorrelationCell[] {
  const results: CorrelationCell[] = [];
  const vectors: Record<string, number[]> = {};

  for (const col of numericCols) {
    vectors[col] = data
      .map((d) => Number(d[col]))
      .filter((n) => !isNaN(n) && n !== null && n !== undefined);
  }

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = 0; j < numericCols.length; j++) {
      const col1 = numericCols[i];
      const col2 = numericCols[j];
      const arr1 = vectors[col1];
      const arr2 = vectors[col2];

      if (col1 === col2) {
        results.push({ var1: col1, var2: col2, r: 1.0, pValue: 0 });
      } else {
        const minLen = Math.min(arr1.length, arr2.length);
        const sub1 = arr1.slice(0, minLen);
        const sub2 = arr2.slice(0, minLen);
        const r = jStat.corrcoeff(sub1, sub2);
        const cleanR = isNaN(r) ? 0 : r;
        // p-value approximation via t-distribution
        const df = minLen - 2;
        let pVal = 1;
        if (df > 0 && Math.abs(cleanR) < 1) {
          const t = cleanR * Math.sqrt(df / (1 - cleanR * cleanR));
          pVal = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
        }
        results.push({ var1: col1, var2: col2, r: cleanR, pValue: isNaN(pVal) ? 0 : pVal });
      }
    }
  }

  return results;
}

// Format significance codes matching R exactly
function getSignificanceCode(p: number): string {
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  if (p < 0.1) return '.';
  return ' ';
}

// Ordinary Least Squares (OLS) Multiple / Simple Linear Regression matching R's lm() output
export function runLinearRegression(
  data: Record<string, any>[],
  dependentVar: string,
  independentVars: string[]
): RegressionResult | null {
  if (!data || data.length === 0 || !dependentVar || independentVars.length === 0) return null;

  // Clean data pairs/tuples
  const validRows: { y: number; x: number[] }[] = [];
  for (const row of data) {
    const yVal = Number(row[dependentVar]);
    if (isNaN(yVal) || yVal === null) continue;
    const xVals: number[] = [];
    let allValid = true;
    for (const v of independentVars) {
      const xVal = Number(row[v]);
      if (isNaN(xVal) || xVal === null) {
        allValid = false;
        break;
      }
      xVals.push(xVal);
    }
    if (allValid) {
      validRows.push({ y: yVal, x: xVals });
    }
  }

  const n = validRows.length;
  const p = independentVars.length + 1; // including intercept
  if (n <= p) return null;

  // Build matrix X with intercept (column of 1s) and vector Y
  // Using pseudo-inverse or normal equations
  // For p=2 (simple linear regression) or higher:
  const X: number[][] = validRows.map((r) => [1, ...r.x]);
  const Y: number[] = validRows.map((r) => r.y);

  // X^T * X
  const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      XtX[i][j] = sum;
    }
  }

  // X^T * Y
  const XtY: number[] = Array(p).fill(0);
  for (let i = 0; i < p; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * Y[k];
    }
    XtY[i] = sum;
  }

  // Invert XtX (Gauss-Jordan elimination with partial pivoting)
  const invXtX: number[][] | null = invertMatrix(XtX);
  if (!invXtX) return null;

  // beta = (X^T * X)^(-1) * (X^T * Y)
  const beta: number[] = Array(p).fill(0);
  for (let i = 0; i < p; i++) {
    let sum = 0;
    for (let j = 0; j < p; j++) {
      sum += invXtX[i][j] * XtY[j];
    }
    beta[i] = sum;
  }

  // Residuals
  const residuals: number[] = [];
  const residualPoints: { fitted: number; residual: number }[] = [];
  let ssRes = 0;
  const yMean = jStat.mean(Y);
  let ssTot = 0;

  for (let k = 0; k < n; k++) {
    let yFitted = 0;
    for (let i = 0; i < p; i++) {
      yFitted += beta[i] * X[k][i];
    }
    const res = Y[k] - yFitted;
    residuals.push(res);
    residualPoints.push({ fitted: yFitted, residual: res });
    ssRes += res * res;
    ssTot += (Y[k] - yMean) * (Y[k] - yMean);
  }

  const dfResiduals = n - p;
  const residualVariance = ssRes / dfResiduals;
  const residualStdError = Math.sqrt(residualVariance);

  // Standard errors, t-values, p-values
  const varNames = ['(Intercept)', ...independentVars];
  const coefficients = varNames.map((name, i) => {
    const stdErr = Math.sqrt(Math.max(0, residualVariance * invXtX[i][i]));
    const tVal = stdErr > 0 ? beta[i] / stdErr : 0;
    const pVal = dfResiduals > 0 ? 2 * (1 - jStat.studentt.cdf(Math.abs(tVal), dfResiduals)) : 1;
    return {
      variable: name,
      estimate: beta[i],
      stdError: stdErr,
      tValue: tVal,
      pValue: isNaN(pVal) ? 1 : pVal,
      significance: getSignificanceCode(isNaN(pVal) ? 1 : pVal),
    };
  });

  // R-squared
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const adjRSquared = 1 - (ssRes / dfResiduals) / (ssTot / (n - 1));
  const dfModel = p - 1;
  const ssReg = ssTot - ssRes;
  const msReg = ssReg / dfModel;
  const msRes = ssRes / dfResiduals;
  const fStatistic = msRes > 0 ? msReg / msRes : 0;
  const fPValue = dfResiduals > 0 && dfModel > 0 ? 1 - jStat.centralF.cdf(fStatistic, dfModel, dfResiduals) : 1;

  // Residual quantiles
  const sortedRes = [...residuals].sort((a, b) => a - b);
  const resQuartiles = jStat.quartiles(sortedRes);

  const formula = `${dependentVar} ~ ${independentVars.join(' + ')}`;

  // Generate authentic R summary(lm) console output
  const rSummaryLines = [
    `Call:`,
    `lm(formula = ${formula}, data = df)`,
    ``,
    `Residuals:`,
    `      Min        1Q    Median        3Q       Max `,
    `  ${padNum(sortedRes[0])}  ${padNum(resQuartiles[0])}  ${padNum(jStat.median(sortedRes))}  ${padNum(resQuartiles[2])}  ${padNum(sortedRes[sortedRes.length - 1])}`,
    ``,
    `Coefficients:`,
    `             Estimate Std. Error t value Pr(>|t|)    `,
    ...coefficients.map((c) => {
      return `${c.variable.padEnd(12)} ${padNum(c.estimate)}   ${padNum(c.stdError)}  ${padNum(c.tValue, 3)}   ${formatPValue(c.pValue)} ${c.significance}`;
    }),
    `---`,
    `Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1`,
    ``,
    `Residual standard error: ${residualStdError.toFixed(4)} on ${dfResiduals} degrees of freedom`,
    `Multiple R-squared:  ${rSquared.toFixed(4)},	Adjusted R-squared:  ${adjRSquared.toFixed(4)} `,
    `F-statistic: ${fStatistic.toFixed(2)} on ${dfModel} and ${dfResiduals} DF,  p-value: ${formatPValue(fPValue)}`,
  ];

  return {
    formula,
    dependentVar,
    independentVars,
    coefficients,
    residuals: {
      min: sortedRes[0],
      q1: resQuartiles[0],
      median: jStat.median(sortedRes),
      q3: resQuartiles[2],
      max: sortedRes[sortedRes.length - 1],
    },
    residualStdError,
    dfResiduals,
    rSquared,
    adjRSquared,
    fStatistic,
    dfModel,
    fPValue: isNaN(fPValue) ? 0 : fPValue,
    rSummaryOutput: rSummaryLines.join('\n'),
    residualPoints,
  };
}

// One-way ANOVA
export function runOneWayAnova(
  data: Record<string, any>[],
  numericVar: string,
  groupVar: string
): AnovaResult | null {
  if (!data || data.length === 0 || !numericVar || !groupVar) return null;

  const groupMap = new Map<string, number[]>();
  for (const row of data) {
    const g = String(row[groupVar]);
    const num = Number(row[numericVar]);
    if (g === '' || isNaN(num) || num === null) continue;
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(num);
  }

  const groupNames = Array.from(groupMap.keys());
  if (groupNames.length < 2) return null;

  const groups = groupNames.map((name) => {
    const vals = groupMap.get(name)!;
    return {
      name,
      count: vals.length,
      mean: jStat.mean(vals),
      stdev: vals.length > 1 ? jStat.stdev(vals, true) : 0,
    };
  });

  const allVals = Array.from(groupMap.values()).flat();
  const grandMean = jStat.mean(allVals);
  const totalN = allVals.length;
  const k = groupNames.length;

  let ssBetween = 0;
  for (const g of groups) {
    ssBetween += g.count * Math.pow(g.mean - grandMean, 2);
  }

  let ssWithin = 0;
  for (const g of groupNames) {
    const vals = groupMap.get(g)!;
    const gMean = jStat.mean(vals);
    for (const v of vals) {
      ssWithin += Math.pow(v - gMean, 2);
    }
  }

  const dfBetween = k - 1;
  const dfWithin = totalN - k;
  if (dfWithin <= 0) return null;

  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const fStat = msWithin > 0 ? msBetween / msWithin : 0;
  const pValue = 1 - jStat.centralF.cdf(fStat, dfBetween, dfWithin);

  const rSummaryLines = [
    `            Df Sum Sq Mean Sq F value   Pr(>F)    `,
    `${groupVar.padEnd(11)} ${dfBetween.toString().padStart(2)} ${padNum(ssBetween, 2)}  ${padNum(msBetween, 2)}   ${fStat.toFixed(2)} ${formatPValue(pValue)} ${getSignificanceCode(pValue)}`,
    `Residuals   ${dfWithin.toString().padStart(2)} ${padNum(ssWithin, 2)}  ${padNum(msWithin, 2)}`,
    `---`,
    `Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1`,
  ];

  return {
    variable: numericVar,
    groupColumn: groupVar,
    groups,
    dfBetween,
    dfWithin,
    ssBetween,
    ssWithin,
    msBetween,
    msWithin,
    fStat,
    pValue: isNaN(pValue) ? 0 : pValue,
    rSummaryOutput: rSummaryLines.join('\n'),
  };
}

// Student's T-Test
export function runTwoSampleTTest(
  data: Record<string, any>[],
  var1: string,
  var2: string,
  type: 'two-sample' | 'paired' = 'two-sample'
): TTestResult | null {
  const vals1: number[] = [];
  const vals2: number[] = [];

  for (const row of data) {
    const v1 = Number(row[var1]);
    const v2 = Number(row[var2]);
    if (!isNaN(v1) && !isNaN(v2)) {
      vals1.push(v1);
      vals2.push(v2);
    }
  }

  if (vals1.length < 3 || vals2.length < 3) return null;

  const m1 = jStat.mean(vals1);
  const m2 = jStat.mean(vals2);
  const meanDiff = m1 - m2;
  const n1 = vals1.length;
  const n2 = vals2.length;
  const s1 = jStat.variance(vals1, true);
  const s2 = jStat.variance(vals2, true);

  let tStat = 0;
  let df = 0;

  if (type === 'paired') {
    const diffs = vals1.map((v, i) => v - vals2[i]);
    const diffMean = jStat.mean(diffs);
    const diffSd = jStat.stdev(diffs, true);
    df = n1 - 1;
    tStat = diffMean / (diffSd / Math.sqrt(n1));
  } else {
    // Welch's t-test
    const seDiff = Math.sqrt(s1 / n1 + s2 / n2);
    tStat = meanDiff / seDiff;
    const num = Math.pow(s1 / n1 + s2 / n2, 2);
    const denom = Math.pow(s1 / n1, 2) / (n1 - 1) + Math.pow(s2 / n2, 2) / (n2 - 1);
    df = denom > 0 ? num / denom : n1 + n2 - 2;
  }

  const pValue = df > 0 ? 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df)) : 1;
  const criticalT = df > 0 ? jStat.studentt.inv(0.975, df) : 1.96;
  const se = Math.abs(tStat > 0 ? meanDiff / tStat : 0);
  const ciLower = meanDiff - criticalT * se;
  const ciUpper = meanDiff + criticalT * se;

  const rSummaryLines = [
    `	Welch Two Sample t-test`,
    ``,
    `data:  ${var1} and ${var2}`,
    `t = ${tStat.toFixed(4)}, df = ${df.toFixed(2)}, p-value = ${formatPValue(pValue)}`,
    `alternative hypothesis: true difference in means is not equal to 0`,
    `95 percent confidence interval:`,
    ` ${ciLower.toFixed(6)}  ${ciUpper.toFixed(6)}`,
    `sample estimates:`,
    `mean of x  mean of y `,
    ` ${m1.toFixed(5)}   ${m2.toFixed(5)} `,
  ];

  return {
    var1,
    var2,
    mean1: m1,
    mean2: m2,
    meanDiff,
    tStat,
    df,
    pValue: isNaN(pValue) ? 0 : pValue,
    ciLower,
    ciUpper,
    type,
    rSummaryOutput: rSummaryLines.join('\n'),
  };
}

// Generate reproducible R / Tidyverse script for any transformation or chart
export function generateRScript(opts: {
  datasetName: string;
  filters?: { column: string; operator: string; value: any }[];
  mutations?: { newColumn: string; expression: string }[];
  selectCols?: string[];
  sortCol?: string;
  sortAsc?: boolean;
  chart?: {
    type: string;
    x: string;
    y?: string;
    color?: string;
    title?: string;
  };
  regression?: {
    y: string;
    x: string[];
  };
}): string {
  const lines: string[] = [
    `# ==========================================================`,
    `# Data Studio — Reproducible R Script`,
    `# Compatible with R 4.x & RStudio Desktop`,
    `# ==========================================================`,
    ``,
    `# 1. Load required modern Tidyverse libraries`,
    `library(tidyverse)`,
    ``,
    `# 2. Load dataset`,
    `# If working locally, replace with read_csv("your_file.csv")`,
    `df <- ${opts.datasetName}`,
    ``,
  ];

  const hasWrangling = (opts.filters && opts.filters.length > 0) ||
    (opts.mutations && opts.mutations.length > 0) ||
    (opts.selectCols && opts.selectCols.length > 0) ||
    opts.sortCol;

  if (hasWrangling) {
    lines.push(`# 3. Data Wrangling (dplyr pipeline)`);
    lines.push(`df_processed <- df %>%`);

    if (opts.filters && opts.filters.length > 0) {
      for (const f of opts.filters) {
        let op = '==';
        if (f.operator === '!=') op = '!=';
        else if (f.operator === '>') op = '>';
        else if (f.operator === '>=') op = '>=';
        else if (f.operator === '<') op = '<';
        else if (f.operator === '<=') op = '<=';
        else if (f.operator === 'contains') {
          lines.push(`  filter(str_detect(${f.column}, "${f.value}")) %>%`);
          continue;
        }
        const valStr = typeof f.value === 'string' && isNaN(Number(f.value)) ? `"${f.value}"` : f.value;
        lines.push(`  filter(${f.column} ${op} ${valStr}) %>%`);
      }
    }

    if (opts.mutations && opts.mutations.length > 0) {
      for (const m of opts.mutations) {
        lines.push(`  mutate(${m.newColumn} = ${m.expression}) %>%`);
      }
    }

    if (opts.selectCols && opts.selectCols.length > 0) {
      lines.push(`  select(${opts.selectCols.join(', ')}) %>%`);
    }

    if (opts.sortCol) {
      lines.push(`  arrange(${opts.sortAsc ? '' : 'desc('}${opts.sortCol}${opts.sortAsc ? '' : ')'}) %>%`);
    }

    lines.push(`  identity() # end pipe`);
    lines.push(``);
    lines.push(`glimpse(df_processed)`);
    lines.push(``);
  }

  if (opts.chart && opts.chart.x) {
    const targetDf = hasWrangling ? 'df_processed' : 'df';
    lines.push(`# 4. Visualization (ggplot2)`);
    const aesParts: string[] = [`x = ${opts.chart.x}`];
    if (opts.chart.y) aesParts.push(`y = ${opts.chart.y}`);
    if (opts.chart.color) aesParts.push(`color = ${opts.chart.color}`, `fill = ${opts.chart.color}`);

    lines.push(`p <- ggplot(${targetDf}, aes(${aesParts.join(', ')})) +`);
    if (opts.chart.type === 'scatter') {
      lines.push(`  geom_point(size = 2.5, alpha = 0.8) +`);
      lines.push(`  geom_smooth(method = "lm", se = TRUE, color = "black", linetype = "dashed") +`);
    } else if (opts.chart.type === 'bar') {
      lines.push(`  geom_col(position = "dodge", alpha = 0.9) +`);
    } else if (opts.chart.type === 'line') {
      lines.push(`  geom_line(linewidth = 1) +`);
      lines.push(`  geom_point(size = 2) +`);
    } else if (opts.chart.type === 'area') {
      lines.push(`  geom_area(alpha = 0.3) +`);
      lines.push(`  geom_line(linewidth = 1) +`);
    } else if (opts.chart.type === 'histogram') {
      lines.push(`  geom_histogram(bins = 20, color = "white", alpha = 0.8) +`);
    } else if (opts.chart.type === 'boxplot') {
      lines.push(`  geom_boxplot(alpha = 0.7, outlier.colour = "red") +`);
    }

    lines.push(`  theme_minimal() +`);
    lines.push(`  labs(`);
    lines.push(`    title = "${opts.chart.title || 'Data Studio Visualization'}",`);
    lines.push(`    subtitle = "Generated from Resursee Data Studio",`);
    lines.push(`    caption = "Source: ${opts.datasetName}"`);
    lines.push(`  )`);
    lines.push(``);
    lines.push(`print(p)`);
    lines.push(``);
  }

  if (opts.regression && opts.regression.y && opts.regression.x.length > 0) {
    const targetDf = hasWrangling ? 'df_processed' : 'df';
    lines.push(`# 5. Statistical Modeling (Ordinary Least Squares)`);
    lines.push(`model <- lm(${opts.regression.y} ~ ${opts.regression.x.join(' + ')}, data = ${targetDf})`);
    lines.push(`summary(model)`);
    lines.push(`confint(model)`);
    lines.push(``);
    lines.push(`# Diagnostic plots`);
    lines.push(`par(mfrow = c(2, 2))`);
    lines.push(`plot(model)`);
    lines.push(`par(mfrow = c(1, 1))`);
    lines.push(``);
  }

  return lines.join('\n');
}

// Helpers
function padNum(n: number | undefined, dec = 4): string {
  if (n === undefined || isNaN(n)) return '    NA';
  return (n >= 0 ? ' ' : '') + n.toFixed(dec).padStart(8);
}

function formatPValue(p: number): string {
  if (p < 2.2e-16) return '< 2.2e-16';
  if (p < 0.0001) return p.toExponential(3);
  return p.toFixed(5);
}

// Matrix inversion via Gauss-Jordan
function invertMatrix(M: number[][]): number[][] | null {
  const n = M.length;
  const A: number[][] = M.map((row) => [...row]);
  const I: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => (i === j ? 1 : 0))
  );

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    if (Math.abs(A[maxRow][i]) < 1e-12) return null; // singular

    // swap rows
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [I[i], I[maxRow]] = [I[maxRow], I[i]];

    const pivot = A[i][i];
    for (let j = 0; j < n; j++) {
      A[i][j] /= pivot;
      I[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = 0; j < n; j++) {
          A[k][j] -= factor * A[i][j];
          I[k][j] -= factor * I[i][j];
        }
      }
    }
  }

  return I;
}
