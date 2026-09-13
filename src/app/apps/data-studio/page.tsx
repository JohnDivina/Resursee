'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  Links,
} from '@/components/ui/sidebar';
import {
  IconTable,
  IconTerminal2,
  IconChartBar,
  IconMathFunction,
  IconDownload,
  IconCode,
  IconCopy,
  IconCheck,
  IconTrash,
  IconFileSpreadsheet,
  IconPlus,
  IconArrowLeft,
  IconSearch,
  IconPlayerPlay,
  IconPlayerStop,
  IconFileCode,
  IconSparkles,
  IconSend,
  IconAdjustments,
  IconReload,
  IconBulb,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
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
import {
  checkOllamaConnection,
  streamOllamaChat,
  startOllamaDaemon,
  stopOllamaDaemon,
  DEFAULT_OLLAMA_ENDPOINT,
} from '@/lib/ollamaClient';
import { OllamaModel, OllamaChatMessage } from '@/types/aiHub';
import { cn } from '@/lib/utils';

// High-contrast, crystal-clear tooltip component for charts (replaces unreadable dark-on-dark default)
const StudioCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-neutral-700/80 bg-neutral-900/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md pointer-events-none min-w-[130px]">
        {label !== undefined && label !== null && String(label).trim() !== '' && (
          <p className="font-mono text-[11px] font-bold text-neutral-200 mb-1.5 border-b border-neutral-800 pb-1">
            {String(label)}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((entry: any, i: number) => {
            const displayName = entry.name || entry.dataKey || `Value ${i + 1}`;
            const val = entry.value;
            const formattedVal =
              typeof val === 'number'
                ? Number.isInteger(val)
                  ? val
                  : Number(val.toFixed(3))
                : val;
            return (
              <div key={i} className="flex items-center justify-between gap-4 font-mono text-[11px]">
                <span className="text-neutral-400 font-medium">{displayName}:</span>
                <span className="font-bold text-white tracking-tight">{formattedVal}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

type ActiveViewTab = 'ide' | 'table' | 'visualizer' | 'export';
type OutputMode = 'console' | 'plot' | 'model' | 'table';

interface PlotConfig {
  type: 'scatter' | 'bar' | 'line' | 'area' | 'histogram';
  x: string;
  y?: string;
  color?: string;
  title?: string;
}

export default function DataStudioPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('ide');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dataset State
  const [currentDatasetName, setCurrentDatasetName] = useState<string>('iris');
  const [rawDataset, setRawDataset] = useState<Record<string, any>[]>(SAMPLE_DATASETS[0].data);
  const [fileName, setFileName] = useState<string>('iris.csv');

  // Code Editor State
  const [scriptCode, setScriptCode] = useState<string>(
`// Data Studio Interactive Analysis Script
// Active dataset is available as 'df' (${SAMPLE_DATASETS[0].rows} rows × ${SAMPLE_DATASETS[0].cols} cols)

// 1. Inspect summary statistics
summary(df);

// 2. Fit an OLS linear regression model: petal_length ~ sepal_length + sepal_width
fitLinearModel('petal_length', ['sepal_length', 'sepal_width']);

// 3. Render a ggplot2-style scatter plot
plot({
  type: 'scatter',
  x: 'sepal_length',
  y: 'petal_length',
  color: 'species',
  title: 'Petal vs Sepal Morphology'
});`
  );

  // Execution Output State
  const [outputMode, setOutputMode] = useState<OutputMode>('console');
  const [consoleOutput, setConsoleOutput] = useState<string>('Ready. Click "Run Script" or press Cmd+Enter to execute.');
  const [lastReturnedData, setLastReturnedData] = useState<any[] | null>(null);
  const [activePlot, setActivePlot] = useState<PlotConfig | null>({
    type: 'scatter',
    x: 'sepal_length',
    y: 'petal_length',
    color: 'species',
    title: 'Petal vs Sepal Morphology',
  });
  const [activeRegression, setActiveRegression] = useState<RegressionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Ollama AI Assistant State
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'checking' | 'offline'>('checking');
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5-coder');
  const [chatMessages, setChatMessages] = useState<OllamaChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your **Local LLM Copilot**. I have access to your active dataset and columns.\n\nAsk me to write R/DataStudio code, suggest statistical tests, plot charts, or interpret model outputs.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'assistant' | 'schema'>('assistant');

  // Data Table / Search State
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 15;

  // Modals & UI Helpers
  const [showRScriptModal, setShowRScriptModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showLocalNoticeModal, setShowLocalNoticeModal] = useState(false);
  const [dontShowAgainNotice, setDontShowAgainNotice] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    probeOllama();
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('resursee_datastudio_local_notice_dismissed');
      if (!dismissed) {
        setShowLocalNoticeModal(true);
      }
    }
  }, []);

  const handleDismissNotice = () => {
    if (dontShowAgainNotice && typeof window !== 'undefined') {
      sessionStorage.setItem('resursee_datastudio_local_notice_dismissed', 'true');
    }
    setShowLocalNoticeModal(false);
  };

  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [isStoppingOllama, setIsStoppingOllama] = useState(false);

  // 1-Click Start Ollama Daemon (Runs silently in background)
  const handleStartOllama = async () => {
    setIsStartingOllama(true);
    try {
      await startOllamaDaemon();
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const check = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 800);
        if (check.status) {
          setOllamaStatus('connected');
          if (check.models && check.models.length > 0) {
            setInstalledModels(check.models);
            const coder = check.models.find(
              (m) =>
                m.name.includes('coder') ||
                m.name.includes('qwen') ||
                m.name.includes('deepseek') ||
                m.name.includes('llama3')
            );
            if (coder) setSelectedModel(coder.name);
          }
          break;
        }
      }
    } catch (err: any) {
      console.error('Failed to start Ollama daemon:', err);
    } finally {
      setIsStartingOllama(false);
      probeOllama();
    }
  };

  // Stop Ollama Daemon
  const handleStopOllama = async () => {
    setIsStoppingOllama(true);
    try {
      const res = await stopOllamaDaemon();
      if (res.stopped) {
        setOllamaStatus('offline');
        setInstalledModels([]);
        setSelectedModel('');
      }
    } catch (err: any) {
      console.error('Failed to stop Ollama daemon:', err);
    } finally {
      setIsStoppingOllama(false);
      setTimeout(probeOllama, 800);
    }
  };

  // Probe Ollama connection
  const probeOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 2000);
      if (res.status) {
        setOllamaStatus('connected');
        if (res.models && res.models.length > 0) {
          setInstalledModels(res.models);
          // Prefer code models if available
          const coder = res.models.find(
            (m) =>
              m.name.includes('coder') ||
              m.name.includes('qwen') ||
              m.name.includes('deepseek') ||
              m.name.includes('llama3')
          );
          if (coder) {
            setSelectedModel(coder.name);
          } else {
            setSelectedModel(res.models[0].name);
          }
        }
      } else {
        setOllamaStatus('offline');
      }
    } catch {
      setOllamaStatus('offline');
    }
  };

  // Inspect column summaries
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

  // Execute Code in the Sandbox
  const handleRunCode = (codeToRun?: string) => {
    const code = codeToRun !== undefined ? codeToRun : scriptCode;
    if (!code.trim()) return;

    setIsExecuting(true);
    const logs: string[] = [];
    const log = (...args: any[]) => {
      logs.push(
        args
          .map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
          .join(' ')
      );
    };

    try {
      // Setup sandbox variables & helper functions
      const df = rawDataset;

      const summary = (data?: any[]) => {
        const target = data || df;
        const cols = inspectColumns(target);
        const out = cols
          .map((c) => {
            if (c.type === 'numeric') {
              return `${c.name} (num):\n  Min: ${c.min?.toFixed(2)} | 1st Qu: ${c.q1?.toFixed(2)} | Median: ${c.median?.toFixed(2)}\n  Mean: ${c.mean?.toFixed(2)} | 3rd Qu: ${c.q3?.toFixed(2)} | Max: ${c.max?.toFixed(2)}\n  StdDev: ${c.stdev?.toFixed(2)} | IQR: ${c.iqr?.toFixed(2)}`;
            }
            return `${c.name} (${c.type}): Length: ${c.count} | Unique: ${c.uniqueCount}`;
          })
          .join('\n\n');
        log(out);
        return out;
      };

      const glimpse = (data?: any[]) => {
        const target = data || df;
        const cols = inspectColumns(target);
        const out = `Rows: ${target.length}\nColumns: ${cols.length}\n` +
          cols
            .map((c) => {
              const samples = target.slice(0, 4).map((r) => r[c.name]).join(', ');
              return `$ ${c.name.padEnd(16)} <${c.type}> ${samples}...`;
            })
            .join('\n');
        log(out);
        return out;
      };

      const names = (data?: any[]) => {
        const keys = Object.keys((data || df)[0] || {});
        log(JSON.stringify(keys, null, 2));
        return keys;
      };

      const head = (data?: any[], n = 6) => {
        const res = (data || df).slice(0, n);
        log(JSON.stringify(res, null, 2));
        setLastReturnedData(res);
        return res;
      };

      const tail = (data?: any[], n = 6) => {
        const res = (data || df).slice(-n);
        log(JSON.stringify(res, null, 2));
        setLastReturnedData(res);
        return res;
      };

      const cor = (data?: any[]) => {
        const target = data || df;
        const cols = inspectColumns(target).filter((c) => c.type === 'numeric').map((c) => c.name);
        if (cols.length < 2) {
          log('Need at least 2 numeric columns for correlation matrix.');
          return;
        }
        const matrix = computeCorrelationMatrix(target, cols);
        let out = `Correlation Matrix (Pearson r):\n` +
          cols.map((c) => c.slice(0, 10).padStart(11)).join('') + '\n' +
          cols
            .map((rowCol) => {
              const vals = cols.map((colCol) => {
                const cell = matrix.find((c) => c.var1 === rowCol && c.var2 === colCol);
                return (cell ? cell.r.toFixed(3) : 'NA').padStart(11);
              });
              return rowCol.slice(0, 10).padEnd(10) + vals.join('');
            })
            .join('\n');
        log(out);
        return matrix;
      };

      const fitLinearModel = (dependentVar: string, independentVars: string[]) => {
        const reg = runLinearRegression(df, dependentVar, independentVars);
        if (reg) {
          setActiveRegression(reg);
          log(reg.rSummaryOutput);
          setOutputMode('model');
          return reg;
        } else {
          log('Linear model failed: Ensure variables are numeric with enough observations.');
        }
      };

      const plot = (config: PlotConfig) => {
        setActivePlot(config);
        setOutputMode('plot');
        log(`Plot generated: [${config.type.toUpperCase()}] X: ${config.x} ${config.y ? `Y: ${config.y}` : ''}`);
      };

      const anova = (numVar: string, groupVar: string) => {
        const res = runOneWayAnova(df, numVar, groupVar);
        if (res) {
          log(res.rSummaryOutput);
          return res;
        }
      };

      const tTest = (var1: string, var2: string) => {
        const res = runTwoSampleTTest(df, var1, var2);
        if (res) {
          log(res.rSummaryOutput);
          return res;
        }
      };

      // Wrap in sandbox
      // eslint-disable-next-line no-new-func
      const runFn = new Function(
        'df',
        'summary',
        'glimpse',
        'names',
        'head',
        'tail',
        'cor',
        'fitLinearModel',
        'plot',
        'anova',
        'tTest',
        'log',
        `try {
          ${code}
        } catch(e) {
          log("Runtime Error: " + e.message);
        }`
      );

      runFn(df, summary, glimpse, names, head, tail, cor, fitLinearModel, plot, anova, tTest, log);

      const finalOutput = logs.join('\n\n');
      setConsoleOutput(finalOutput || 'Code executed successfully with zero standard output.');
    } catch (err: any) {
      setConsoleOutput(`Compilation Error: ${err.message}`);
      setOutputMode('console');
    } finally {
      setIsExecuting(false);
    }
  };

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to Run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
  };

  // Load sample dataset
  const handleLoadSample = (sample: DatasetItem) => {
    setCurrentDatasetName(sample.name);
    setFileName(sample.filename);
    setRawDataset(sample.data);
    setTablePage(1);

    const cols = inspectColumns(sample.data);
    const numCols = cols.filter((c) => c.type === 'numeric').map((c) => c.name);
    const catCols = cols.filter((c) => c.type !== 'numeric').map((c) => c.name);

    if (numCols.length >= 2) {
      setActivePlot({
        type: 'scatter',
        x: numCols[0],
        y: numCols[1],
        color: catCols[0] || '',
        title: `${numCols[1]} vs ${numCols[0]}`,
      });
      const reg = runLinearRegression(sample.data, numCols[1], [numCols[0]]);
      if (reg) setActiveRegression(reg);
    }

    setScriptCode(
`// Canonical dataset '${sample.name}' loaded (${sample.rows} rows × ${sample.cols} columns)
// Inspect structure
glimpse(df);

// Compute summary stats
summary(df);

${numCols.length >= 2 ? `// Fit linear model\nfitLinearModel('${numCols[1]}', ['${numCols[0]}']);\n\n// Plot relationship\nplot({ type: 'scatter', x: '${numCols[0]}', y: '${numCols[1]}', color: '${catCols[0] || ''}', title: '${sample.name} Analysis' });` : ''}`
    );

    setConsoleOutput(`Loaded dataset '${sample.name}' (${sample.rows} obs. of ${sample.cols} variables).`);
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
            setTablePage(1);
            setConsoleOutput(`Loaded ${file.name} (${results.data.length} rows × ${Object.keys(results.data[0] || {}).length} columns).`);
            setScriptCode(
`// Uploaded dataset '${cleanName}' (${results.data.length} rows)
summary(df);
glimpse(df);`
            );
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
          setTablePage(1);
          setConsoleOutput(`Imported sheet '${wsname}' from ${file.name}: ${data.length} observations.`);
          setScriptCode(
`// Uploaded Excel sheet '${wsname}' (${data.length} rows)
summary(df);
glimpse(df);`
          );
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
          setTablePage(1);
          setConsoleOutput(`Imported JSON records from ${file.name}: ${arr.length} observations.`);
        } catch (err: any) {
          alert('Invalid JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  // Chat with Ollama AI Copilot (Dataset-Aware)
  const handleSendChatMessage = async (promptOverride?: string) => {
    const text = promptOverride || chatInput.trim();
    if (!text || isGeneratingAI) return;

    const userMsg: OllamaChatMessage = { role: 'user', content: text };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    if (!promptOverride) setChatInput('');
    setIsGeneratingAI(true);

    // Prepare system prompt with actual dataset schema & first 3 rows
    const sampleRows = JSON.stringify(rawDataset.slice(0, 3), null, 2);
    const colSummaryStr = columnSummaries
      .map((c) => `- ${c.name} (${c.type}): count=${c.count}, unique=${c.uniqueCount}${c.type === 'numeric' ? `, mean=${c.mean?.toFixed(2)}, min=${c.min}, max=${c.max}` : ''}`)
      .join('\n');

    const systemPrompt: OllamaChatMessage = {
      role: 'system',
      content: `You are an expert AI Data Science Copilot inside Data Studio.
You assist users (especially non-experts) in processing, analyzing, transforming, and visualizing data.

ACTIVE DATASET IN MEMORY:
- Name: "${currentDatasetName}"
- Rows: ${rawDataset.length}
- Columns: ${allColumnNames.join(', ')}

COLUMNS & TYPES:
${colSummaryStr}

FIRST 3 SAMPLE ROWS:
\`\`\`json
${sampleRows}
\`\`\`

GUIDELINES:
1. Provide concise, friendly explanations in plain language for non-experts.
2. When generating code to run in Data Studio, provide executable JavaScript/DataStudio code that works directly with 'df'.
Available sandbox functions:
- summary(df) - descriptive statistics
- glimpse(df) - inspect schema and sample rows
- names(df) - list column names
- head(df, n) / tail(df, n)
- cor(df) - correlation matrix
- fitLinearModel(dependentVar, [independentVars]) - OLS regression
- plot({ type: 'scatter'|'bar'|'line'|'area', x: '...', y: '...', color: '...', title: '...' })
- anova(numericVar, groupVar)
- tTest(var1, var2)
- Array methods: df.filter(d => ...), df.map(...), df.slice(...)

Always wrap executable code in \`\`\`javascript or \`\`\`js code blocks so the user can insert or run it directly.`,
    };

    const messagesToSend = [systemPrompt, ...newHistory];
    let assistantAccumulated = '';

    try {
      await streamOllamaChat(
        DEFAULT_OLLAMA_ENDPOINT,
        {
          model: selectedModel,
          messages: messagesToSend,
          temperature: 0.3,
        },
        (fullText) => {
          assistantAccumulated = fullText;
          setChatMessages([...newHistory, { role: 'assistant', content: fullText }]);
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      );
    } catch (err: any) {
      setChatMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: `⚠️ Failed to query local Ollama (${err.message}). Make sure Ollama daemon is running at \`http://localhost:11434\` and model \`${selectedModel}\` is installed.`,
        },
      ]);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Plain-English AI Explanation of latest output
  const handleExplainOutputWithAI = () => {
    setRightPanelTab('assistant');
    const prompt = `Please explain this output in clear, simple terms for someone who is not a data science expert. What does it mean practically?\n\n\`\`\`\n${consoleOutput.slice(0, 1500)}\n\`\`\``;
    handleSendChatMessage(prompt);
  };

  // Helper to extract code from markdown block
  const extractFirstCodeBlock = (text: string): string | null => {
    const match = text.match(/```(?:javascript|js|r)?\n([\s\S]*?)```/i);
    return match ? match[1].trim() : null;
  };

  // Generate Current R Script for RStudio Export
  const currentRScript = useMemo(() => {
    return generateRScript({
      datasetName: currentDatasetName,
      chart: activePlot ? {
        type: activePlot.type,
        x: activePlot.x,
        y: activePlot.y,
        color: activePlot.color,
        title: activePlot.title,
      } : undefined,
      regression: activeRegression ? {
        y: activeRegression.dependentVar,
        x: activeRegression.independentVars,
      } : undefined,
    });
  }, [currentDatasetName, activePlot, activeRegression]);

  // Sidebar Links (Uses exact same structure as ai-hub to prevent glitching)
  const sidebarLinks: Links[] = [
    {
      label: 'Code IDE',
      icon: <IconTerminal2 size={18} stroke={2} className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'ide',
      onClick: () => setActiveTab('ide'),
      badge: 'IDE',
    },
    {
      label: 'Data Table',
      icon: <IconTable size={18} stroke={2} className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'table',
      onClick: () => setActiveTab('table'),
      badge: `${rawDataset.length} rows`,
    },
    {
      label: 'Visualizer',
      icon: <IconChartBar size={18} stroke={2} className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'visualizer',
      onClick: () => setActiveTab('visualizer'),
      badge: 'ggplot2',
    },
    {
      label: 'R Export',
      icon: <IconDownload size={18} stroke={2} className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'export',
      onClick: () => setActiveTab('export'),
      badge: '.R',
    },
  ];

  // Mobile Brand Header (Identical pattern to AI Studio)
  const mobileBrand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-xs">
        <IconMathFunction size={16} stroke={2} />
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-xs text-neutral-900 dark:text-white leading-none">
          Data Studio
        </span>
        <span className="text-[10px] font-mono text-neutral-500">
          R Studio &amp; AI Copilot
        </span>
      </div>
    </div>
  );

  // Paginated Data Table
  const filteredTableRows = useMemo(() => {
    if (!tableSearch.trim()) return rawDataset;
    const q = tableSearch.toLowerCase();
    return rawDataset.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rawDataset, tableSearch]);

  const paginatedRows = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return filteredTableRows.slice(start, start + pageSize);
  }, [filteredTableRows, tablePage]);

  const totalPages = Math.ceil(filteredTableRows.length / pageSize) || 1;

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-black">
        <div className="flex items-center gap-3 font-mono text-sm text-neutral-600 dark:text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
          <span>Starting Data Studio IDE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-[var(--color-paper)] text-[var(--color-ink)] font-sans antialiased">
      {/* 🧭 Collapsible Sidebar (Glitch-Free Animated Architecture from AI Studio) */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody brand={mobileBrand} className="justify-between gap-6 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c]">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Header Brand */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-mono font-bold select-none text-base">
                R
              </div>
              <motion.div
                animate={{
                  display: sidebarOpen ? 'flex' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="flex flex-col truncate"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-[var(--color-ink)]">Data Studio</span>
                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                    R+AI
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-[var(--color-ink-muted)]">
                  Coding &amp; Statistical IDE
                </span>
              </motion.div>
            </div>

            {/* Sidebar Navigation Links */}
            <div className="mt-6 flex flex-col gap-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>

            {/* Canonical Datasets Switcher */}
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <motion.div
                animate={{
                  display: sidebarOpen ? 'flex' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="flex items-center justify-between mb-2 px-1"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
                  Sample Datasets
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">R Studio</span>
              </motion.div>

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
                    <motion.span
                      animate={{
                        display: sidebarOpen ? 'inline-block' : 'none',
                        opacity: sidebarOpen ? 1 : 0,
                      }}
                      className="text-[10px] text-neutral-400 font-mono"
                    >
                      {sample.rows} × {sample.cols}
                    </motion.span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer: Ollama Status & Back to Resursee */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 mt-auto space-y-2">
            {/* Ollama Status Pill & Start/Stop Action */}
            <div
              onClick={() => {
                if (ollamaStatus === 'connected') {
                  handleStopOllama();
                } else {
                  handleStartOllama();
                }
              }}
              className="group flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 cursor-pointer transition-all"
              title={ollamaStatus === 'connected' ? 'Click to stop Ollama daemon' : 'Click to start Ollama daemon'}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    ollamaStatus === 'connected'
                      ? 'bg-neutral-900 dark:bg-white'
                      : ollamaStatus === 'checking' || isStartingOllama || isStoppingOllama
                      ? 'bg-neutral-500 animate-pulse'
                      : 'bg-neutral-400'
                  )}
                />
                <motion.span
                  animate={{
                    display: sidebarOpen ? 'inline-block' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate"
                >
                  {isStartingOllama
                    ? 'Starting Engine...'
                    : isStoppingOllama
                    ? 'Stopping Engine...'
                    : ollamaStatus === 'connected'
                    ? `Ollama (${installedModels.length} models)`
                    : ollamaStatus === 'checking'
                    ? 'Connecting...'
                    : 'Ollama Standby (11434)'}
                </motion.span>
              </div>
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="text-[10px] font-mono text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors"
              >
                {ollamaStatus === 'connected' ? 'Stop' : 'Start'}
              </motion.span>
            </div>

            {/* Return to Resursee */}
            <SidebarLink
              link={{
                label: 'Back to Resursee',
                href: '/#apps',
                icon: <IconArrowLeft size={16} className="shrink-0 text-neutral-500" />,
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* 🖥️ Main Studio Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-neutral-100/70 dark:bg-black">
        {/* Top Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Data Studio — Coding &amp; Statistical IDE
            </h1>

            {/* Active Data Frame Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
              <span className="font-bold">{currentDatasetName}</span>
              <span className="text-neutral-400">
                ({rawDataset.length} obs. of {allColumnNames.length} variables)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Upload Button */}
            <label className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer shadow-2xs">
              <IconFileSpreadsheet size={15} />
              <span className="hidden sm:inline">Upload File</span>
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.xls,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Start / Stop Ollama Button (Like AI Studio) */}
            {ollamaStatus === 'connected' ? (
              <button
                type="button"
                onClick={handleStopOllama}
                disabled={isStoppingOllama}
                title="Stop local Ollama background daemon"
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              >
                {isStoppingOllama ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse shrink-0" />
                    <span>Stopping...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                    <IconPlayerStop size={13} />
                    <span>Stop Ollama</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOllama}
                disabled={isStartingOllama}
                title="Launch local Ollama background daemon"
                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              >
                {isStartingOllama ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-900 animate-pulse shrink-0" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
                    <IconPlayerPlay size={13} />
                    <span>Start Ollama</span>
                  </>
                )}
              </button>
            )}

            {/* Show R Script Modal Button */}
            <button
              type="button"
              onClick={() => setShowRScriptModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer shadow-2xs"
            >
              <IconCode size={15} />
              <span className="hidden md:inline">R Script</span>
            </button>

            {/* Run Code Primary Button */}
            <button
              type="button"
              disabled={isExecuting}
              onClick={() => handleRunCode()}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black px-3.5 py-1.5 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <IconPlayerPlay size={15} />
              <span>Run (Cmd+↵)</span>
            </button>

            {/* Dark Mode / Light Mode Toggle */}
            <ThemeToggle className="shrink-0" />
          </div>
        </header>

        {/* Dynamic Main Workspace: VIEW 1 — CODE IDE (Split Screen: Code + Output + Ollama) */}
        {activeTab === 'ide' && (
          <div className="flex-1 overflow-hidden p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column (7 cols): Code Editor + Execution Output Canvas */}
            <div className="lg:col-span-7 flex flex-col gap-4 h-full overflow-hidden">
              {/* Top: Source Code Editor */}
              <div className="flex-1 min-h-[260px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] shadow-xs flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-neutral-400" />
                    <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      script.js (Data Studio Runtime)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Template Selector */}
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'summary') {
                          setScriptCode(`// 1. Data Summary & Glimpse\nsummary(df);\nglimpse(df);`);
                        } else if (val === 'scatter') {
                          setScriptCode(`// 2. Scatter Plot\nplot({\n  type: 'scatter',\n  x: '${numericColumns[0] || 'x'}',\n  y: '${numericColumns[1] || 'y'}',\n  color: '${categoricalColumns[0] || ''}',\n  title: 'Scatter Plot'\n});`);
                        } else if (val === 'lm') {
                          setScriptCode(`// 3. Linear Regression Model\nfitLinearModel('${numericColumns[1] || 'y'}', ['${numericColumns[0] || 'x'}']);`);
                        } else if (val === 'cor') {
                          setScriptCode(`// 4. Correlation Matrix\ncor(df);`);
                        } else if (val === 'filter') {
                          setScriptCode(`// 5. Filter & Transform\nconst filtered = df.filter(r => r.${numericColumns[0] || 'x'} > 0);\nsummary(filtered);`);
                        }
                      }}
                      className="h-7 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-[11px] font-mono text-neutral-800 dark:text-neutral-200"
                    >
                      <option value="">Select Code Template...</option>
                      <option value="summary">1. Summary &amp; Glimpse</option>
                      <option value="scatter">2. Scatter Plot</option>
                      <option value="lm">3. Linear Regression (lm)</option>
                      <option value="cor">4. Correlation Matrix</option>
                      <option value="filter">5. Filter &amp; Transform</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setScriptCode('')}
                      className="text-[11px] font-mono text-neutral-400 hover:text-neutral-800 dark:hover:text-white px-1.5 py-0.5"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative flex">
                  {/* Textarea Code Editor with Monospace Font */}
                  <textarea
                    ref={editorRef}
                    value={scriptCode}
                    onChange={(e) => setScriptCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="// Write your data analysis script here... Press Cmd+Enter to run"
                    spellCheck={false}
                    className="w-full h-full p-3.5 font-mono text-xs text-neutral-900 dark:text-neutral-100 bg-transparent resize-none focus:outline-hidden leading-relaxed"
                  />
                </div>
              </div>

              {/* Bottom: Execution Output Canvas (Console, Plot, Model, Data Preview) */}
              <div className="flex-1 min-h-[260px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] shadow-xs flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900">
                  {/* Output Tabs */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setOutputMode('console')}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        outputMode === 'console'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Console
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputMode('plot')}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        outputMode === 'plot'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Plot
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputMode('model')}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        outputMode === 'model'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Model (lm)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Explain Output with AI Button */}
                    <button
                      type="button"
                      onClick={handleExplainOutputWithAI}
                      className="flex items-center gap-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
                    >
                      <IconSparkles size={13} />
                      <span>Explain with AI</span>
                    </button>
                  </div>
                </div>

                {/* Output Canvas Body */}
                <div className="flex-1 overflow-y-auto p-3.5 font-mono text-xs bg-neutral-50/40 dark:bg-[#070707]">
                  {outputMode === 'console' && (
                    <pre className="whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {consoleOutput}
                    </pre>
                  )}

                  {outputMode === 'plot' && (
                    <div className="h-full w-full min-h-[220px] flex flex-col justify-between">
                      <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                        {activePlot?.title || 'Interactive Visualization'}
                      </div>
                      <div className="h-[210px] w-full">
                        {activePlot?.type === 'scatter' && (
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                              <XAxis dataKey={activePlot.x} name={activePlot.x} stroke="#88888880" fontSize={10} />
                              <YAxis dataKey={activePlot.y} name={activePlot.y} stroke="#88888880" fontSize={10} />
                              <RechartsTooltip
                                content={<StudioCustomTooltip />}
                                contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px', color: '#ffffff' }}
                                itemStyle={{ color: '#ffffff' }}
                                labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                                cursor={{ stroke: '#88888840', strokeWidth: 1 }}
                              />
                              <Scatter data={rawDataset} fill="#737373" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        )}
                        {activePlot?.type === 'bar' && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rawDataset.slice(0, 25)} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                              <XAxis dataKey={activePlot.x} stroke="#88888880" fontSize={10} />
                              <YAxis stroke="#88888880" fontSize={10} />
                              <RechartsTooltip
                                content={<StudioCustomTooltip />}
                                contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px', color: '#ffffff' }}
                                itemStyle={{ color: '#ffffff' }}
                                labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                                cursor={{ fill: '#88888815' }}
                              />
                              <Bar dataKey={activePlot.y || activePlot.x} fill="#737373" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                        {activePlot?.type === 'line' && (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={rawDataset} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                              <XAxis dataKey={activePlot.x} stroke="#88888880" fontSize={10} />
                              <YAxis stroke="#88888880" fontSize={10} />
                              <RechartsTooltip
                                content={<StudioCustomTooltip />}
                                contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px', color: '#ffffff' }}
                                itemStyle={{ color: '#ffffff' }}
                                labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                                cursor={{ stroke: '#88888840', strokeWidth: 1 }}
                              />
                              <Line type="monotone" dataKey={activePlot.y} stroke="#737373" strokeWidth={2} dot={{ r: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  )}

                  {outputMode === 'model' && (
                    <div className="space-y-3">
                      {activeRegression ? (
                        <>
                          <pre className="whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200">
                            {activeRegression.rSummaryOutput}
                          </pre>
                        </>
                      ) : (
                        <div className="text-neutral-400">
                          No linear model fitted yet. Call <code className="font-bold">fitLinearModel(y, [x1, x2])</code> in the editor to run regression.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Ollama AI Copilot & Dataset Schema Tabs */}
            <div className="lg:col-span-5 flex flex-col h-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] shadow-xs overflow-hidden">
              {/* Right Header Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('assistant')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rightPanelTab === 'assistant'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <IconSparkles size={14} />
                    <span>Local LLM Copilot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightPanelTab('schema')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rightPanelTab === 'schema'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <IconTable size={14} />
                    <span>Data Schema</span>
                  </button>
                </div>

                {/* Model Selector Dropdown */}
                {rightPanelTab === 'assistant' && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="h-7 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-[11px] font-mono text-neutral-800 dark:text-neutral-200"
                    >
                      {installedModels.length > 0 ? (
                        installedModels.map((m) => (
                          <option key={m.name} value={m.name}>
                            {m.name}
                          </option>
                        ))
                      ) : (
                        <option value="qwen2.5-coder">qwen2.5-coder (local)</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* TAB A: OLLAMA AI ASSISTANT */}
              {rightPanelTab === 'assistant' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Chat Conversation History */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
                    {chatMessages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      const codeBlock = extractFirstCodeBlock(msg.content);

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[92%] rounded-2xl p-3 leading-relaxed ${
                              isUser
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-medium'
                                : 'bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>

                            {/* 1-Click Code Insertion Buttons for Assistant Code Blocks */}
                            {!isUser && codeBlock && (
                              <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setScriptCode((prev) => prev + '\n\n' + codeBlock);
                                  }}
                                  className="flex items-center gap-1 rounded-md bg-neutral-200 dark:bg-neutral-800 px-2 py-1 text-[10.5px] font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                                >
                                  <IconPlus size={12} />
                                  <span>Insert in Editor</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setScriptCode(codeBlock);
                                    setTimeout(() => handleRunCode(codeBlock), 50);
                                  }}
                                  className="flex items-center gap-1 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-black px-2 py-1 text-[10.5px] font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                                >
                                  <IconPlayerPlay size={12} />
                                  <span>Run Now</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Quick Inquiry Chips for Non-Experts */}
                  <div className="px-3.5 py-2 border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center gap-1.5 overflow-x-auto">
                    {[
                      'Suggest 3 analysis ideas',
                      'Plot a scatter chart',
                      'Fit a regression model',
                      'Explain summary statistics',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSendChatMessage(chip)}
                        className="shrink-0 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[10.5px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input Bar */}
                  <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Ask ${selectedModel} about ${currentDatasetName}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendChatMessage();
                        }
                      }}
                      className="flex-1 h-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingAI || !chatInput.trim()}
                      onClick={() => handleSendChatMessage()}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <IconSend size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB B: DATA SCHEMA & ATTRIBUTES */}
              {rightPanelTab === 'schema' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* File Upload Zone */}
                  <div className="p-3.5 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-center">
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                       Upload Custom Data
                    </div>
                    <p className="text-[11px] text-neutral-500 mb-3">
                      Drop CSV, Excel, or JSON. Processed locally in memory.
                    </p>
                    <label className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black px-3 py-1.5 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer">
                      <IconFileSpreadsheet size={14} />
                      <span>Browse Files</span>
                      <input
                        type="file"
                        accept=".csv,.tsv,.xlsx,.xls,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Columns List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                        Columns ({columnSummaries.length})
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {rawDataset.length} rows
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {columnSummaries.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono"
                        >
                          <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[150px]">
                            {col.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {col.type === 'numeric' && col.mean !== undefined && (
                              <span className="text-[10px] text-neutral-400">
                                μ={col.mean.toFixed(1)}
                              </span>
                            )}
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {col.type === 'numeric' ? 'num' : 'chr'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: DATA TABLE VIEW (View(df)) */}
        {activeTab === 'table' && (
          <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] shadow-xs flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Data Table Browser — View(df)
                  </h2>
                  <span className="text-xs text-neutral-400 font-mono">
                    {filteredTableRows.length} matching rows in memory
                  </span>
                </div>
                <div className="relative">
                  <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search rows..."
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setTablePage(1);
                    }}
                    className="h-8 w-56 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 pl-8 pr-3 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-x-auto overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                      <th className="px-4 py-2.5 w-12 text-center text-neutral-400">#</th>
                      {allColumnNames.map((col) => (
                        <th key={col} className="px-4 py-2.5 font-bold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {paginatedRows.map((row, idx) => {
                      const rowNum = (tablePage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                          <td className="px-4 py-2 text-center text-neutral-400">{rowNum}</td>
                          {allColumnNames.map((col) => (
                            <td key={col} className="px-4 py-2 truncate max-w-[200px]">
                              {row[col] !== undefined && row[col] !== null ? String(row[col]) : 'NA'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-neutral-50 dark:bg-neutral-900">
                <span className="text-xs font-mono text-neutral-500">
                  Page {tablePage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={tablePage <= 1}
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2.5 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={tablePage >= totalPages}
                    onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2.5 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DEDICATED VISUALIZER (ggplot2) */}
        {activeTab === 'visualizer' && (
          <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] shadow-xs flex-1 flex flex-col p-5">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Grammar of Graphics Plot Studio
                  </h2>
                  <span className="text-xs text-neutral-400 font-mono">
                    ggplot(df, aes(x = {activePlot?.x}, y = {activePlot?.y})) + geom_{activePlot?.type}()
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRScriptModal(true)}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <IconCode size={14} />
                  <span>Get ggplot2 Code</span>
                </button>
              </div>

              <div className="flex-1 w-full min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                    <XAxis dataKey={activePlot?.x || numericColumns[0]} name={activePlot?.x} stroke="#88888880" fontSize={11} />
                    <YAxis dataKey={activePlot?.y || numericColumns[1]} name={activePlot?.y} stroke="#88888880" fontSize={11} />
                    <RechartsTooltip
                      content={<StudioCustomTooltip />}
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px', color: '#ffffff' }}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                      cursor={{ stroke: '#88888840', strokeWidth: 1 }}
                    />
                    <Scatter data={rawDataset} fill="#737373" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: REPRODUCIBLE R EXPORT */}
        {activeTab === 'export' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-neutral-400">.R</span>
                  <h3 className="text-sm font-bold mt-1">RStudio Script</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">
                    Download reproducible R script with Tidyverse and ggplot2 syntax.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([currentRScript], { type: 'text/plain;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${currentDatasetName}_analysis.R`;
                    a.click();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <IconDownload size={14} />
                  <span>Download .R Script</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-neutral-400">.CSV</span>
                  <h3 className="text-sm font-bold mt-1">Export Data CSV</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">
                    Download current dataset as formatted CSV spreadsheet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const csv = Papa.unparse(rawDataset);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${currentDatasetName}.csv`;
                    a.click();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <IconDownload size={14} />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-neutral-400">.XLSX</span>
                  <h3 className="text-sm font-bold mt-1">Excel Workbook</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">
                    Export dataset formatted for Microsoft Excel and Google Sheets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet(rawDataset);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, currentDatasetName);
                    XLSX.writeFile(wb, `${currentDatasetName}.xlsx`);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <IconDownload size={14} />
                  <span>Download XLSX</span>
                </button>
              </div>
            </div>

            {/* Code Mirror */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5">
              <div className="flex items-center justify-between mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                  Full Reproducible R Script
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentRScript);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700"
                >
                  {copiedCode ? <IconCheck size={13} /> : <IconCopy size={13} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200 leading-relaxed max-h-96">
                {currentRScript}
              </pre>
            </div>
          </div>
        )}
      </main>

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
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-bold cursor-pointer"
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
                onClick={() => {
                  navigator.clipboard.writeText(currentRScript);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                {copiedCode ? <IconCheck size={15} /> : <IconCopy size={15} />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([currentRScript], { type: 'text/plain;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentDatasetName}_analysis.R`;
                  a.click();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <IconDownload size={15} />
                <span>Download .R File</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Local-Only Feature Notice Modal (Similar to AI Studio) */}
      <AnimatePresence>
        {showLocalNoticeModal && (
          <div
            onClick={() => handleDismissNotice()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-6 shadow-2xl space-y-4 text-left"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs">
                    <IconShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                      100% Local &amp; Private Feature
                    </h3>
                    <p className="text-[11px] font-mono text-neutral-500">
                      Zero cloud data transfer • Client-side compute
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismissNotice()}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Explanatory Body */}
              <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>
                  <strong>Data Studio</strong> is designed to run entirely on your physical hardware. Your datasets, spreadsheets, and scripts never touch an external cloud server.
                </p>

                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-3.5 space-y-2 font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
                  <div className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0 mt-1.5" />
                    <span><strong>Browser Sandbox:</strong> All data parsing (PapaParse, SheetJS), computations (jStat), and charts (Recharts) run 100% in your browser memory.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0 mt-1.5" />
                    <span><strong>Local LLM Copilot:</strong> Inference runs directly on your local GPU/CPU via Ollama (<code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded text-[10px]">http://localhost:11434</code>) with zero subscription fees or data egress.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0 mt-1.5" />
                    <span><strong>R Studio Bridge:</strong> Export reproducible R/Tidyverse scripts anytime to run directly on desktop RStudio.</span>
                  </div>
                </div>
              </div>

              {/* Checkbox: Don't show again */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dontShowAgainNotice}
                    onChange={(e) => setDontShowAgainNotice(e.target.checked)}
                    className="rounded border-neutral-300 text-neutral-900 dark:text-white cursor-pointer"
                  />
                  <span>Don&apos;t show again this session</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleDismissNotice()}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Got It, Start Coding
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
