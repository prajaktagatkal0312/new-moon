# 🌙 MoonVow — Privacy-First Commitment App on Midnight

[![CI](https://github.com/prajaktagatkal0312/new-moon/actions/workflows/ci.yml/badge.svg)](https://github.com/prajaktagatkal0312/new-moon/actions/workflows/ci.yml)

> **MoonVow** is a privacy-first personal commitment tracking application built on the **Midnight Network**. Users commit to personal goals at the "new moon"—the fact that they made a vow becomes public on-chain, but the content of the vow stays completely private off-chain. Later, the user can mark their goal fulfilled without ever revealing what the vow was. MoonVow serves as the foundational step toward a broader "phases of commitment" ecosystem (enabling reveal-at-fulfillment, commitment streaks, and social accountability without doxxing your personal goals).

---

## 🆕 What's New —(Frontend + Lace + Preview)

MoonVow now includes a **full browser frontend** built with Vite + React + TypeScript that connects to the **Lace wallet** via Midnight's DApp Connector API. The contract has been redeployed to the **Midnight Preview Testnet**, and the frontend is deployed live so anyone can demo it. The UI features a side-by-side **"Observable Privacy Center"** that makes the zero-knowledge privacy claim independently verifiable — you can see the public commitment hash on-chain and confirm the goal text is nowhere in the transaction data.

### 🔗 Live Demo

**Live Demo URL:** [https://new-moon-tau.vercel.app/](https://new-moon-tau.vercel.app/)

### 📜 Deployed Preview Contract

| Parameter | Details |
|---|---|
| **Network** | Midnight Preview Testnet |
| **Contract ID** | `e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944` |
| **Verify on Explorer** | [Preview Explorer Link](https://preview.midnightexplorer.com/contracts/e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944) |

> **How to verify independently:** Copy the Contract ID above and look it up on the Midnight Preview block explorer. Inspect any `commitVow` transaction — you'll see only the 32-byte hash commitment in the public state. The goal text and salt are absent from all on-chain data, indexer records, and transaction payloads.

### 🎬 Demo Video

**Demo Video:** [Watch on Loom](https://www.loom.com/share/f0adf2fe7cba4a809a140c5087e33135)

### 🔐 Privacy Claim

> **This app proves a vow was made and can prove it was fulfilled, without ever revealing the vow's content to the chain, the indexer, or any third party — only the person who made the commitment (holding the original goal text and salt in their browser's localStorage) can produce a matching fulfillment proof.**

The UI's **Observable Privacy Center** lets any viewer verify this themselves: the left panel shows exactly what the blockchain stores (a 32-byte hash and a boolean status), while the right panel shows the private data that never leaves the browser (goal text + salt). A one-click "copy hash" button lets you check the Preview explorer yourself and confirm the goal text appears nowhere on-chain.

---

## 🖥️ Frontend Development Instructions

### Prerequisites
- Node.js >= 22.0.0
- [Lace Wallet](https://www.lace.io/) browser extension (set to **Preview** network)

### Local Frontend Dev

```bash
# From the project root (my-app/)
cd frontend
npm install

# Copy environment template and configure
cp .env.example .env.local

# Start dev server
npm run dev
# → Opens at http://localhost:5173

# Or from root:
npm run frontend:dev
```

### Required Environment Variables

| Variable | Description |
|---|---|
| `VITE_Preview_CONTRACT_ADDRESS` | Deployed MoonVow contract address on Preview |
| `VITE_MIDNIGHT_INDEXER_URL` | Preview indexer GraphQL endpoint |
| `VITE_MIDNIGHT_NODE_URL` | Preview RPC node URL |

See [`.env.example`](.env.example) for all values.

### Switching Lace to Preview
1. Open the Lace wallet extension in your browser.
2. Go to **Settings → Network**.
3. Select **Preview**.
4. Refresh the MoonVow dApp page — the navbar will show a green "Connected" pill once on the correct network.

---

## 📋 Table of Contents
- [Product Overview](#-product-overview)
- [Public State vs. Private Witness Architecture](#-public-state-vs-private-witness-architecture)
- [How It Works](#-how-it-works)
- [Mainnet / Testnet Contract Details](#-mainnet--testnet-contract-details)
- [Deployment & Compilation Screenshots](#-deployment--compilation-screenshots)
- [Getting Started & Setup Instructions](#-getting-started--setup-instructions)
- [Project Structure](#-project-structure)

---

## 💡 Product Overview

Traditional goal-tracking platforms either force you to expose your personal ambitions publicly or rely on centralized servers. **MoonVow** leverages Midnight Network's Zero-Knowledge (ZK) smart contracts written in **Compact** to give users cryptographic proof of commitment with complete privacy.

- 🌑 **Private Commitments**: The goal text and salt remain on your local device.
- 🌕 **Verifiable Fulfillment**: Cryptographically prove you completed a previously registered vow without disclosing what it was.
- 🚀 **Phases of Commitment Vision**: Designed to support future expansions including reveal-on-completion, proof-of-streak, and zero-knowledge social accountability circles.

---

## 🔐 Public State vs. Private Witness Architecture

MoonVow explicitly demonstrates the separation between public ledger state and client-side private witnesses in Midnight's Compact smart contract paradigm.

### 🌐 1. Public Ledger State (Blockchain)
The blockchain stores ONLY:
- `vowCount: Counter` — Total number of vows committed globally across the network.
- `vows: Map<Bytes<32>, Boolean>` — Keyed by a 32-byte cryptographic commitment hash; value indicates fulfilled status (`false` = unfulfilled, `true` = fulfilled).

### 🛡️ 2. Private Witness Inputs (Off-Chain Client)
Inputs declared via `witness` that are resolved locally on the user's client machine and **NEVER** passed to `disclose()`:
- `goalTextHash: Bytes<32>` — SHA-256 hash of the goal text (e.g. *"Run a marathon by December"*), kept strictly off-chain.
- `salt: Bytes<32>` — Random 256-bit salt preventing commitment collision or linkability across users.

### 📜 Deliberate `disclose()` Boundaries in `contracts/moon-vow.compact`

```compact
export circuit commitVow(): [] {
    const goalHash = goalTextHash();
    const s = salt();
    
    // Compute 32-byte persistent commitment hash locally from private witness inputs
    const commitment = persistentCommit<Bytes<32>>(goalHash, s);
    assert(!vows.member(commitment), "Vow commitment already exists");
    
    // DISCLOSURE BOUNDARY:
    // `disclose(commitment)` reveals ONLY the 32-byte hash commitment to the public ledger map key.
    // The `goalTextHash` and `salt` remain strictly private on the user's machine and are NEVER
    // passed to disclose() or stored on the public blockchain.
    vows.insert(disclose(commitment), false);
    vowCount.increment(1);
}
```

---

## 🔄 How It Works

```
[ User Device ]                                 [ Midnight Blockchain ]
 ├── Goal: "Secret Goal"                         
 ├── Salt: 0x9f3a...                              
 ├── Hash = persistentCommit(Goal, Salt) ──disclose(Hash)──> [ vows[Hash] = false ]
                                                             [ vowCount += 1      ]

 (Later)
 ├── Recompute Hash(Goal, Salt) ──────────disclose(Hash)──> [ vows[Hash] = true  ]
```

## Privacy Model

- **What an observer CAN learn**: A commitment existed, the commitment hash, the fulfilled status, the block height, and the global vowCount.
- **What an observer CANNOT learn**: The goal text, the salt, or any identity linkage between vows.

To verify this yourself, view the contract on the [Preview Explorer](https://preview.midnightexplorer.com/contracts/e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944) and inspect any commitVow transaction — you'll see only the 32-byte hash commitment in the public state. The goal text and salt are absent from all on-chain data, indexer records, and transaction payloads.

---

## 📜 Mainnet / Testnet Contract Details

### 🧪 Midnight Preview Testnet Deployment (Level 2 — Current)

| Parameter | Details |
|---|---|
| **Network** | Midnight Preview Testnet |
| **Contract ID (Address)** | `e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944` |
| **Deployer Address** | `mn_addr_Preview10j4v0yvnyueuq2yekl9sqwc2lxkg87vw3pqv33kpsurjzcflt54ssz5l0v` |
| **Compiler Version** | Compact v0.23+ / v0.31.1 |
| **Contract Status** | 🟢 Active & Deployed on Preview |

### 🧪 Midnight Preview Testnet Deployment (Level 1)

| Parameter | Details |
|---|---|
| **Network** | Midnight Preview Testnet |
| **Contract ID (Address)** | `e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944` |
| **Deployer Address** | `mn_addr_preview10j4v0yvnyueuq2yekl9sqwc2lxkg87vw3pqv33kpsurjzcflt54ssz5l0v` |
| **Compiler Version** | Compact v0.23+ / v0.31.1 |
| **Contract Status** | 🟢 Active & Deployed on Testnet |

---

## 📸 Deployment & Compilation Screenshots

### ⚙️ Compact Compiler Output
Below is the compilation output showing `contracts/moon-vow.compact` compiled into `contracts/managed/moon-vow` with `commitVow` and `fulfillVow` circuits:

![Compact Compiler Output](./docs/screenshot-compile.jpeg)

> The raw text log is also available at [`docs/screenshot-compile.txt`](./docs/screenshot-compile.txt) for text-searchable reference.

---

### 🚀 Preview Testnet Deployment
Below is the verified terminal deployment output confirming MoonVow deployed to Midnight Preview Testnet:

![Preview Testnet Deployment](./docs/screenshot-deploy.png)

---

## 🛠️ Getting Started & Setup Instructions

### Prerequisites
- Node.js >= 22.0.0
- Docker & Docker Compose v2
- Compact Compiler (pinned version in create-mn-app)

### Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Compile Compact smart contract
npm run compile

# 3. Run unit tests
npm test

# 4. Start local devnet and deploy contract
npm run setup

# 5. Interact via interactive CLI
npm run cli

# 6. Run E2E verification check
npm run test:e2e

# 7. Start frontend dev server
npm run frontend:dev
```

### Network Management

```bash
npm run network preview     # Switch active network to Preview Testnet
npm run network Preview     # Switch active network to Preview Testnet
npm run network undeployed  # Switch active network to Local Devnet
```

---

## 📁 Project Structure

```
my-app/
├── contracts/
│   ├── moon-vow.compact         # Compact ZK smart contract source
│   └── managed/moon-vow/        # Compiled circuits, keys, and JS bindings
├── docs/
│   ├── screenshot-compile.jpeg   # Terminal compilation output screenshot
│   └── screenshot-deploy.png    # Terminal deployment screenshot
├── frontend/                    # ✨ Level 2: Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── main.tsx             # Entry point
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Header with Lace wallet connect/disconnect
│   │   │   ├── PrivacyPanel.tsx # Observable Privacy Center (public vs private)
│   │   │   ├── CommitVowForm.tsx    # commitVow circuit call form
│   │   │   └── FulfillVowList.tsx   # fulfillVow circuit call list
│   │   ├── hooks/
│   │   │   └── useWallet.ts     # Lace DApp connector hook
│   │   └── utils/
│   │       └── vowStorage.ts    # Local vow secret management (localStorage)
│   ├── index.html               # HTML shell
│   ├── vite.config.ts           # Vite config with WASM plugin
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── .env.example             # Environment variable template
│   └── package.json             # Frontend dependencies
├── scripts/
│   ├── e2e-check.ts             # E2E test suite
│   └── copy-assets.js           # Screenshot asset helper
├── src/
│   ├── cli.ts                   # Interactive CLI for commitVow & fulfillVow
│   ├── deploy.ts                # MoonVow deployment script
│   ├── network.ts               # Network configuration manager
│   └── wallet.ts                # Wallet construction & state sync
├── test/
│   ├── moon-vow.test.ts         # TypeScript test suite
│   └── moon-vow.test.js         # ES Module test suite (npm test)
├── .env.example                 # Root environment variable template
├── .midnight-state.json         # Deployment state storage
├── .moonvow-local-secrets.json  # Local private witness secret storage (gitignored)
├── docker-compose.yml           # Devnet stack (node, indexer, proof-server)
├── vercel.json                  # Vercel deployment configuration
├── package.json
└── README.md
```



