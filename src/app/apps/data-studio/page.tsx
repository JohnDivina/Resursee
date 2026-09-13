'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from '@/components/ui/sidebar';
import {
  IconTable,
  IconTerminal2,
  IconChartBar,
  IconTransform,
  IconMathFunction,
  IconDownload,
  IconCode,
  IconCopy,
  IconCheck,
  IconTrash,
  IconFilter,
  IconFileSpreadsheet,
  IconRefresh,
  IconPlus,
  IconArrowLeft,
  IconDatabase,
  IconVariable,
  IconSearch,
  IconEye,
  IconPlayerPlay,
  IconAdjustments,
  IconFileCode,
} from '@tabler/icons-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
} from 'recharts';
import { SAMPLE_DATASETS, DatasetItem } from './sampleData';
import {
  inspectColumns,
  ColumnSummary,
  runLinearRegression,
  runOneWayAnova,
  runTwoSampleTTest,
  computeCorrelationMatrix,
  generateRScript,
  RegressionResult,
  AnovaResult,
  TTestResult,
  CorrelationCell,
} from './statsEngine';

type ActiveTab = 'workspace' | 'console' | 'visualize' | 'transform' | 'statistics' | 'export';

interface FilterCondition {
  id: string;
  column: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';
  value: string;
}

interface MutateRule {
  id: string;
  newColumn: string;
  expression: string;
}

interface ConsoleEntry {
  id: string;
  command: string;
  output: string;
  type: 'output' | 'error' | 'info';
  timestamp: string;
}

export default function DataStudioPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dataset State
  const [currentDatasetName, setCurrentDatasetName] = useState<string>('iris');
  const [rawDataset, setRawDataset] = useState<Record<string, any>[]>(SAMPLE_DATASETS[0].data);
  const [fileName, setFileName] = useState<string>('iris.csv');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Wrangling Pipeline State (dplyr-style)
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [mutateRules, setMutateRules] = useState<MutateRule[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Chart State (ggplot2-style)
  const [chartType, setChartType] = useState<'scatter' | 'bar' | 'line' | 'area' | 'histogram' | 'boxplot'>('scatter');
  const [xAxisCol, setXAxisCol] = useState<string>('sepal_length');
  const [yAxisCol, setYAxisCol] = useState<string>('petal_length');
  const [colorCol, setColorCol] = useState<string>('species');
  const [chartTitle, setChartTitle] = useState<string>('Sepal vs Petal Morphology');
  const [showRScriptModal, setShowRScriptModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Statistics State (R-style lm, ANOVA, t-test)
  const [regDepVar, setRegDepVar] = useState<string>('petal_length');
  const [regIndepVars, setRegIndepVars] = useState<string[]>(['sepal_length', 'sepal_width']);
  const [anovaNumVar, setAnovaNumVar] = useState<string>('petal_length');
  const [anovaGroupVar, setAnovaGroupVar] = useState<string>('species');
  const [tTestVar1, setTTestVar1] = useState<string>('sepal_length');
  const [tTestVar2, setTTestVar2] = useState<string>('petal_length');

  // Console State (RStudio REPL)
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleHistory, setConsoleHistory] = useState<ConsoleEntry[]>([
    {
      id: 'welcome',
      command: '# R Studio Interactive Console (Data Studio)',
      output: `R version 4.4.1 (Data Studio Client-Side Engine)\nPlatform: browser-wasm-x86_64\nType 'summary(df)', 'glimpse(df)', 'cor(df)', 'names(df)', or 'help()' for commands.\nType JavaScript expressions or df manipulation code.\nDataset 'df' is loaded in memory (${SAMPLE_DATASETS[0].rows} obs. of ${SAMPLE_DATASETS[0].cols} variables).`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute column summaries
  const columnSummaries: ColumnSummary[] = useMemo(() => {
    return inspectColumns(rawDataset);
  }, [rawDataset]);

  const numericColumns = useMemo(() => {
    return columnSummaries.filter((c) => c.type === 'numeric').map((c) => c.name);
  }, [columnSummaries]);

  const categoricalColumns = useMemo(() => {
    return columnSummaries.filter((c) => c.type !== 'numeric').map((c) => c.name);
  }, [columnSummaries]);

  const allColumnNames = useMemo(() => {
    return columnSummaries.map((c) => c.name);
  }, [columnSummaries]);

  // Apply transformations (Dplyr pipeline)
  const transformedDataset = useMemo(() => {
    let data = [...rawDataset];

    // 1. Mutate
    for (const rule of mutateRules) {
      if (!rule.newColumn || !rule.expression) continue;
      data = data.map((row) => {
        try {
          // evaluate expression safely with row values
          const expr = rule.expression.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
            if (row.hasOwnProperty(match)) {
              return `Number(row['${match}'])`;
            }
            return match;
          });
          // eslint-disable-next-line no-new-func
          const func = new Function('row', `return ${expr}`);
          const res = func(row);
          return { ...row, [rule.newColumn]: isNaN(res) ? res : Number(res.toFixed(4)) };
        } catch {
          return { ...row, [rule.newColumn]: null };
        }
      });
    }

    // 2. Filter
    if (filterConditions.length > 0) {
      data = data.filter((row) => {
        return filterConditions.every((cond) => {
          const val = row[cond.column];
          if (val === undefined || val === null) return false;
          const targetNum = Number(cond.value);
          const isValNum = !isNaN(Number(val));

          switch (cond.operator) {
            case '==':
              return isValNum ? Number(val) === targetNum : String(val).toLowerCase() === cond.value.toLowerCase();
            case '!=':
              return isValNum ? Number(val) !== targetNum : String(val).toLowerCase() !== cond.value.toLowerCase();
            case '>':
              return isValNum ? Number(val) > targetNum : false;
            case '<':
              return isValNum ? Number(val) < targetNum : false;
            case '>=':
              return isValNum ? Number(val) >= targetNum : false;
            case '<=':
              return isValNum ? Number(val) <= targetNum : false;
            case 'contains':
              return String(val).toLowerCase().includes(cond.value.toLowerCase());
            default:
              return true;
          }
        });
      });
    }

    // 3. Sort
    if (sortColumn) {
      data.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAscending ? valA - valB : valB - valA;
        }
        return sortAscending
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    // 4. Select Columns
    if (selectedColumns.length > 0) {
      data = data.map((row) => {
        const newRow: Record<string, any> = {};
        for (const col of selectedColumns) {
          if (row.hasOwnProperty(col)) {
            newRow[col] = row[col];
          }
        }
        return newRow;
      });
    }

    return data;
  }, [rawDataset, filterConditions, mutateRules, sortColumn, sortAscending, selectedColumns]);

  // Display columns
  const activeColumns = useMemo(() => {
    if (selectedColumns.length > 0) return selectedColumns;
    if (transformedDataset.length > 0) return Object.keys(transformedDataset[0]);
    return allColumnNames;
  }, [selectedColumns, transformedDataset, allColumnNames]);

  // Filtered rows for search
  const searchedRows = useMemo(() => {
    if (!searchQuery.trim()) return transformedDataset;
    const q = searchQuery.toLowerCase();
    return transformedDataset.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [transformedDataset, searchQuery]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedRows.slice(start, start + pageSize);
  }, [searchedRows, currentPage]);

  const totalPages = Math.ceil(searchedRows.length / pageSize) || 1;

  // Correlation Matrix
  const correlationMatrix: CorrelationCell[] = useMemo(() => {
    if (numericColumns.length < 2) return [];
    return computeCorrelationMatrix(transformedDataset, numericColumns);
  }, [transformedDataset, numericColumns]);

  // Linear Regression Result
  const regressionResult: RegressionResult | null = useMemo(() => {
    if (!regDepVar || regIndepVars.length === 0) return null;
    return runLinearRegression(transformedDataset, regDepVar, regIndepVars);
  }, [transformedDataset, regDepVar, regIndepVars]);

  // ANOVA Result
  const anovaResult: AnovaResult | null = useMemo(() => {
    if (!anovaNumVar || !anovaGroupVar) return null;
    return runOneWayAnova(transformedDataset, anovaNumVar, anovaGroupVar);
  }, [transformedDataset, anovaNumVar, anovaGroupVar]);

  // T-Test Result
  const tTestResult: TTestResult | null = useMemo(() => {
    if (!tTestVar1 || !tTestVar2) return null;
    return runTwoSampleTTest(transformedDataset, tTestVar1, tTestVar2);
  }, [transformedDataset, tTestVar1, tTestVar2]);

  // Generate Current R Script
  const currentRScript = useMemo(() => {
    return generateRScript({
      datasetName: currentDatasetName,
      filters: filterConditions.map((f) => ({
        column: f.column,
        operator: f.operator,
        value: f.value,
      })),
      mutations: mutateRules.map((m) => ({
        newColumn: m.newColumn,
        expression: m.expression,
      })),
      selectCols: selectedColumns.length > 0 ? selectedColumns : undefined,
      sortCol: sortColumn || undefined,
      sortAsc: sortAscending,
      chart: {
        type: chartType,
        x: xAxisCol,
        y: yAxisCol,
        color: colorCol || undefined,
        title: chartTitle,
      },
      regression: {
        y: regDepVar,
        x: regIndepVars,
      },
    });
  }, [
    currentDatasetName,
    filterConditions,
    mutateRules,
    selectedColumns,
    sortColumn,
    sortAscending,
    chartType,
    xAxisCol,
    yAxisCol,
    colorCol,
    chartTitle,
    regDepVar,
    regIndepVars,
  ]);

  // Load sample dataset
  const handleLoadSample = (sample: DatasetItem) => {
    setCurrentDatasetName(sample.name);
    setFileName(sample.filename);
    setRawDataset(sample.data);
    setFilterConditions([]);
    setMutateRules([]);
    setSortColumn('');
    setSelectedColumns([]);
    setCurrentPage(1);

    // auto set chart axes if appropriate
    const cols = inspectColumns(sample.data);
    const numCols = cols.filter((c) => c.type === 'numeric').map((c) => c.name);
    const catCols = cols.filter((c) => c.type !== 'numeric').map((c) => c.name);

    if (numCols.length >= 2) {
      setXAxisCol(numCols[0]);
      setYAxisCol(numCols[1]);
      setRegDepVar(numCols[1]);
      setRegIndepVars([numCols[0]]);
      setTTestVar1(numCols[0]);
      setTTestVar2(numCols[1]);
    }
    if (catCols.length >= 1) {
      setColorCol(catCols[0]);
      setAnovaGroupVar(catCols[0]);
    }
    if (numCols.length >= 1) {
      setAnovaNumVar(numCols[0]);
    }

    setConsoleHistory((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        command: `data(${sample.name})`,
        output: `Loaded canonical R dataset '${sample.name}' (${sample.rows} obs. of ${sample.cols} variables).\nSource: ${sample.source}`,
        type: 'info',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // File Upload Handlers (CSV, XLSX, JSON)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
    setCurrentDatasetName(cleanName);

    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setRawDataset(results.data as Record<string, any>[]);
            setFilterConditions([]);
            setMutateRules([]);
            setSelectedColumns([]);
            setCurrentPage(1);
            setConsoleHistory((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                command: `read_csv("${file.name}")`,
                output: `Parsed ${results.data.length} rows × ${Object.keys(results.data[0] || {}).length} columns successfully.`,
                type: 'info',
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data && data.length > 0) {
          setRawDataset(data as Record<string, any>[]);
          setFilterConditions([]);
          setMutateRules([]);
          setSelectedColumns([]);
          setCurrentPage(1);
          setConsoleHistory((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              command: `read_excel("${file.name}", sheet = "${wsname}")`,
              output: `Imported sheet '${wsname}': ${data.length} rows × ${Object.keys(data[0] || {}).length} columns.`,
              type: 'info',
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }
      };
      reader.readAsBinaryString(file);
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          setRawDataset(arr);
          setFilterConditions([]);
          setMutateRules([]);
          setSelectedColumns([]);
          setCurrentPage(1);
          setConsoleHistory((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              command: `fromJSON("${file.name}")`,
              output: `Parsed JSON array: ${arr.length} observations.`,
              type: 'info',
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        } catch (err: any) {
          alert('Invalid JSON file format: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  // REPL Console Execution
  const handleExecuteConsole = () => {
    const cmd = consoleInput.trim();
    if (!cmd) return;

    let output = '';
    let type: 'output' | 'error' | 'info' = 'output';

    try {
      if (cmd === 'clear' || cmd === 'cls') {
        setConsoleHistory([]);
        setConsoleInput('');
        return;
      } else if (cmd === 'help()' || cmd === '?') {
        output = `Data Studio R-Console Cheatsheet:\n  summary(df)        - Descriptive statistics across all variables\n  glimpse(df)        - Data structure, types, and first few values\n  names(df)          - List column names\n  head(df, n)        - Print first n rows (default 6)\n  tail(df, n)        - Print last n rows\n  cor(df)            - Display correlation matrix of numeric columns\n  lm(y ~ x)          - Fit OLS linear regression model\n  nrow(df) / ncol(df)- Row and column counts\n  JS Expressions     - Direct JavaScript code execution against 'df'`;
        type = 'info';
      } else if (cmd === 'summary(df)' || cmd === 'summary()') {
        output = columnSummaries
          .map((col) => {
            if (col.type === 'numeric') {
              return `${col.name} (numeric):\n  Min: ${col.min?.toFixed(2)} | 1st Qu: ${col.q1?.toFixed(2)} | Median: ${col.median?.toFixed(2)}\n  Mean: ${col.mean?.toFixed(2)} | 3rd Qu: ${col.q3?.toFixed(2)} | Max: ${col.max?.toFixed(2)}\n  Std Dev: ${col.stdev?.toFixed(2)} | IQR: ${col.iqr?.toFixed(2)}`;
            }
            return `${col.name} (${col.type}):\n  Length: ${col.count} | Class: character | Mode: character | Unique: ${col.uniqueCount}`;
          })
          .join('\n\n');
      } else if (cmd === 'glimpse(df)' || cmd === 'str(df)') {
        output = `Rows: ${transformedDataset.length}\nColumns: ${activeColumns.length}\n` +
          columnSummaries
            .map((col) => {
              const samples = transformedDataset.slice(0, 4).map((r) => r[col.name]).join(', ');
              return `$ ${col.name.padEnd(16)} <${col.type}> ${samples}...`;
            })
            .join('\n');
      } else if (cmd === 'names(df)' || cmd === 'colnames(df)') {
        output = JSON.stringify(activeColumns, null, 2);
      } else if (cmd.startsWith('head(')) {
        const match = cmd.match(/head\(\s*df\s*(?:,\s*(\d+))?\s*\)/);
        const count = match && match[1] ? parseInt(match[1], 10) : 6;
        output = JSON.stringify(transformedDataset.slice(0, count), null, 2);
      } else if (cmd.startsWith('tail(')) {
        const match = cmd.match(/tail\(\s*df\s*(?:,\s*(\d+))?\s*\)/);
        const count = match && match[1] ? parseInt(match[1], 10) : 6;
        output = JSON.stringify(transformedDataset.slice(-count), null, 2);
      } else if (cmd === 'nrow(df)') {
        output = `[1] ${transformedDataset.length}`;
      } else if (cmd === 'ncol(df)') {
        output = `[1] ${activeColumns.length}`;
      } else if (cmd === 'cor(df)') {
        if (correlationMatrix.length === 0) {
          output = 'Need at least 2 numeric columns for correlation matrix.';
        } else {
          output = `Correlation Matrix (Pearson r):\n` +
            numericColumns.map((c) => c.slice(0, 10).padStart(11)).join('') + '\n' +
            numericColumns
              .map((rowCol) => {
                const vals = numericColumns.map((colCol) => {
                  const cell = correlationMatrix.find((c) => c.var1 === rowCol && c.var2 === colCol);
                  return (cell ? cell.r.toFixed(3) : 'NA').padStart(11);
                });
                return rowCol.slice(0, 10).padEnd(10) + vals.join('');
              })
              .join('\n');
        }
      } else if (cmd.startsWith('lm(')) {
        const reg = regressionResult;
        if (reg) {
          output = reg.rSummaryOutput;
        } else {
          output = 'Linear model could not be fitted. Check dependent and independent variables in Statistics tab.';
        }
      } else {
        // Evaluate JavaScript expression with sandbox context
        const df = transformedDataset;
        // eslint-disable-next-line no-new-func
        const evalFn = new Function('df', 'jStat', `return (${cmd})`);
        const result = evalFn(df, (window as any).jStat);
        output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      }
    } catch (err: any) {
      output = 'Error in command: ' + err.message;
      type = 'error';
    }

    setConsoleHistory((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        command: cmd,
        output,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setConsoleInput('');
    setHistoryIndex(-1);

    setTimeout(() => {
      consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Exports
  const handleExportCSV = () => {
    const csv = Papa.unparse(transformedDataset);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentDatasetName}_processed.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transformedDataset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentDatasetName);
    XLSX.writeFile(wb, `${currentDatasetName}_processed.xlsx`);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(transformedDataset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentDatasetName}_processed.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRScript = () => {
    const blob = new Blob([currentRScript], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentDatasetName}_analysis.R`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyRScript = () => {
    navigator.clipboard.writeText(currentRScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Sidebar Links
  const sidebarLinks = [
    {
      label: 'Workspace',
      href: '#workspace',
      icon: <IconTable className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      tab: 'workspace' as ActiveTab,
      badge: `${transformedDataset.length} rows`,
    },
    {
      label: 'Console',
      href: '#console',
      icon: <IconTerminal2 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      tab: 'console' as ActiveTab,
      badge: 'R / REPL',
    },
    {
      label: 'Visualize',
      href: '#visualize',
      icon: <IconChartBar className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      tab: 'visualize' as ActiveTab,
      badge: 'ggplot2',
    },
    {
      label: 'Transform',
      href: '#transform',
      icon: <IconTransform className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      tab: 'transform' as ActiveTab,
      badge: `${filterConditions.length + mutateRules.length} steps`,
    },
    {
      label: 'Statistics',
      href: '#statistics',
      icon: <IconMathFunction className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      tab: 'statistics' as ActiveTab,
      badge: 'lm & tests',
    },
    {
      label: 'Export',
      href: '#export',
      icon: <IconDownload className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      tab: 'export' as ActiveTab,
      badge: '.R / .csv',
    },
  ];

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-black">
        <div className="flex items-center gap-3 font-mono text-sm text-neutral-600 dark:text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
          <span>Initializing Data Studio Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-black font-sans text-neutral-900 dark:text-neutral-100">
      {/* 1. Left Sidebar Navigation (Aceternity style, matching AI Studio) */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-6 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c]">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {/* Header Brand */}
            <div className="flex items-center gap-3 py-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-mono font-black text-base shadow-sm">
                R
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    Data Studio
                  </span>
                  <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                    Statistical Computing & R Bridge
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex flex-col gap-1.5">
              {sidebarLinks.map((link) => {
                const isActive = activeTab === link.tab;
                return (
                  <button
                    key={link.tab}
                    type="button"
                    onClick={() => setActiveTab(link.tab)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-bold shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {link.icon}
                      {sidebarOpen && <span>{link.label}</span>}
                    </div>
                    {sidebarOpen && (
                      <span
                        className={`text-[9.5px] px-2 py-0.5 rounded-md font-mono ${
                          isActive
                            ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-800'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Canonical Datasets Quick Switcher */}
            {sidebarOpen && (
              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
                    R Datasets
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">Built-in</span>
                </div>
                <div className="flex flex-col gap-1">
                  {SAMPLE_DATASETS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => handleLoadSample(sample)}
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        currentDatasetName === sample.name
                          ? 'bg-neutral-200/70 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-white'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <span className="font-mono text-xs">{sample.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {sample.rows} × {sample.cols}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="flex flex-col gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            {sidebarOpen && (
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                    Client-Side Engine
                  </span>
                  <span>100% Private</span>
                </div>
              </div>
            )}

            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <IconArrowLeft className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>Back to Resursee</span>}
            </Link>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* 2. Main Canvas & Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Action Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight capitalize text-neutral-900 dark:text-white">
              {activeTab === 'workspace' && 'Environment & Data Table'}
              {activeTab === 'console' && 'R Interactive Console & REPL'}
              {activeTab === 'visualize' && 'Grammar of Graphics (ggplot2)'}
              {activeTab === 'transform' && 'Data Wrangling Pipeline (dplyr)'}
              {activeTab === 'statistics' && 'Statistical Modeling & Hypothesis Tests'}
              {activeTab === 'export' && 'Reproducible Export & R Scripts'}
            </h1>

            {/* Active Data Frame Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
              <span className="font-bold">{currentDatasetName}</span>
              <span className="text-neutral-400 dark:text-neutral-500">
                ({transformedDataset.length} obs. of {activeColumns.length} variables)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Show R Script Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowRScriptModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
            >
              <IconCode size={15} />
              <span>Show R Script</span>
            </button>

            {/* Quick Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black px-3 py-1.5 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-2xs cursor-pointer"
            >
              <IconDownload size={15} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100/70 dark:bg-black">
          {/* TAB 1: WORKSPACE (Data Viewer & File Import) */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              {/* Import & Info Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* File Dropzone / Picker */}
                <div className="lg:col-span-2 flex flex-col justify-between rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-4 sm:p-5 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                        Import Dataset
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        CSV, TSV, XLSX, JSON
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Import tabular data directly into your browser memory. Computation is 100% client-side with zero data sent over the network.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-xs">
                      <IconFileSpreadsheet size={16} />
                      <span>Choose File to Import</span>
                      <input
                        type="file"
                        accept=".csv,.tsv,.xlsx,.xls,.json,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <span className="text-xs text-neutral-500 font-mono">
                      Current file: <strong className="text-neutral-800 dark:text-neutral-200">{fileName}</strong>
                    </span>
                  </div>
                </div>

                {/* RStudio-Like Environment Pane Card */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                        Global Environment
                      </span>
                      <span className="text-xs font-mono text-neutral-400">RStudio Sync</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">df</span>
                        <span className="font-mono text-neutral-500">
                          {transformedDataset.length} obs. of {activeColumns.length} variables
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">model</span>
                        <span className="font-mono text-neutral-500">
                          {regressionResult ? `lm(${regDepVar} ~ ${regIndepVars.join('+')})` : 'NULL'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">pipeline</span>
                        <span className="font-mono text-neutral-500">
                          {filterConditions.length + mutateRules.length} operations
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => handleLoadSample(SAMPLE_DATASETS[0])}
                      className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                    >
                      Reset to iris
                    </button>
                    <span className="text-[10px] font-mono text-neutral-400">
                      RAM: ~{(JSON.stringify(rawDataset).length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>

              {/* Column Types Strip */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                    Column Variables & Data Types
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    {columnSummaries.length} columns detected
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {columnSummaries.map((col) => (
                    <div
                      key={col.name}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-2.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-mono truncate text-neutral-900 dark:text-white" title={col.name}>
                          {col.name}
                        </span>
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {col.type === 'numeric' ? 'num' : col.type === 'string' ? 'chr' : 'bool'}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono space-y-0.5">
                        {col.type === 'numeric' ? (
                          <>
                            <div>μ: {col.mean?.toFixed(2)}</div>
                            <div>range: [{col.min?.toFixed(1)}, {col.max?.toFixed(1)}]</div>
                          </>
                        ) : (
                          <>
                            <div>unique: {col.uniqueCount}</div>
                            <div>nulls: {col.nullCount}</div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Data Table View */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] shadow-xs overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                      Data Table View (View(df))
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      Showing {searchedRows.length} matching observations
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search observations..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="h-8 w-44 sm:w-60 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 pl-8 pr-3 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-400">
                        <th className="px-4 py-2.5 w-12 text-center text-neutral-400">#</th>
                        {activeColumns.map((col) => (
                          <th
                            key={col}
                            onClick={() => {
                              if (sortColumn === col) {
                                setSortAscending(!sortAscending);
                              } else {
                                setSortColumn(col);
                                setSortAscending(true);
                              }
                            }}
                            className="px-4 py-2.5 font-bold cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{col}</span>
                              {sortColumn === col && (
                                <span className="text-[10px] text-neutral-900 dark:text-white">
                                  {sortAscending ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={activeColumns.length + 1} className="px-4 py-8 text-center text-neutral-400">
                            No observations found matching the search criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row, idx) => {
                          const rowNum = (currentPage - 1) * pageSize + idx + 1;
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                            >
                              <td className="px-4 py-2 text-center text-neutral-400 select-none">
                                {rowNum}
                              </td>
                              {activeColumns.map((col) => {
                                const val = row[col];
                                const isNum = typeof val === 'number';
                                return (
                                  <td
                                    key={col}
                                    className={`px-4 py-2 truncate max-w-[220px] ${
                                      isNum ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-600 dark:text-neutral-400'
                                    }`}
                                  >
                                    {val !== null && val !== undefined ? String(val) : <span className="text-neutral-400">NA</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination */}
                <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/30">
                  <span className="text-xs font-mono text-neutral-500">
                    Page {currentPage} of {totalPages} ({searchedRows.length} total rows)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSOLE (RStudio Interactive REPL) */}
          {activeTab === 'console' && (
            <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] shadow-xs overflow-hidden">
              {/* Console Toolbar */}
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                  <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    Console — RStudio Style REPL
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConsoleInput('summary(df)');
                      setTimeout(handleExecuteConsole, 50);
                    }}
                    className="text-[11px] font-mono px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                  >
                    summary(df)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConsoleInput('glimpse(df)');
                      setTimeout(handleExecuteConsole, 50);
                    }}
                    className="text-[11px] font-mono px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                  >
                    glimpse(df)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConsoleInput('cor(df)');
                      setTimeout(handleExecuteConsole, 50);
                    }}
                    className="text-[11px] font-mono px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                  >
                    cor(df)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsoleHistory([])}
                    className="text-[11px] font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-2 py-1"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Console History Terminal Area */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-4 bg-neutral-50/50 dark:bg-[#070707]">
                {consoleHistory.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-semibold">
                      <span className="text-neutral-900 dark:text-white font-bold">&gt;</span>
                      <span>{item.command}</span>
                      <span className="text-[10px] text-neutral-400 ml-auto">{item.timestamp}</span>
                    </div>
                    <pre
                      className={`p-3 rounded-xl overflow-x-auto whitespace-pre-wrap ${
                        item.type === 'error'
                          ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                          : item.type === 'info'
                          ? 'bg-neutral-100 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800'
                          : 'bg-white dark:bg-[#121212] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {item.output}
                    </pre>
                  </div>
                ))}
                <div ref={consoleBottomRef} />
              </div>

              {/* Console Interactive Input Box */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-[#0c0c0c] flex items-center gap-3">
                <span className="font-mono font-bold text-neutral-900 dark:text-white">&gt;</span>
                <input
                  type="text"
                  placeholder="Enter R command or JS expression (e.g. summary(df), glimpse(df), names(df))..."
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleExecuteConsole();
                    }
                  }}
                  className="flex-1 font-mono text-xs bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-hidden placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={handleExecuteConsole}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black px-3 py-1.5 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <IconPlayerPlay size={14} />
                  <span>Run</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VISUALIZE (ggplot2 Grammar of Graphics Builder) */}
          {activeTab === 'visualize' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Aesthetics Controls (Aesthetics mapping: X, Y, Color, Geom) */}
              <div className="lg:col-span-1 space-y-4">
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                      ggplot2 Aesthetics & Geoms
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      aes()
                    </span>
                  </div>

                  {/* Geom Selector */}
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                      Geometry Layer (geom_*)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'scatter', label: 'Scatter (point)' },
                        { id: 'bar', label: 'Bar (col)' },
                        { id: 'line', label: 'Line' },
                        { id: 'area', label: 'Area' },
                        { id: 'histogram', label: 'Histogram' },
                        { id: 'boxplot', label: 'Boxplot' },
                      ].map((geom) => (
                        <button
                          key={geom.id}
                          type="button"
                          onClick={() => setChartType(geom.id as any)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-all text-center ${
                            chartType === geom.id
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black font-bold'
                              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                          }`}
                        >
                          {geom.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* X Axis Mapping */}
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                      X Aesthetic (x =)
                    </label>
                    <select
                      value={xAxisCol}
                      onChange={(e) => setXAxisCol(e.target.value)}
                      className="w-full h-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
                    >
                      {allColumnNames.map((col) => (
                        <option key={col} value={col}>
                          {col} ({columnSummaries.find((c) => c.name === col)?.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Y Axis Mapping */}
                  {chartType !== 'histogram' && (
                    <div>
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                        Y Aesthetic (y =)
                      </label>
                      <select
                        value={yAxisCol}
                        onChange={(e) => setYAxisCol(e.target.value)}
                        className="w-full h-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
                      >
                        {numericColumns.map((col) => (
                          <option key={col} value={col}>
                            {col} (num)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Color / Grouping Aesthetic */}
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                      Color / Fill Group (color =)
                    </label>
                    <select
                      value={colorCol}
                      onChange={(e) => setColorCol(e.target.value)}
                      className="w-full h-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
                    >
                      <option value="">None (Monochrome)</option>
                      {categoricalColumns.map((col) => (
                        <option key={col} value={col}>
                          {col} (categorical)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title Customization */}
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                      Plot Title
                    </label>
                    <input
                      type="text"
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                      className="w-full h-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
                    />
                  </div>

                  {/* Quick ggplot2 Code Snippet */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono text-neutral-500 font-bold">Equivalent ggplot2:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const snippet = `ggplot(df, aes(x = ${xAxisCol}, y = ${yAxisCol}${colorCol ? `, color = ${colorCol}` : ''})) + geom_${chartType === 'scatter' ? 'point()' : chartType === 'bar' ? 'col()' : chartType + '()'} + theme_minimal()`;
                          navigator.clipboard.writeText(snippet);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 1500);
                        }}
                        className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                      >
                        {copiedCode ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 font-mono text-[11px] overflow-x-auto text-neutral-800 dark:text-neutral-200">
                      {`ggplot(df, aes(x = ${xAxisCol}, y = ${yAxisCol}${colorCol ? `, color = ${colorCol}` : ''})) +
  geom_${chartType === 'scatter' ? 'point()' : chartType === 'bar' ? 'col()' : chartType + '()'} +
  theme_minimal()`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Chart Live Canvas Rendering Area */}
              <div className="lg:col-span-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs flex flex-col justify-between min-h-[460px]">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {chartTitle || 'Visualization'}
                      </h2>
                      <span className="text-xs text-neutral-400 font-mono">
                        {chartType.toUpperCase()} | X: {xAxisCol} {chartType !== 'histogram' && `| Y: ${yAxisCol}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRScriptModal(true)}
                        className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300"
                      >
                        <IconCode size={13} />
                        <span>View R Script</span>
                      </button>
                    </div>
                  </div>

                  {/* Chart Component */}
                  <div className="h-[360px] w-full pt-2">
                    {chartType === 'scatter' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                          <XAxis
                            type="number"
                            dataKey={xAxisCol}
                            name={xAxisCol}
                            stroke="#88888880"
                            fontSize={11}
                            tickLine={false}
                          />
                          <YAxis
                            type="number"
                            dataKey={yAxisCol}
                            name={yAxisCol}
                            stroke="#88888880"
                            fontSize={11}
                            tickLine={false}
                          />
                          <RechartsTooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{
                              backgroundColor: '#181818',
                              borderColor: '#333333',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '11px',
                            }}
                          />
                          <Scatter
                            name={currentDatasetName}
                            data={transformedDataset}
                            fill="#525252"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}

                    {chartType === 'bar' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transformedDataset.slice(0, 30)} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                          <XAxis dataKey={xAxisCol} stroke="#88888880" fontSize={11} tickLine={false} />
                          <YAxis stroke="#88888880" fontSize={11} tickLine={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#181818',
                              borderColor: '#333333',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '11px',
                            }}
                          />
                          <Bar dataKey={yAxisCol} fill="#525252" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {chartType === 'line' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={transformedDataset} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                          <XAxis dataKey={xAxisCol} stroke="#88888880" fontSize={11} tickLine={false} />
                          <YAxis stroke="#88888880" fontSize={11} tickLine={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#181818',
                              borderColor: '#333333',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '11px',
                            }}
                          />
                          <Line type="monotone" dataKey={yAxisCol} stroke="#525252" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}

                    {chartType === 'area' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={transformedDataset} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                          <XAxis dataKey={xAxisCol} stroke="#88888880" fontSize={11} tickLine={false} />
                          <YAxis stroke="#88888880" fontSize={11} tickLine={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#181818',
                              borderColor: '#333333',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '11px',
                            }}
                          />
                          <Area type="monotone" dataKey={yAxisCol} stroke="#525252" fill="#88888830" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}

                    {(chartType === 'histogram' || chartType === 'boxplot') && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={transformedDataset.slice(0, 25)}
                          margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                          <XAxis dataKey={xAxisCol} stroke="#88888880" fontSize={11} tickLine={false} />
                          <YAxis stroke="#88888880" fontSize={11} tickLine={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#181818',
                              borderColor: '#333333',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '11px',
                            }}
                          />
                          <Bar dataKey={yAxisCol || xAxisCol} fill="#525252" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 font-mono">
                  <span>Grammar of graphics: data | aesthetics | geoms | stats</span>
                  <span>theme_minimal() applied</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRANSFORM (Dplyr Wrangling Pipeline) */}
          {activeTab === 'transform' && (
            <div className="space-y-6">
              {/* Pipeline Step Builder Card */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Dplyr Transformation Pipeline
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Chain operations with R-style pipes (<code className="font-mono">%&gt;%</code> or <code className="font-mono">|&gt;</code>). Filter observations and mutate new variables.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterConditions([]);
                      setMutateRules([]);
                      setSelectedColumns([]);
                      setSortColumn('');
                    }}
                    className="text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800"
                  >
                    Reset Pipeline
                  </button>
                </div>

                {/* 1. Filter Rules (filter()) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 font-mono">
                      1. Filter Rows (filter())
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterConditions([
                          ...filterConditions,
                          {
                            id: String(Date.now()),
                            column: allColumnNames[0] || '',
                            operator: '>',
                            value: '0',
                          },
                        ]);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                    >
                      <IconPlus size={14} />
                      <span>Add Filter Rule</span>
                    </button>
                  </div>

                  {filterConditions.length === 0 ? (
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 font-mono">
                      No active filter conditions. All observations are passing through.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filterConditions.map((cond, idx) => (
                        <div
                          key={cond.id}
                          className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                        >
                          <span className="text-xs font-mono text-neutral-400">filter(</span>
                          <select
                            value={cond.column}
                            onChange={(e) => {
                              const newConds = [...filterConditions];
                              newConds[idx].column = e.target.value;
                              setFilterConditions(newConds);
                            }}
                            className="h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                          >
                            {allColumnNames.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>

                          <select
                            value={cond.operator}
                            onChange={(e) => {
                              const newConds = [...filterConditions];
                              newConds[idx].operator = e.target.value as any;
                              setFilterConditions(newConds);
                            }}
                            className="h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                          >
                            <option value=">">&gt; (greater than)</option>
                            <option value=">=">&gt;= (greater or equal)</option>
                            <option value="<">&lt; (less than)</option>
                            <option value="<=">&lt;= (less or equal)</option>
                            <option value="==">== (equal to)</option>
                            <option value="!=">!= (not equal to)</option>
                            <option value="contains">contains (str_detect)</option>
                          </select>

                          <input
                            type="text"
                            value={cond.value}
                            onChange={(e) => {
                              const newConds = [...filterConditions];
                              newConds[idx].value = e.target.value;
                              setFilterConditions(newConds);
                            }}
                            placeholder="value..."
                            className="h-8 w-32 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                          />

                          <span className="text-xs font-mono text-neutral-400">)</span>

                          <button
                            type="button"
                            onClick={() => {
                              setFilterConditions(filterConditions.filter((_, i) => i !== idx));
                            }}
                            className="ml-auto text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Mutate Rules (mutate()) */}
                <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 font-mono">
                      2. Compute Derived Variables (mutate())
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMutateRules([
                          ...mutateRules,
                          {
                            id: String(Date.now()),
                            newColumn: `calc_${mutateRules.length + 1}`,
                            expression: `${numericColumns[0] || 'x'} * 2`,
                          },
                        ]);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                    >
                      <IconPlus size={14} />
                      <span>Add Mutate Rule</span>
                    </button>
                  </div>

                  {mutateRules.length === 0 ? (
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 font-mono">
                      No computed columns. Click &quot;Add Mutate Rule&quot; to calculate new fields (e.g. ratio = sepal_length / sepal_width).
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {mutateRules.map((rule, idx) => (
                        <div
                          key={rule.id}
                          className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                        >
                          <span className="text-xs font-mono text-neutral-400">mutate(</span>
                          <input
                            type="text"
                            value={rule.newColumn}
                            onChange={(e) => {
                              const newRules = [...mutateRules];
                              newRules[idx].newColumn = e.target.value;
                              setMutateRules(newRules);
                            }}
                            placeholder="new_column_name"
                            className="h-8 w-36 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                          />
                          <span className="text-xs font-mono text-neutral-400">=</span>
                          <input
                            type="text"
                            value={rule.expression}
                            onChange={(e) => {
                              const newRules = [...mutateRules];
                              newRules[idx].expression = e.target.value;
                              setMutateRules(newRules);
                            }}
                            placeholder="expression (e.g. col1 / col2)"
                            className="h-8 flex-1 min-w-[200px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                          />
                          <span className="text-xs font-mono text-neutral-400">)</span>

                          <button
                            type="button"
                            onClick={() => {
                              setMutateRules(mutateRules.filter((_, i) => i !== idx));
                            }}
                            className="ml-auto text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pipeline Output Summary Pill */}
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono">
                  <span>
                    Pipeline Result: <strong>{transformedDataset.length} rows</strong> remaining (from {rawDataset.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('workspace')}
                    className="underline text-neutral-800 dark:text-neutral-200 font-bold"
                  >
                    View in Data Table &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STATISTICS (R-Style Linear Regression, ANOVA, Tests) */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              {/* OLS Linear Regression (lm()) Authentic R Summary Output */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Ordinary Least Squares (OLS) Linear Regression — lm()
                    </h2>
                    <span className="text-xs text-neutral-400 font-mono">
                      summary(lm(formula = {regDepVar} ~ {regIndepVars.join(' + ')}, data = df))
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (regressionResult) {
                          navigator.clipboard.writeText(regressionResult.rSummaryOutput);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-xs font-mono text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      {copiedCode ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      <span>{copiedCode ? 'Copied' : 'Copy R Output'}</span>
                    </button>
                  </div>
                </div>

                {/* Variable Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                      Dependent Variable (Y):
                    </label>
                    <select
                      value={regDepVar}
                      onChange={(e) => setRegDepVar(e.target.value)}
                      className="w-full h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                    >
                      {numericColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                      Independent Variable(s) (X):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {numericColumns
                        .filter((c) => c !== regDepVar)
                        .map((col) => {
                          const isSelected = regIndepVars.includes(col);
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (regIndepVars.length > 1) {
                                    setRegIndepVars(regIndepVars.filter((v) => v !== col));
                                  }
                                } else {
                                  setRegIndepVars([...regIndepVars, col]);
                                }
                              }}
                              className={`px-2 py-1 rounded-md text-xs font-mono transition-colors ${
                                isSelected
                                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-bold'
                                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {col}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Exact R summary(lm) Monospace Display */}
                {regressionResult ? (
                  <div className="space-y-4">
                    <pre className="p-4 rounded-xl bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      {regressionResult.rSummaryOutput}
                    </pre>

                    {/* Residuals vs Fitted Diagnostic Chart */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          Diagnostic Plot: Residuals vs Fitted (plot(model, which = 1))
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">OLS Assumption Check</span>
                      </div>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                            <XAxis dataKey="fitted" name="Fitted Values" stroke="#88888880" fontSize={10} />
                            <YAxis dataKey="residual" name="Residuals" stroke="#88888880" fontSize={10} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#181818',
                                borderColor: '#333333',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '11px',
                              }}
                            />
                            <Scatter data={regressionResult.residualPoints} fill="#525252" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-400 font-mono text-center">
                    Select valid numeric dependent and independent variables to run linear regression.
                  </div>
                )}
              </div>

              {/* Correlation Heatmap */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Pearson Correlation Matrix — cor(df)
                    </h2>
                    <span className="text-xs text-neutral-400 font-mono">
                      Pairwise linear correlation coefficients [-1.0, +1.0]
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse font-mono text-xs text-center">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                        <th className="p-2 text-left font-bold">Variable</th>
                        {numericColumns.map((col) => (
                          <th key={col} className="p-2 font-bold truncate max-w-[90px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {numericColumns.map((rowCol) => (
                        <tr key={rowCol}>
                          <td className="p-2 text-left font-bold text-neutral-800 dark:text-neutral-200">
                            {rowCol}
                          </td>
                          {numericColumns.map((colCol) => {
                            const cell = correlationMatrix.find(
                              (c) => c.var1 === rowCol && c.var2 === colCol
                            );
                            const rVal = cell ? cell.r : 0;
                            const isDiag = rowCol === colCol;
                            return (
                              <td
                                key={colCol}
                                className={`p-2 transition-colors ${
                                  isDiag
                                    ? 'font-bold bg-neutral-100 dark:bg-neutral-800'
                                    : Math.abs(rVal) > 0.7
                                    ? 'bg-neutral-200/70 dark:bg-neutral-700/60 font-bold'
                                    : ''
                                }`}
                              >
                                {rVal.toFixed(3)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hypothesis Testing (ANOVA & Two-Sample T-Test) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* One-Way ANOVA */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs space-y-4">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                      One-Way ANOVA — aov()
                    </h2>
                    <span className="text-xs text-neutral-400 font-mono">
                      Test difference in means across categorical groups
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                        Numeric Variable:
                      </label>
                      <select
                        value={anovaNumVar}
                        onChange={(e) => setAnovaNumVar(e.target.value)}
                        className="w-full h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-xs font-mono"
                      >
                        {numericColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                        Group Variable:
                      </label>
                      <select
                        value={anovaGroupVar}
                        onChange={(e) => setAnovaGroupVar(e.target.value)}
                        className="w-full h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-xs font-mono"
                      >
                        {categoricalColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {anovaResult ? (
                    <pre className="p-3 rounded-xl bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      {anovaResult.rSummaryOutput}
                    </pre>
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-400 font-mono text-center">
                      Select valid group and numeric variables.
                    </div>
                  )}
                </div>

                {/* Two-Sample T-Test */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs space-y-4">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Student&apos;s T-Test — t.test()
                    </h2>
                    <span className="text-xs text-neutral-400 font-mono">
                      Welch two-sample test for difference in means
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                        Variable 1 (x):
                      </label>
                      <select
                        value={tTestVar1}
                        onChange={(e) => setTTestVar1(e.target.value)}
                        className="w-full h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-xs font-mono"
                      >
                        {numericColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
                        Variable 2 (y):
                      </label>
                      <select
                        value={tTestVar2}
                        onChange={(e) => setTTestVar2(e.target.value)}
                        className="w-full h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-xs font-mono"
                      >
                        {numericColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {tTestResult ? (
                    <pre className="p-3 rounded-xl bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      {tTestResult.rSummaryOutput}
                    </pre>
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-400 font-mono text-center">
                      Select two distinct numeric columns for t-test.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EXPORT (Reproducible R Code & Formats) */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Export Clean CSV */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-mono font-bold text-sm mb-3">
                      CSV
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                      Processed CSV
                    </h3>
                    <p className="text-xs text-neutral-500 mb-4">
                      Download current dataset after all dplyr pipeline filters and derived columns.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black py-2 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <IconDownload size={15} />
                    <span>Download CSV</span>
                  </button>
                </div>

                {/* 2. Export Excel */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-mono font-bold text-sm mb-3">
                      XLSX
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                      Excel Spreadsheet
                    </h3>
                    <p className="text-xs text-neutral-500 mb-4">
                      Export full dataset formatted for Microsoft Excel and Google Sheets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black py-2 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <IconDownload size={15} />
                    <span>Download XLSX</span>
                  </button>
                </div>

                {/* 3. Export JSON */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-mono font-bold text-sm mb-3">
                      JSON
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                      JSON Records
                    </h3>
                    <p className="text-xs text-neutral-500 mb-4">
                      Export dataset as structured JSON records for web development and APIs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black py-2 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <IconDownload size={15} />
                    <span>Download JSON</span>
                  </button>
                </div>

                {/* 4. Export R Script (.R) */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-mono font-bold text-sm mb-3">
                      .R
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                      RStudio Script (.R)
                    </h3>
                    <p className="text-xs text-neutral-500 mb-4">
                      Reproducible R script replicating all steps in RStudio with Tidyverse &amp; ggplot2.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportRScript}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black py-2 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <IconFileCode size={15} />
                    <span>Download .R Script</span>
                  </button>
                </div>
              </div>

              {/* Complete R Script Live Code Mirror */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Complete Reproducible R Script
                    </h3>
                    <span className="text-xs text-neutral-500 font-mono">
                      Copy directly into Desktop RStudio, Quarto (.qmd), or RMarkdown (.Rmd)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyRScript}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    {copiedCode ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    <span>{copiedCode ? 'Copied' : 'Copy R Script'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200 leading-relaxed max-h-96">
                  {currentRScript}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* R Script Modal */}
      {showRScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                  Reproducible R Script (RStudio Companion)
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  Standard tidyverse &amp; ggplot2 syntax ready to run in desktop RStudio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRScriptModal(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <pre className="flex-1 p-4 rounded-xl bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-y-auto text-neutral-800 dark:text-neutral-200 leading-relaxed">
              {currentRScript}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleCopyRScript}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {copiedCode ? <IconCheck size={15} /> : <IconCopy size={15} />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportRScript}
                className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <IconDownload size={15} />
                <span>Download .R File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
