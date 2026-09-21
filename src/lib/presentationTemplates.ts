import { TemplatePreset } from '@/types/presentation';

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'ai-system-pitch',
    title: 'AI & Machine Learning System Pitch',
    category: 'Artificial Intelligence',
    description: 'Executive pitch deck for autonomous AI agents, multi-modal vision systems, and edge inference pipelines.',
    slidesCount: 6,
    themeId: 'frontier',
    transition: 'fade',
    tags: ['AI Agents', 'LLM', 'Inference', 'Enterprise'],
    slides: [
      {
        id: 'ai-s1',
        layout: 'title-cover',
        tag: 'Executive Overview',
        title: 'Next-Gen Autonomous AI Inference Pipeline',
        subtitle: 'Production-Grade Edge & Hybrid Model Orchestration with 100% Data Privacy',
        notes: 'Introduce the core thesis: moving compute closer to data without sacrificing frontier model reasoning.',
      },
      {
        id: 'ai-s2',
        layout: 'split-columns',
        tag: 'Architectural Paradigm',
        title: 'Cloud Latency vs. On-Device Autonomy',
        subtitle: 'Why hybrid edge architectures outperform monolithic API pipelines in latency and compliance',
        columns: [
          {
            heading: 'Legacy Cloud API Bottlenecks',
            content: [
              'Third-party cloud data transfer introducing 350ms+ round-trip latency',
              'Per-token variable expenditure scaling linearly with user base',
              'Data residency & HIPAA/GDPR exfiltration vulnerabilities',
              'External outage vulnerabilities impacting critical SLA availability',
            ],
          },
          {
            heading: 'Local Hybrid Edge Architecture',
            content: [
              'Sub-15ms local response times utilizing on-device GPU acceleration',
              'Zero per-token inference marginal cost on edge hardware',
              'Air-gapped data retention with guaranteed zero cloud telemetry',
              'Graceful degradation with autonomous offline operational modes',
            ],
          },
        ],
        notes: 'Emphasize the financial and compliance advantage of running edge models.',
      },
      {
        id: 'ai-s3',
        layout: 'stats-metrics',
        tag: 'Benchmark Metrics',
        title: 'Empirical Performance Metrics & Scaling',
        subtitle: 'Key throughput and operational benchmarks recorded across production testing',
        metrics: [
          { label: 'Time to First Token', value: '14.2 ms', change: '-82% vs Cloud' },
          { label: 'Sustained Throughput', value: '78.4 tok/s', change: '+3.4x vs vLLM' },
          { label: 'Peak VRAM Footprint', value: '4.8 GB', change: 'Quantized INT4' },
          { label: 'Infrastructure Savings', value: '$140k/yr', change: '99.4% Gross Margin' },
        ],
        bullets: [
          'Optimized WebGPU and ONNX kernels with custom flash-attention execution',
          'Autonomous multi-model routing prioritizing lightweight SLMs for 70% of intents',
          'Automatic tier escalation to 70B parameters only when deep reasoning is needed',
        ],
        notes: 'Walk the executive stakeholders through the cost reduction and speedup.',
      },
      {
        id: 'ai-s4',
        layout: 'code-architecture',
        tag: 'SDK Quickstart',
        title: 'Zero-Config Agentic Integration',
        subtitle: 'Execute multi-agent workflows with streaming token inference in 5 lines of code',
        codeSnippet: {
          language: 'typescript',
          code: `import { AgentCluster, OllamaProvider } from '@resursee/engine';

const engine = new AgentCluster({
  provider: new OllamaProvider({ model: 'qwen2.5-coder:7b' }),
  privacy: 'air-gapped',
  fallback: 'webgpu-whisper',
});

// Stream reasoning steps with zero telemetry
const response = await engine.reason({
  prompt: 'Analyze system telemetry and optimize buffer allocation',
  onToken: (chunk) => process.stdout.write(chunk),
});`,
          caption: 'Listing 1: Asynchronous streaming agent loop with fallback safety',
        },
        notes: 'Show how developers can drop this into existing microservices in minutes.',
      },
      {
        id: 'ai-s5',
        layout: 'timeline-roadmap',
        tag: 'Deployment Roadmap',
        title: 'Engineering Rollout & Phased Milestones',
        subtitle: 'From local sandboxing to global fleet deployment across 180 days',
        timeline: [
          { step: 'Phase 1', title: 'Local Core Sandbox', description: 'Validate 7B & 14B model weights on edge hardware clusters.' },
          { step: 'Phase 2', title: 'Enterprise RAG Pilot', description: 'Ingest vector embeddings and secure document vaults with zero cloud leak.' },
          { step: 'Phase 3', title: 'Federated Telemetry', description: 'Deploy localized fine-tuning loops and continuous evaluation benchmarks.' },
          { step: 'Phase 4', title: 'Global Fleet Live', description: 'Scale production inference across 25,000 active concurrent node instances.' },
        ],
        notes: 'Walk through the 4-phase rollout schedule.',
      },
      {
        id: 'ai-s6',
        layout: 'quote-highlight',
        tag: 'Key Takeaway',
        title: 'Executive Summary & Call to Action',
        subtitle: 'The future of enterprise software is private, resilient, and autonomous',
        quote: {
          text: 'Organizations that own their local neural inference layer will eliminate SaaS tollbooths, preserve ironclad IP privacy, and deliver instant sub-second user experiences.',
          author: 'Chief AI Architect',
          role: 'Resursee Engineering Core',
        },
        bullets: [
          'Phase 1 sandbox environment live today for internal engineering review',
          'Projected break-even within 45 days of infrastructure deployment',
          'Next Step: Provision testing clusters and benchmark local quantization models',
        ],
        notes: 'Wrap up presentation with immediate next action steps.',
      },
    ],
  },
  {
    id: 'microservices-cloud',
    title: 'Cloud Infrastructure & Microservices Architecture',
    category: 'System Architecture',
    description: 'Comprehensive engineering presentation covering distributed event streaming, Kubernetes orchestration, and zero-downtime deployments.',
    slidesCount: 6,
    themeId: 'silicon',
    transition: 'slide-horizontal',
    tags: ['Kubernetes', 'Microservices', 'Kafka', 'DevOps'],
    slides: [
      {
        id: 'cloud-s1',
        layout: 'title-cover',
        tag: 'System Architecture',
        title: 'Enterprise Distributed Microservices Platform',
        subtitle: 'Scaling High-Throughput Event Sourcing, Kubernetes Mesh & Zero-Trust Telemetry',
        notes: 'Welcome engineering leads and architects to the quarterly architecture review.',
      },
      {
        id: 'cloud-s2',
        layout: 'split-columns',
        tag: 'Monolith Decoupling',
        title: 'Strategic Decoupling & Service Boundaries',
        subtitle: 'Transitioning from legacy monolithic relational bottlenecks to autonomous bounded contexts',
        columns: [
          {
            heading: 'Core Service Domains',
            content: [
              'Identity & IAM: Stateless JWT verification with Redis token blacklist',
              'Ingestion Ingress: Envoy Proxy edge gateway handling 250k req/sec',
              'Data Engine: Apache Kafka event stream with Avro schema registry',
              'Storage Plane: PostgreSQL multi-tenant partitions with strict Row Level Security',
            ],
          },
          {
            heading: 'Resilience Guarantees',
            content: [
              'Circuit breaker patterns with automated exponential backoff',
              'Idempotent event processing preventing duplicate database writes',
              'Distributed tracing with OpenTelemetry and correlation IDs',
              'Active-active cross-region failover with under 3s RTO target',
            ],
          },
        ],
        notes: 'Explain domain boundaries and how team autonomy is enforced.',
      },
      {
        id: 'cloud-s3',
        layout: 'stats-metrics',
        tag: 'SLA Telemetry',
        title: 'Platform Reliability & Performance Metrics',
        subtitle: 'Production SLA indicators measured over 90 consecutive rolling days',
        metrics: [
          { label: 'Service Uptime', value: '99.995%', change: 'Zero Incidents' },
          { label: 'p99 Ingress Latency', value: '18.4 ms', change: '-45% QoQ' },
          { label: 'Daily Events Processed', value: '1.42 B', change: '+38% Volume' },
          { label: 'Cluster Utilization', value: '74.1%', change: 'Auto-Scaled' },
        ],
        bullets: [
          'Kubernetes Horizontal Pod Autoscaler dynamically scales from 20 to 180 pods',
          'Zero packet drops during cluster maintenance via graceful connection draining',
          'Automated canary releases with progressive 5% to 100% traffic shifting',
        ],
        notes: 'Show how the new architecture handled peak traffic without latency spikes.',
      },
      {
        id: 'cloud-s4',
        layout: 'code-architecture',
        tag: 'Infrastructure As Code',
        title: 'Declarative Kubernetes Service Topology',
        subtitle: 'Standardized Helm deployment template with health probes and resource limits',
        codeSnippet: {
          language: 'yaml',
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ingestion-engine
  namespace: production
spec:
  replicas: 12
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: worker
        image: resursee/ingestion:v2.4.1
        resources:
          limits: { cpu: "2000m", memory: "4Gi" }
          requests: { cpu: "500m", memory: "1Gi" }
        livenessProbe:
          httpGet: { path: /healthz, port: 8080 }
          initialDelaySeconds: 5`,
          caption: 'Listing 2: Zero-downtime rolling deployment with explicit resource boundaries',
        },
        notes: 'Point out maxUnavailable: 0 which guarantees zero dropped connections during deploys.',
      },
      {
        id: 'cloud-s5',
        layout: 'timeline-roadmap',
        tag: 'Infrastructure Sprints',
        title: 'Platform Modernization Timeline',
        subtitle: 'Key delivery checkpoints across upcoming engineering quarters',
        timeline: [
          { step: 'Q1', title: 'Service Mesh Deployment', description: 'Roll out Istio mTLS encryption across 100% of inter-pod communications.' },
          { step: 'Q2', title: 'Global Database Sharding', description: 'Implement geographic partitioning to achieve compliance with EU data sovereignty.' },
          { step: 'Q3', title: 'Chaos Engineering Drills', description: 'Automate weekly random node termination drills via Chaos Mesh.' },
          { step: 'Q4', title: 'FinOps Optimization', description: 'Adopt Graviton ARM instances to cut monthly compute bill by an estimated 28%.' },
        ],
        notes: 'Review the quarterly objectives with leadership.',
      },
      {
        id: 'cloud-s6',
        layout: 'quote-highlight',
        tag: 'Architecture Vision',
        title: 'Guiding Architectural Philosophy',
        subtitle: 'Reliability is not an accident; it is the natural consequence of disciplined decoupling',
        quote: {
          text: 'Design every system assuming that networks will partition, nodes will crash, and downstream dependencies will stall. When resilience is built into the protocol, scale becomes effortless.',
          author: 'VP of Infrastructure Engineering',
          role: 'Global Platform Team',
        },
        bullets: [
          'All services must support backward-compatible API versioning',
          'Production deploy gates require 100% green automated integration tests',
          'On-call rotations supported by automated self-healing runbooks',
        ],
        notes: 'Conclude with core operational principles.',
      },
    ],
  },
  {
    id: 'engineering-roadmap',
    title: 'Quarterly Engineering Roadmap',
    category: 'Product & Planning',
    description: 'Executive roadmap presentation highlighting key deliverables, OKR metrics, technical debt reduction, and team resource allocation.',
    slidesCount: 5,
    themeId: 'obsidian',
    transition: 'fade',
    tags: ['Roadmap', 'OKRs', 'Sprint', 'Planning'],
    slides: [
      {
        id: 'road-s1',
        layout: 'title-cover',
        tag: 'Executive Strategy',
        title: 'Engineering Strategic Roadmap: FY26',
        subtitle: 'Prioritizing Developer Velocity, Security Hardening, and Autonomous Platform Capabilities',
        notes: 'Open the quarterly engineering planning session.',
      },
      {
        id: 'road-s2',
        layout: 'stats-metrics',
        tag: 'OKR Key Results',
        title: 'Top-Level Engineering Performance Targets',
        subtitle: 'Quantitative benchmarks aligned directly with business scaling metrics',
        metrics: [
          { label: 'Deploy Cycle Time', value: '4.2 min', change: 'Down from 28 min' },
          { label: 'Test Coverage', value: '94.8%', change: '+12% Target Met' },
          { label: 'Technical Debt Ratio', value: '8.4%', change: 'Under 10% Goal' },
          { label: 'Customer Bug Backlog', value: '3 items', change: 'Zero P0 Bugs' },
        ],
        bullets: [
          'Turbopack & Next.js 16 build optimizations reduced CI test execution time by 65%',
          'Strict TypeScript strict-mode enforcement eliminated 98% of runtime undefined crashes',
          'Automated security audits integrated directly into GitHub Actions push triggers',
        ],
        notes: 'Walk through progress on key engineering metrics.',
      },
      {
        id: 'road-s3',
        layout: 'split-columns',
        tag: 'Feature Allocation',
        title: 'Core Deliverables vs. Technical Maintenance',
        subtitle: 'Balanced resource allocation across product features and foundational stability',
        columns: [
          {
            heading: 'Strategic Feature Deliverables (70%)',
            content: [
              'Presentation Studio: In-browser presentation authoring with PPTX export',
              'AI Transcriber: Local ONNX Whisper engine with bilingual diarization',
              'ESP32 IoT Cloud: Real-time sensor dashboard with live relay switches',
              'Plant Vision AI: Foliar crop disease scanner with camera viewfinder',
            ],
          },
          {
            heading: 'Foundational Quality & Security (30%)',
            content: [
              '100% Row Level Security (RLS) enforcement on all database schemas',
              'Sliding-window rate limiting on all API routes to mitigate bot scrapers',
              'Tauri v2 native desktop application packaging for macOS and Windows',
              'Migration to modular CSS tokens and elimination of unnecessary re-renders',
            ],
          },
        ],
        notes: 'Explain the 70/30 split between features and foundational health.',
      },
      {
        id: 'road-s4',
        layout: 'timeline-roadmap',
        tag: 'Milestone Timetable',
        title: 'Sprint Milestones & Release Windows',
        subtitle: 'Key launch dates scheduled across the calendar year',
        timeline: [
          { step: 'Sprint 1-3', title: 'App Suite Unification', description: 'Standardize collapsible sidepanel navigation across all five internal applications.' },
          { step: 'Sprint 4-6', title: 'Local AI Ecosystem', description: 'Enable offline Ollama inference with 1-click start/stop background daemons.' },
          { step: 'Sprint 7-9', title: 'Enterprise Hardening', description: 'Run comprehensive penetration audits and achieve zero-vulnerability certification.' },
          { step: 'Sprint 10-12', title: 'Public v1.0 Launch', description: 'Package cross-platform desktop installers and open-source public documentation.' },
        ],
        notes: 'Check for resource constraints or cross-team dependencies.',
      },
      {
        id: 'road-s5',
        layout: 'bullets-points',
        tag: 'Action Plan',
        title: 'Resource Commitments & Immediate Next Steps',
        subtitle: 'Alignment required from engineering leads and product stakeholders today',
        bullets: [
          'Finalize PR reviews for Presentation Studio slide layout and PPTX export modules',
          'Deploy updated staging builds to internal dogfooding testers by Friday',
          'Schedule sprint kickoffs for next-generation hardware telemetry expansion',
          'Establish weekly bug triage hours to maintain zero-P0 backlog SLA',
        ],
        notes: 'Ask for final alignment and questions.',
      },
    ],
  },
  {
    id: 'cybersecurity-audit',
    title: 'Zero-Trust Cybersecurity & Cloud Audit',
    category: 'Security & Compliance',
    description: 'Executive security presentation covering Row Level Security, IDOR prevention, rate limiting, and vulnerability remediation.',
    slidesCount: 5,
    themeId: 'cyber',
    transition: 'slide-vertical',
    tags: ['Security', 'Zero-Trust', 'RLS', 'Compliance'],
    slides: [
      {
        id: 'sec-s1',
        layout: 'title-cover',
        tag: 'Security Posture Review',
        title: 'Zero-Trust Architecture & Threat Surface Audit',
        subtitle: 'Defense-in-Depth Assessment: Row-Level Security, Anti-IDOR Scoping, and Cryptographic Safeguards',
        notes: 'Convene the security governance review with C-suite and lead engineers.',
      },
      {
        id: 'sec-s2',
        layout: 'stats-metrics',
        tag: 'Audit Scorecard',
        title: 'Core Compliance & Hardening Scorecard',
        subtitle: 'Empirical verification results from our automated security audit pipeline',
        metrics: [
          { label: 'RLS Table Coverage', value: '100.0%', change: '13/13 Tables Locked' },
          { label: 'Unscoped IDOR Scans', value: '0 Found', change: 'Clean Baseline' },
          { label: 'Brute-Force Throttling', value: '5 req / 5m', change: 'Strictly Enforced' },
          { label: 'Vulnerability Score', value: 'Zero P0/P1', change: 'High Hardening' },
        ],
        bullets: [
          'Every SQL query requires authenticated user_id or organization tenant scoping',
          'Non-sequential UUIDv4 keys used across 100% of public URL route identifiers',
          'Automated static analysis flags any client-supplied ID query lacking tenant scoping',
        ],
        notes: 'Highlight our 100% RLS coverage milestone.',
      },
      {
        id: 'sec-s3',
        layout: 'split-columns',
        tag: 'Security Matrix',
        title: 'Attack Vectors & Hardening Countermeasures',
        subtitle: 'How our layered defenses neutralize modern web vulnerabilities',
        columns: [
          {
            heading: 'High-Risk Threat Vectors',
            content: [
              'Insecure Direct Object References (IDOR) via guessed integer primary keys',
              'Credential stuffing & automated password spraying on authentication endpoints',
              'SQL injection & unauthorized cross-tenant data leakage',
              'Token replay attacks & session hijacking via unencrypted storage',
            ],
          },
          {
            heading: 'Enforced Countermeasures',
            content: [
              'Mandatory WHERE id = :id AND user_id = :uid parameter bindings',
              'Sliding-window IP rate limiting returning HTTP 429 Too Many Requests',
              'PostgreSQL Row Level Security policies enforced directly at the database engine',
              'HttpOnly, Secure, SameSite=Strict cookies with cryptographic HMAC signatures',
            ],
          },
        ],
        notes: 'Explain why database-level RLS provides true defense in depth.',
      },
      {
        id: 'sec-s4',
        layout: 'code-architecture',
        tag: 'Defense Implementation',
        title: 'Declarative PostgreSQL Row Level Security',
        subtitle: 'Production SQL schema pattern ensuring zero cross-tenant information leakage',
        codeSnippet: {
          language: 'sql',
          code: `-- 1. Force RLS on table
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations FORCE ROW LEVEL SECURITY;

-- 2. Scoped SELECT Policy
CREATE POLICY "Users can only read own decks"
  ON presentations FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Scoped UPDATE Policy
CREATE POLICY "Users can only modify own decks"
  ON presentations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);`,
          caption: 'Listing 3: Mandatory RLS enforcement pattern across 100% of tables',
        },
        notes: 'Show how policies prevent data leaks even if an API route had a bug.',
      },
      {
        id: 'sec-s5',
        layout: 'bullets-points',
        tag: 'Compliance Roadmap',
        title: 'Security Verification & Governance Directives',
        subtitle: 'Continuous auditing safeguards mandated on every future pull request',
        bullets: [
          'Automated CI audit runner must pass with 0 warnings before any branch merges to main',
          'Quarterly independent penetration testing scheduled with external cybersecurity red team',
          'Mandatory multi-factor authentication (MFA) on all administrative staff accounts',
          'Zero-knowledge encryption for all confidential customer presentations and database backups',
        ],
        notes: 'Conclude presentation and open floor for security committee questions.',
      },
    ],
  },
  {
    id: 'developer-api-walkthrough',
    title: 'Developer API & SDK Quickstart Walkthrough',
    category: 'Developer Experience',
    description: 'Technical walkthrough presentation for engineering teams integrating REST, WebSocket, and Ollama inference APIs.',
    slidesCount: 5,
    themeId: 'quantum',
    transition: 'zoom',
    tags: ['API', 'SDK', 'REST', 'TypeScript'],
    slides: [
      {
        id: 'api-s1',
        layout: 'title-cover',
        tag: 'Developer Platform',
        title: 'Resursee Core API & Client SDK Guide',
        subtitle: 'Building High-Performance Integrations with REST, WebSockets, and Local Ollama Daemons',
        notes: 'Welcome developers to the technical API onboarding.',
      },
      {
        id: 'api-s2',
        layout: 'split-columns',
        tag: 'API Architecture',
        title: 'Protocol Endpoints & Data Exchange',
        subtitle: 'Standardized communication protocols designed for sub-millisecond overhead',
        columns: [
          {
            heading: 'RESTful API Services',
            content: [
              'GET /api/resources: Paginated catalog query with full-text search',
              'POST /api/ai/transcribe: Audio buffer upload with Whisper transcription',
              'POST /api/ai/ollama/start: Local daemon background launcher',
              'GET /api/iot/ingest: High-speed hardware telemetry ingestion',
            ],
          },
          {
            heading: 'Streaming & Real-Time',
            content: [
              'Server-Sent Events (SSE): Live visitor analytics stream with low overhead',
              'WebSocket: Bidirectional ESP32 hardware relay command channel',
              'Chunked HTTP Transfer: Real-time LLM token streaming into UI components',
              'IndexedDB Storage: Client-side offline cache with zero cloud dependency',
            ],
          },
        ],
        notes: 'Review the REST and streaming endpoints.',
      },
      {
        id: 'api-s3',
        layout: 'code-architecture',
        tag: 'Quickstart Code',
        title: 'Client-Side TypeScript SDK Usage',
        subtitle: 'Typed request invocation with built-in retry and streaming token callbacks',
        codeSnippet: {
          language: 'typescript',
          code: `import { ResurseeClient } from '@resursee/sdk';

const client = new ResurseeClient({
  endpoint: 'http://localhost:3000',
  token: process.env.RESURSEE_API_KEY,
});

// Stream transcription from local audio buffer
const stream = await client.ai.transcribe({
  audio: audioWavBlob,
  model: 'whisper-base',
  onSegment: (segment) => {
    console.log(\`[\${segment.timestamp}] \${segment.speaker}: \${segment.text}\`);
  },
});`,
          caption: 'Listing 4: Stream audio transcription with real-time segment callbacks',
        },
        notes: 'Walk through the code example line by line.',
      },
      {
        id: 'api-s4',
        layout: 'stats-metrics',
        tag: 'SLA Benchmarks',
        title: 'API Throughput & Latency Guarantees',
        subtitle: 'Benchmarked on production hardware under 10,000 concurrent virtual connections',
        metrics: [
          { label: 'Median Response Time', value: '11.8 ms', change: 'p50 REST' },
          { label: '99th Percentile Latency', value: '38.2 ms', change: 'p99 SLA' },
          { label: 'Error Rate', value: '0.002%', change: 'Under Peak Load' },
          { label: 'Rate Limit Capacity', value: '1,200 req/m', change: 'Per API Token' },
        ],
        bullets: [
          'Automatic rate limiting headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After',
          'Built-in exponential backoff with jitter in the official TypeScript and Python SDKs',
          'Automatic keep-alive HTTP/2 multiplexing across all persistent connection pools',
        ],
        notes: 'Highlight low latency and generous rate limits.',
      },
      {
        id: 'api-s5',
        layout: 'bullets-points',
        tag: 'Integration Checklist',
        title: 'Go-Live Integration Checklist',
        subtitle: 'Steps to certify your application before pointing production traffic to Resursee',
        bullets: [
          'Verify API token storage in secure environment variables (never committed to Git)',
          'Implement client-side exponential backoff on HTTP 429 response codes',
          'Configure webhook endpoints with HMAC-SHA256 signature verification',
          'Join our developer Discord community for live troubleshooting and architectural reviews',
        ],
        notes: 'Wrap up developer quickstart presentation.',
      },
    ],
  },
  {
    id: 'startup-seed-deck',
    title: 'Tech Startup Seed Pitch Deck',
    category: 'Startup & Venture',
    description: 'Clean, high-impact venture presentation covering market opportunity, product demo, unit economics, traction metrics, and fundraising ask.',
    slidesCount: 6,
    themeId: 'nordic',
    transition: 'flip',
    tags: ['Startup', 'Pitch', 'Venture', 'Seed'],
    slides: [
      {
        id: 'seed-s1',
        layout: 'title-cover',
        tag: 'Investor Presentation',
        title: 'Resursee: The Unified Local-First Productivity Platform',
        subtitle: 'Empowering Engineers and Teams with Private AI, Real-Time Hardware IoT, and Statistical Computing',
        notes: 'Introduce founders and set a confident, visionary tone for the pitch.',
      },
      {
        id: 'seed-s2',
        layout: 'split-columns',
        tag: 'The Market Pain',
        title: 'The Fragmented SaaS Tollbooth Crisis',
        subtitle: 'Modern teams pay dozens of bloated subscriptions while surrendering their proprietary data',
        columns: [
          {
            heading: 'The Problem Today',
            content: [
              'Average technical organization pays for 42 disparate SaaS web services',
              'Per-seat, per-token cloud costs expanding faster than company revenue',
              'Proprietary code, IP, and transcripts leaking to third-party model providers',
              'Cloud outages paralyze development workflows and internal productivity',
            ],
          },
          {
            heading: 'Our Solution: Resursee',
            content: [
              'Unified suite: AI Studio, Data Studio, Transcriber, IoT Cloud, Presentations',
              '100% Client-Side & Local-First: Zero cloud vendor lock-in or recurring tolls',
              'Air-gapped data confidentiality: user data stays strictly on user hardware',
              'Blazing sub-second responsiveness powered by WebGPU, WASM, and Tauri',
            ],
          },
        ],
        notes: 'Make the pain palpable before revealing our unified platform answer.',
      },
      {
        id: 'seed-s3',
        layout: 'stats-metrics',
        tag: 'Traction & Momentum',
        title: 'Exponential Organic Growth & Engagement',
        subtitle: 'Metrics demonstrating product-market fit across global software engineers',
        metrics: [
          { label: 'Active Developers', value: '48,200', change: '+240% YoY' },
          { label: 'Monthly Retention', value: '88.4%', change: 'Top 5% Cohort' },
          { label: 'GitHub Stars', value: '12.4k', change: 'Trending #1' },
          { label: 'Net Promoter Score', value: '+74', change: 'World-Class' },
        ],
        bullets: [
          'Zero paid marketing expenditure: 94% of new signups driven by engineer word-of-mouth',
          'Active enterprise pilots underway with 14 Fortune 500 engineering departments',
          'Average user daily active session time exceeding 2.8 hours per developer',
        ],
        notes: 'Walk through strong cohort retention and viral developer word-of-mouth.',
      },
      {
        id: 'seed-s4',
        layout: 'bullets-points',
        tag: 'Business Model',
        title: 'Monetization Strategy & Unit Economics',
        subtitle: 'High-margin open-core model designed for rapid bottom-up expansion',
        bullets: [
          'Free Community Core: High adoption among individual engineers, researchers, and students',
          'Enterprise Self-Hosted License: Centralized fleet governance, SSO, and audit logging',
          'Hardware Certified Peripherals: Pre-flashed ESP32 telemetry kits and specialized AI rigs',
          '92% Gross Margin: Zero recurring server GPU inference costs borne by our balance sheet',
        ],
        notes: 'Highlight how local execution protects our gross margins from ballooning GPU costs.',
      },
      {
        id: 'seed-s5',
        layout: 'timeline-roadmap',
        tag: 'Growth Milestones',
        title: 'Post-Funding Execution Roadmap',
        subtitle: 'How capital will accelerate product velocity and enterprise adoption',
        timeline: [
          { step: 'Month 1-3', title: 'Desktop Fleet Release', description: 'Ship production signed Tauri builds for macOS and Windows with auto-updating.' },
          { step: 'Month 4-6', title: 'Enterprise Audit Hub', description: 'Deploy centralized compliance dashboard for corporate security teams.' },
          { step: 'Month 7-9', title: 'Developer Plugin Marketplace', description: 'Open public API for third-party extensions, themes, and specialized toolkits.' },
          { step: 'Month 10-12', title: 'Global Scale Target', description: 'Surpass 250,000 active developers and achieve cashflow breakeven.' },
        ],
        notes: 'Outline clear milestones tied directly to capital allocation.',
      },
      {
        id: 'seed-s6',
        layout: 'quote-highlight',
        tag: 'The Ask',
        title: 'Seed Round Financing & Investment Ask',
        subtitle: 'Partner with us to build the sovereign computing platform of the next decade',
        quote: {
          text: 'We are raising $2.5M in Seed funding to expand our core systems engineering team, accelerate enterprise sales, and establish Resursee as the default developer productivity operating system.',
          author: 'Founding Team',
          role: 'Resursee Core Leadership',
        },
        bullets: [
          '70% allocated to systems engineering (Rust, WebGPU, local model quantization)',
          '20% allocated to developer advocacy, community documentation, and workshops',
          '10% allocated to operational reserves and IP legal protection',
        ],
        notes: 'Close with terms, syndicate allocation, and contact information.',
      },
    ],
  },
];
