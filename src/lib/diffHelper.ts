/**
 * Fast Longest Common Subsequence (LCS) line-by-line diff calculator.
 * Zero external dependencies.
 */

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffResult {
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

export function computeLineDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  const n = oldLines.length;
  const m = newLines.length;

  // Build LCS matrix
  // For large files (>1500 lines), clamp matrix size to avoid excessive memory
  if (n * m > 1_500_000) {
    // Fallback simple line diff for very large sketches
    const fallbackLines: DiffLine[] = [];
    oldLines.forEach((l, i) => {
      fallbackLines.push({ type: 'removed', oldLineNumber: i + 1, content: l });
    });
    newLines.forEach((l, i) => {
      fallbackLines.push({ type: 'added', newLineNumber: i + 1, content: l });
    });
    return {
      lines: fallbackLines,
      additions: newLines.length,
      deletions: oldLines.length,
    };
  }

  // Create DP grid
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to extract diff sequence
  let i = n;
  let j = m;
  const reversedDiff: DiffLine[] = [];
  let additions = 0;
  let deletions = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      reversedDiff.push({
        type: 'unchanged',
        oldLineNumber: i,
        newLineNumber: j,
        content: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      reversedDiff.push({
        type: 'added',
        newLineNumber: j,
        content: newLines[j - 1],
      });
      additions++;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      reversedDiff.push({
        type: 'removed',
        oldLineNumber: i,
        content: oldLines[i - 1],
      });
      deletions++;
      i--;
    }
  }

  reversedDiff.reverse();

  return {
    lines: reversedDiff,
    additions,
    deletions,
  };
}
