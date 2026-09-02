# 🛡️ NEXUS — AI-Powered Darknet Cybercrime & Forensic Intelligence Platform

> **Advanced Deterministic Context Graph Engine, Cross-Source Entity Resolution, GPU Geospatial Supply Chain Corridors, and Tamper-Evident Forensic Dossier Automation.**  
> *Developed for Law Enforcement, Anti-Narcotics Task Forces, and Intelligence Agencies.*

---

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Python 3.13](https://img.shields.io/badge/Python-3.13.2-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![Semantica](https://img.shields.io/badge/Semantica%20AGI-v0.6.7-purple?style=for-the-badge)](https://github.com/semantica-agi/semantica)
[![Deck.gl](https://img.shields.io/badge/Deck.gl-v9.3.11-cyan?style=for-the-badge)](https://deck.gl/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-57%2F57%20Passing-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/Audit%20Ledger-SHA--256%20Immutable-orange?style=for-the-badge)](file:///d:/git%20uploads/PU-Hackathon)

---

## 📑 Table of Contents

- [1. Executive Overview & Problem Statement](#1-executive-overview--problem-statement)
- [2. System Architecture & High-Level Flow](#2-system-architecture--high-level-flow)
- [3. Core Operational Modules](#3-core-operational-modules)
  - [3.1 Executive Command Center](#31-executive-command-center)
  - [3.2 Entity Resolution Engine & Syndicate Matrix](#32-entity-resolution-engine--syndicate-matrix)
  - [3.3 Evidence Graph & Neural Physics Simulation](#33-evidence-graph--neural-physics-simulation)
  - [3.4 Geospatial Supply Chain Corridors (Deck.gl 9)](#34-geospatial-supply-chain-corridors-deckgl-9)
  - [3.5 Forensic Case Management & Tamper-Evident Ledger](#35-forensic-case-management--tamper-evident-ledger)
  - [3.6 Pattern of Life & Darknet Triplet Mining Studio](#36-pattern-of-life--darknet-triplet-mining-studio)
- [4. Technology Stack](#4-technology-stack)
- [5. Project Directory Structure](#5-project-directory-structure)
- [6. API Architecture & Endpoint Reference](#6-api-architecture--endpoint-reference)
- [7. Installation & Quickstart Guide](#7-installation--quickstart-guide)
- [8. Test Suites & Verification](#8-test-suites--verification)
- [9. Forensic Standards & Court-Admissibility Compliance](#9-forensic-standards--court-admissibility-compliance)
- [10. Contributors & License](#10-contributors--license)

---

## 1. Executive Overview & Problem Statement

Modern cyber-narcotics cartels and darknet threat syndicates operate across distributed, anonymized topologies:
- **Burner Personas & Aliases**: Operators hop between Dread, Telegram channels, Wickr handles, and darknet forums.
- **Crypto Obfuscation**: Illicit revenue is laundered through Peel Chains, CoinJoins, ChipMixer relays, and cross-chain Monero bridges.
- **Fragmented Logistics**: Raw fentanyl precursors and synthetic stimulants travel across transnational shipping routes before street-level distribution.
- **Conflicting Source Intelligence**: Wiretaps, informant testimonies, and intercepted comms frequently contradict each other.
- **Court Admissibility Challenges**: Raw intelligence must be transformed into tamper-evident, Section 65B-compliant forensic dossier packages with cryptographic chain of custody.

### 🎯 What NEXUS Solves
**NEXUS** is an end-to-end intelligence operating system combining a deterministic **Semantica ContextGraph** engine with **GPU-accelerated geospatial tracking**, **heuristic link prediction**, **credibility-weighted contradiction arbitration**, and **SHA-256 audit chaining** to empower law enforcement investigators from initial darknet scrapings to court conviction.

---

## 2. System Architecture & High-Level Flow

```mermaid
flowchart TB
    subgraph DataIngestion ["1. Data Ingestion & Triplet Extraction"]
        RawData["Raw Comms / Darknet Posts / Bank Logs"] --> NER["Cybercrime NER & Regex Miner"]
        NER --> Triplets["RDF Triplet Miner (Subject-Predicate-Object)"]
        Triplets --> IngestAPI["POST /api/v1/ingest/pipeline"]
    end

    subgraph SemanticaEngine ["2. Python 3.13 Semantica Graph Service"]
        IngestAPI --> ContextGraph["Semantica ContextGraph"]
        ContextGraph --> Louvain["Louvain Community Detection (Syndicates)"]
        ContextGraph --> PageRank["Kingpin Index (PageRank + Betweenness)"]
        ContextGraph --> Dijkstra["Laundering Flow Route Tracer (Dijkstra)"]
        ContextGraph --> LinkPredictor["Covert Tie Predictor (Shared Infra Heuristics)"]
        ContextGraph --> EntityResolver["Deterministic Entity Matcher (PGP / Wallet / Exif)"]
    end

    subgraph ForensicCore ["3. Forensic Arbitration & Chain of Custody"]
        EntityResolver --> ConflictResolver["Credibility-Weighted Contradiction Resolver"]
        ConflictResolver --> SHA256Chain["Tamper-Evident SHA-256 Ledger (Merkle Chained)"]
        SHA256Chain --> DossierGen["Section 65B Court Dossier Exporter"]
    end

    subgraph FrontendUI ["4. Real-Time Next.js 14 Operator Interface"]
        ContextGraph --> EvidenceGraph["Evidence Graph (D3 Particle Physics Canvas)"]
        ContextGraph --> MapView["Geospatial Corridors (Deck.gl 9 GPU Layers)"]
        EntityResolver --> EntityResolutionUI["Entity Resolution & Syndicate Matrix"]
        ConflictResolver --> CaseManagerUI["Investigations Manager & Audit Ledger"]
        DossierGen --> CourtExportUI["One-Click Law Enforcement Markdown Dossier"]
    end
```

---

## 3. Core Operational Modules

### 3.1 Executive Command Center
- **High-Level KPI Dashboards**: Real-time counters for active syndicate targets, seized contraband volumes (kg), monitored cryptocurrency wallets, and active interdiction ops.
- **Threat Activity Feed**: Streaming, live threat ticker updating investigators on high-priority network events, suspicious crypto movements, and intercepted transmissions.
- **Multi-Vector Threat Matrix**: Radar and bar breakdown classifying threats by narcotics type (Fentanyl, Methamphetamine, MDMA, Synthetic Cannabinoids) and operational vector.

---

### 3.2 Entity Resolution Engine & Syndicate Matrix
- **Automated Duplicate Persona Queue**: Uses weighted Jaccard similarity, Levenshtein distance, and deterministic cryptographic matches (shared Bitcoin/Monero addresses, identical PGP public key fingerprints) to score persona matches.
- **Cartels & Syndicates Matrix**: Native Louvain Modularity clustering algorithm in NetworkX/Semantica that groups isolated suspect nodes into criminal gangs with intra-cluster density scoring.
- **Kingpin & Broker Matrix**: Identifies criminal bosses vs. transactional brokers using composite **Kingpin Index** ($0.5 \times \text{PageRank} + 0.5 \times \text{Betweenness Centrality}$).
- **Multi-Spectral Forensic Image Loupe**: Interactive hover-loupe inspecting seized physical contraband and digital scales, with simulated YOLO bounding boxes ($0.98$ confidence, $0.89\text{ IoU}$).

---

### 3.3 Evidence Graph & Neural Physics Simulation
- **60 FPS Force-Directed Canvas**: Built with `react-force-graph-2d` and HTML5 Canvas2D rendering. Features dynamic node collision padding, adaptive alpha/velocity decays, and zoom-aware label culling.
- **Directional Particle Flow Pathways**:
  - **Financial Vectors (Yellow)**: Directional particle flow along crypto transactions and bank wires.
  - **Communication Channels (Cyan)**: Particle streams showing Telegram, Session, and Wickr chatter.
  - **Infrastructure Ties (Indigo)**: Server hosting, shared dropboxes, and PGP signatures.
- **Laundering Flow Route Tracer**: Multi-hop Dijkstra shortest-path engine tracing clean funds through mixer relays and Monero hops to destination cash-out wallets.
- **Covert Link Predictor**: Heuristic link prediction engine detecting hidden ties between conspirators based on shared infrastructure and common financial counter-parties.

---

### 3.4 Geospatial Supply Chain Corridors (Deck.gl 9)
- **High-Density GPU Geospatial Layers**:
  - `ScatterplotLayer`: Renders individual seizure incidents and drug lab locations color-coded by drug category.
  - `ArcLayer`: Renders 3D arcs mapping transnational supply logistics from source synthesis labs to regional distribution nodes.
  - `PathLayer`: Displays multi-waypoint transit corridors with dashed animated styles.
  - `HeatmapLayer`: Real-time seizure density heatmaps across cities and border zones.
- **Supercluster Integration**: Hardware-accelerated client-side point clustering scaling up to 10,000+ simultaneous map pins.
- **Temporal Playback Slider**: Interactive timeline scrubbing showing the temporal progression of smuggling routes over time.

---

### 3.5 Forensic Case Management & Tamper-Evident Ledger
- **Kanban Case Pipeline**: Drag-and-drop investigation workflow powered by `@dnd-kit/core` and `@dnd-kit/sortable` with persistent state tracking.
- **Contradiction Resolver**: Detects contradictory statements between multiple human informants or surveillance logs and arbitrates using credibility-weighted scoring:
  $$\text{Score}(v) = \sum_{c \in \text{Claims}(v)} \text{Credibility}(c.\text{source}) \times \text{Weight}(c.\text{type})$$
- **Tamper-Evident SHA-256 Chain**: Cryptographic audit ledger where every investigative decision (persona merge, dispute resolution, evidence tag) is hashed with the previous block's SHA-256 hash.
- **Court Case Dossier Builder**: Generates standardized, formatted Law Enforcement Markdown dossiers citing evidentiary chains, IOC lists, and verified forensic audit logs.

---

### 3.6 Pattern of Life & Darknet Triplet Mining Studio
- **Composite Temporal Histograms**: Dual-axis Recharts visualizing communication frequencies, transaction volumes, and darknet vendor post spikes.
- **Cybercrime Named Entity Recognition (NER)**: Regex & heuristic miners extracting:
  - Bitcoin (Bech32, P2PKH, P2SH) & Monero (XMR) addresses
  - 40-character PGP key fingerprints
  - Telegram handles (`@username`)
  - Tor v3 `.onion` URLs
  - Illicit substances (Fentanyl, Oxycodone, MDMA, Meth, Cocaine)
- **One-Click ContextGraph Ingestion**: Ingests mined RDF Triplets (`Subject -[Predicate]-> Object`) directly into the active Semantica knowledge graph backend.

---

## 4. Technology Stack

### 💻 Frontend & Client UI
| Library / Framework | Version | Purpose |
| :--- | :---: | :--- |
| **Next.js** | `14.2.35` | App Router, SSR & Production Bundling |
| **React** | `18.3.1` | Component Architecture & State Hooks |
| **TypeScript** | `5.9.3` | Strict Static Typing & Schema Definitions |
| **TailwindCSS** | `3.4.19` | Cyberpunk Dark Mode & Glassmorphism Design System |
| **Framer Motion** | `11.18.2` | Smooth Micro-Interactions, Drawers & Lightboxes |
| **Deck.gl** | `9.3.11` | GPU-Accelerated WebGL Geospatial Data Layers |
| **MapLibre GL** | `6.6.0` | High-Resolution Vector Basemap Renderer |
| **react-force-graph-2d** | `1.29.1` | D3-Powered Particle Physics Knowledge Graph |
| **Recharts** | `2.15.4` | Composed Timeline & Temporal Histograms |
| **@dnd-kit** | `6.3.1` | Hardware-Accelerated Drag and Drop Kanban Board |
| **Zustand** | `5.0.15` | Global State Management & Entity Cross-Selection |
| **Lucide React** | `0.400.0` | Vector Iconography System |

### 🐍 Backend & Analytical Engines
| Component / Library | Version | Purpose |
| :--- | :---: | :--- |
| **Python** | `3.13.2 (64-bit)` | Core High-Performance Analytical Runtime |
| **Semantica AGI** | `0.6.7` | Deterministic ContextGraph & Entity Ingestion |
| **NetworkX** | `3.6.1` | Graph Analytics, Louvain Clustering & Centrality |
| **NumPy** | `2.5.2` | Vectorized Linear Algebra & Matrix Math |
| **Pydantic** | `2.13.5` | Strict Python Data Schema Validation |
| **Prisma ORM** | `5.22.0` | Database Modeling & Schema Migrations |
| **Express / CORS** | `5.2.1 / 2.8.6` | Lightweight Auxiliary API Dispatch |

---

## 5. Project Directory Structure

```
PU-Hackathon/
├── analysis/                              # Python 3.13 Semantica Analytics Microservices
│   ├── conflicts/                         # Contradiction Detection & Arbitration
│   │   ├── conflict_detector.py           # Multi-source claim collision detector
│   │   ├── conflict_resolver.py           # Credibility-weighted arbitration
│   │   └── source_tracker.py              # Source reliability rating engine
│   ├── exporters/                         # Dossier & External Graph Exporters
│   │   ├── dossier_exporter.py            # Law Enforcement Markdown generator
│   │   └── graph_exporter.py              # Neo4j Cypher & Gephi GEXF formatters
│   ├── extraction/                        # Cybercrime NER & Triplet Parsing
│   │   ├── event_detector.py              # Operational timestamp event miner
│   │   ├── ner.py                         # Crypto wallet, PGP, Telegram extractor
│   │   └── triplet_extractor.py           # Subject-Predicate-Object RDF miner
│   ├── kg/                                # Knowledge Graph Algorithms
│   │   ├── centrality_calculator.py       # PageRank & Betweenness (Kingpin Index)
│   │   ├── community_detector.py          # Louvain Modularity syndicate clustering
│   │   ├── link_predictor.py              # Heuristic co-conspiracy link predictor
│   │   ├── path_finder.py                 # Dijkstra money laundering flow tracer
│   │   └── temporal_reasoning.py          # Time-bounded relationship analysis
│   ├── provenance/                        # Cryptographic Chain of Custody
│   │   ├── chain_of_custody.py            # Evidence custody timeline tracker
│   │   └── decision_recorder.py           # SHA-256 tamper-evident ledger
│   ├── resolution/                        # Entity Resolution Engine
│   │   ├── duplicate_detector.py          # Persona candidate matching
│   │   ├── entity_merger.py               # Master entity unification
│   │   └── similarity.py                  # Jaccard & Levenshtein calculators
│   ├── semantica_entity_resolver.py       # High-level Entity Resolution Service
│   └── semantica_graph_service.py         # High-level ContextGraph Manager
├── ingestion/                             # Data Ingestion Pipelines
│   └── semantica_pipeline.py              # Raw feed parsing and GraphBuilder feeder
├── src/                                   # Next.js 14 Frontend Application
│   ├── app/                               # Next.js App Router & API Endpoints
│   │   ├── api/v1/                        # RESTful Typed API Route Handlers
│   │   │   ├── dashboard/                 # KPIs, charts, and threat feeds
│   │   │   ├── graph/                     # Topology and analytics
│   │   │   ├── ingest/                    # Raw text ingestion pipeline
│   │   │   ├── intelligence/              # Conflicts, audit, dossier, triplets
│   │   │   ├── investigations/            # Kanban case cards
│   │   │   ├── map/                       # Geospatial pins & routes
│   │   │   ├── network/default/           # Live Python 3.13 Semantica graph endpoint
│   │   │   └── search/                    # Global omni-search
│   │   ├── globals.css                    # TailwindCSS theme tokens
│   │   ├── layout.tsx                     # Root application layout
│   │   └── page.tsx                       # Single-page multi-view app container
│   ├── components/                        # Modular React Components
│   │   ├── dashboard/                     # Executive Command Center widgets
│   │   ├── layout/                        # Sidebar, Navigation, Top Bar
│   │   ├── ui/                            # Buttons, Modals, Badges, SearchInput
│   │   └── views/                         # Primary Operational Views
│   │       ├── EntityResolution.tsx       # Personas, Loupe, Cartels & Kingpin Matrix
│   │       ├── EvidenceGraph.tsx          # Force Graph, Flow Tracer & Link Predictor
│   │       ├── InvestigationManager.tsx   # Kanban, Contradiction Resolver & Audit Ledger
│   │       ├── MapView.tsx                # Deck.gl 9 Geospatial Corridors
│   │       └── TimelineReconstructor.tsx  # Histograms & Darknet Triplet Studio
│   ├── hooks/                             # Custom React State & Data Hooks
│   │   ├── useDashboardData.ts            # Executive stats & feed hook
│   │   ├── useKanbanBoard.ts              # Drag-and-drop board state hook
│   │   └── useMapData.ts                  # Deck.gl clustering & date filter hook
│   ├── lib/                               # Core Utilities & State Stores
│   │   ├── apiClient.ts                   # Centralized typed API client
│   │   ├── graphAnalytics.ts              # Client-side centrality & path algorithms
│   │   ├── mockData.ts                    # Seed intelligence records & POIs
│   │   └── store.ts                       # Zustand global application store
│   └── test/                              # Vitest Test Setup
│       └── setup.ts                       # Jest-DOM matchers initialization
├── test_semantica_engine.py               # Unit Test Suite for Semantica Graph Engine
├── test_semantica_integration.py          # 10-Step Forensic Integration Test Suite
├── vitest.config.mts                      # Memory-Efficient Vitest Configuration
├── tsconfig.json                          # TypeScript Compiler Settings
└── package.json                           # NPM Dependencies & Scripts
```

---

## 6. API Architecture & Endpoint Reference

All endpoints are strictly typed via TypeScript and return standardized JSON envelopes (`{ ok: boolean, data?: any, error?: string }`):

| Method | Endpoint | Description | Key Query / Body Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/network/default` | Returns live Semantica ContextGraph topology & metrics | None |
| `GET` | `/api/v1/graph/analytics` | Calculates Kingpin indices & shortest path flow | `?source=ent-001&target=ent-002` |
| `POST` | `/api/v1/ingest/pipeline` | Ingests unstructured text feed into graph | `{ text: string, source: string }` |
| `POST` | `/api/v1/intelligence/triplets` | Extracts RDF triplets & cyber indicators from text | `{ text: string }` |
| `GET` | `/api/v1/intelligence/conflicts` | Lists all detected intelligence contradictions | None |
| `POST` | `/api/v1/intelligence/conflicts` | Resolves contradiction using chosen strategy | `{ conflictId, chosenValue, strategy, justification }` |
| `GET` | `/api/v1/intelligence/audit` | Retrieves immutable SHA-256 audit ledger | None |
| `POST` | `/api/v1/intelligence/audit` | Records new tamper-evident forensic decision | `{ decisionType, targetEntityId, action, justification, officerId }` |
| `POST` | `/api/v1/intelligence/dossier` | Generates formatted Law Enforcement Markdown dossier | `{ targetId: string }` |
| `GET` | `/api/v1/intelligence/alias-matches` | Lists duplicate persona candidates with scores | None |
| `POST` | `/api/v1/intelligence/merge-aliases` | Merges secondary persona into master entity | `{ primaryId, secondaryId, reason }` |
| `GET` | `/api/v1/map/pins` | Retrieves geo-located drug seizure incidents | `?startDate=...&endDate=...&drugCategory=...` |
| `GET` | `/api/v1/dashboard/kpis` | Returns executive threat statistics & counts | None |
| `GET` | `/api/v1/dashboard/feed` | Streaming threat notifications & alert ticker | `?limit=12` |
| `GET` | `/api/v1/investigations` | Returns Kanban case cards grouped by stage | None |
| `GET` | `/api/v1/search` | Global omni-search across all entities & cases | `?q=searchQuery` |

---

## 7. Installation & Quickstart Guide

### 📋 Prerequisites
- **Node.js**: `v18.18.0` or higher
- **Python**: `v3.13.0` or higher (64-bit)
- **Git**: Installed and configured

### 🚀 Step 1: Clone Repository & Install Node Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/PU-Hackathon.git
cd PU-Hackathon

# Install frontend dependencies
npm install
```

### 🐍 Step 2: Configure Python 3.13 Environment & Semantica
```bash
# Ensure Python 3.13 is active
python --version

# Install Python requirements
pip install networkx numpy pydantic pytest python-dotenv setuptools wheel

# Install Semantica in editable mode (from sibling directory or repository)
pip install -e "d:/git uploads/semantica" --no-deps
```

### ⚙️ Step 3: Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_APP_NAME="NEXUS Forensic Intelligence Platform"
NEXT_PUBLIC_APP_VERSION="1.0.0"
PYTHON_BIN_PATH="C:/Users/Pushkar/AppData/Local/Programs/Python/Python313/python.exe"
```

### 💻 Step 4: Run Development Server
```bash
npm run dev
```
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 8. Test Suites & Verification

The platform maintains a **100% test pass rate** across frontend unit tests, Python engine algorithms, and full forensic pipeline integrations.

### 🧪 1. Frontend Unit Tests (Vitest)
```bash
npm run test
```
- **Tests Executed**: **57 / 57 Passed** across 14 test suites in **~3.3s**.
- **Coverage**: Store state transitions, auth handlers, Kanban drag-and-drop, date filters, map clustering, and search debounce.

### 🐍 2. Semantica Engine Unit Tests
```bash
python test_semantica_engine.py
```
- **Tests Executed**: **6 / 6 Passed** in **0.147s**.
- **Coverage**: ContextGraph initialization, Kingpin Index calculation, JSON serialization, Dijkstra laundering tracer, automated ingestion pipeline, and entity resolution duplicate detector.

### 🛡️ 3. Forensic Suite Integration Tests
```bash
python test_semantica_integration.py
```
- **Suites Executed**: **10 / 10 Passed**.
- **Coverage**:
  1. Multi-Target Knowledge Graph Construction
  2. Louvain Criminal Syndicate Detection
  3. Kingpin Identification (PageRank / Betweenness)
  4. Money Laundering Flow Route Tracer
  5. Link Prediction (Hidden Criminal Ties)
  6. Suspect Entity Resolution (DarkPhoenix_77 vs Ph03nix_Rx)
  7. Contradictory Intelligence & Source Reliability Engine
  8. Decision Audit Trail & Tamper-Evident SHA-256 Chain
  9. Court Dossier & Neo4j Cypher Graph Exporters
  10. Cybercrime NER & RDF Triplet Mining

### 📦 4. Production Build Verification
```bash
npm run build
```
- **Output**: **`✓ 24 / 24 pages & API endpoints compiled`** with 0 TypeScript and 0 ESLint errors.

---

## 9. Forensic Standards & Court-Admissibility Compliance

```
┌────────────────────────────────────────────────────────────────────────┐
│               FORENSIC EVIDENCE INTEGRITY LEDGER                       │
├───────────────────┬────────────────────────────────────────────────────┤
│ Hashing Standard  │ SHA-256 Cryptographic Block Chaining               │
├───────────────────┼────────────────────────────────────────────────────┤
│ Legal Compliance  │ Section 65B (Indian Evidence Act / BSA) Ready      │
├───────────────────┼────────────────────────────────────────────────────┤
│ Chain of Custody  │ Immutable Officer ID, Timestamp & Justification    │
├───────────────────┼────────────────────────────────────────────────────┤
│ Graph Export      │ Cypher Statements (Neo4j) & Standard RDF (Turtle) │
└───────────────────┴────────────────────────────────────────────────────┘
```

1. **Deterministic Arbitration**: No black-box hallucinations. All dispute resolutions explicitly cite source reliability scores and mathematical weightings.
2. **Cryptographic Proof of Non-Tampering**: Each investigative entry calculates a SHA-256 digest over `[prevHash + timestamp + officerId + action + payload]`, making retroactive modification mathematically impossible without invalidating the chain.
3. **Reproducible Graph Geometry**: All force graph states, Louvain community partitions, and shortest paths are fully deterministic given a seed entity graph.

---

## 10. Contributors & License

- **Developed for**: Punjab Police Hackathon / National Police Hackathon 2026
- **Architecture & Lead Development**: Code Blooded
- **Knowledge Graph Framework**: Powered by [Semantica AGI](https://github.com/semantica-agi/semantica)
- **License**: MIT License — Open for Law Enforcement & Academic Research

---

<p align="center">
  <b>NEXUS INTELLIGENCE PLATFORM — PROVING TRUTH THROUGH STRUCTURED GRAPH FORENSICS</b>
</p>
