# 🌙 MoonVow — Privacy-First Commitment App on Midnight

> A zero-knowledge decentralized application for proving personal commitments without revealing them.

[![Level 3 Submission](https://img.shields.io/badge/Level-3-blue.svg)](#) [![CI](https://github.com/prajaktagatkal0312/new-moon/actions/workflows/ci.yml/badge.svg)](https://github.com/prajaktagatkal0312/new-moon/actions/workflows/ci.yml) [![Language: Compact](https://img.shields.io/badge/Language-Compact-yellow.svg)](#) [![Compiler: v0.31.1](https://img.shields.io/badge/Compiler-v0.31.1-green.svg)](#)

**Live Demo URL:** [https://new-moon-tau.vercel.app/](https://new-moon-tau.vercel.app/)
**Demo Video:** [Watch on Loom](https://www.loom.com/share/f0adf2fe7cba4a809a140c5087e33135)

---

## 💡 Product Proposal

**Selected Idea:** *(Pending official submission — see [`docs/PROPOSAL.md`](./docs/PROPOSAL.md))*

Traditional goal-tracking platforms either force you to expose your personal ambitions publicly or rely on centralized servers. MoonVow serves as a privacy-first personal commitment tracking application leveraging Midnight Network's Zero-Knowledge (ZK) smart contracts written in Compact to give users cryptographic proof of commitment with complete privacy. Users can privately commit to personal goals, cryptographically prove they completed a previously registered vow, and lay the foundation for future expansions like reveal-on-completion, proof-of-streak, and zero-knowledge social accountability circles.

---

## 🔐 The Solution

MoonVow explicitly demonstrates the separation between public ledger state and client-side private witnesses in Midnight's Compact smart contract paradigm.

### 🌐 Public Ledger State (Blockchain)
The blockchain stores ONLY:
- `vowCount: Counter` — Total number of vows committed globally across the network.
- `vows: Map<Bytes<32>, Boolean>` — Keyed by a 32-byte cryptographic commitment hash; value indicates fulfilled status (`false` = unfulfilled, `true` = fulfilled).

### 🛡️ Private Witness Inputs (Off-Chain Client)
Inputs declared via `witness` that are resolved locally on the user's client machine and **NEVER** passed to `disclose()`:
- `goalTextHash: Bytes<32>` — SHA-256 hash of the goal text, kept strictly off-chain.
- `salt: Bytes<32>` — Random 256-bit salt preventing commitment collision or linkability across users.

### 📜 Deliberate `disclose()` Boundaries
When generating a commitment, the circuit computes a 32-byte persistent commitment hash locally from the private witness inputs. The `disclose(commitment)` boundary reveals ONLY the 32-byte hash commitment to serve as the public ledger map key. The `goalTextHash` and `salt` remain strictly private on the user's machine, are NEVER passed to `disclose()`, and are not stored on the public blockchain.

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js >= 22.0.0
- Docker & Docker Compose v2
- Compact Compiler (pinned version in create-mn-app)
- [Lace Wallet](https://www.lace.io/) browser extension (set to **Preview** network)

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
```

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
| `VITE_PREVIEW_CONTRACT_ADDRESS` | Deployed MoonVow contract address on Preview |
| `VITE_MIDNIGHT_INDEXER_URL` | Preview indexer GraphQL endpoint |
| `VITE_MIDNIGHT_NODE_URL` | Preview RPC node URL |

See [`.env.example`](.env.example) for all values.

### Switching Lace to Preview
1. Open the Lace wallet extension in your browser.
2. Go to **Settings → Network**.
3. Select **Preview**.
4. Refresh the MoonVow dApp page — the navbar will show a green "Connected" pill once on the correct network.

---

## 🏗️ Technical Architecture & Privacy Model

| Phase / Circuit | Public Ledger Data | Private Local Data | Circuit Execution |
|---|---|---|---|
| **Commit Vow**<br>`commitVow()` | `vows[Hash] = false`<br>`vowCount += 1` | `goalTextHash`<br>`salt` | `persistentCommit(goalTextHash, salt)` is computed locally. Circuit asserts the hash does not already exist, then `disclose()`s the hash to the ledger. |
| **Fulfill Vow**<br>`fulfillVow()` | `vows[Hash] = true` | `goalTextHash`<br>`salt` | `persistentCommit(goalTextHash, salt)` is recomputed locally. Circuit asserts the hash exists and is currently `false`, then `disclose()`s the hash and `true` status. |

- **What an observer CAN learn**: A commitment existed, the commitment hash, the fulfilled status, the block height, and the global `vowCount`.
- **What an observer CANNOT learn**: The goal text, the salt, or any identity linkage between vows.

To verify this yourself, view the contract on the Preview Explorer and inspect any `commitVow` transaction — you'll see only the 32-byte hash commitment in the public state. 

---

## 📸 Deployment & Compilation Evidence

### 🧪 Midnight Preview Testnet Deployment (Active Contract)
| Parameter | Details |
|---|---|
| **Network** | Midnight Preview Testnet |
| **Contract ID (Address)** | `e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944` |
| **Deployer Address** | `mn_addr_preview10j4v0yvnyueuq2yekl9sqwc2lxkg87vw3pqv33kpsurjzcflt54ssz5l0v` |
| **Compiler Version** | Compact v0.23+ / v0.31.1 |
| **Contract Status** | 🟢 Active & Deployed on Preview |

### ⚙️ Compact Compiler Output
Below is the compilation output showing `contracts/moon-vow.compact` compiled into `contracts/managed/moon-vow` with `commitVow` and `fulfillVow` circuits:

![Compact Compiler Output](./docs/screenshot-compile.jpeg)
> The raw text log is also available at [`docs/screenshot-compile.txt`](./docs/screenshot-compile.txt) for text-searchable reference.

### 🚀 Preview Testnet Deployment
Below is the verified terminal deployment output confirming MoonVow deployed to Midnight Preview Testnet:

![Preview Testnet Deployment](./docs/screenshot-deploy.png)

---

## 🧪 Test Suite

The project includes an automated test suite containing **4** passing tests that comprehensively verify the ZK contract lifecycle:

1. **Fresh Commitment (`commitVow`)**: Verifies that submitting a fresh goal and salt succeeds, increments `vowCount`, and sets the commitment hash status in `vows` to `false`.
2. **Duplicate Rejection (`commitVow`)**: Verifies that calling `commitVow` twice with an identical goal and salt is correctly rejected by the ledger.
3. **Successful Fulfillment (`fulfillVow`)**: Verifies that fulfilling an existing unfulfilled commitment succeeds and flips its ledger status to `true`.
4. **Invalid Fulfillment (`fulfillVow`)**: Verifies that attempting to fulfill a nonexistent or already-fulfilled commitment fails securely.

### Test Suite Output
Below is the verified test execution showing all 4 ZK contract lifecycle tests passing:

![Test Suite Output](./docs/screenshot-test.png) *(Note: Placeholder - real screenshot missing, please provide)*

---

## 📁 Workspace Structure

```text
my-app/
├── contracts/
│   ├── moon-vow.compact         # Compact ZK smart contract source
│   └── managed/moon-vow/        # Compiled circuits, keys, and JS bindings
├── docs/
│   ├── screenshot-compile.jpeg  # Terminal compilation output screenshot
│   └── screenshot-deploy.png    # Terminal deployment screenshot
├── frontend/                    # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── main.tsx             # Entry point
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Header with Lace wallet connect/disconnect
│   │   │   ├── PrivacyPanel.tsx # Observable Privacy Center (public vs private)
│   │   │   ├── CommitVowForm.tsx# commitVow circuit call form
│   │   │   └── FulfillVowList.tsx# fulfillVow circuit call list
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
├── docker-compose.yml           # Devnet stack (node, indexer, proof-server)
├── vercel.json                  # Vercel deployment configuration
├── package.json
└── README.md
```

---

## 🌐 Network & Wallet Details

To run locally against the Preview Testnet, ensure your local `.env` is configured with the following active network addresses:
- **Contract ID:** `e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944`
- **Deployer Address:** `mn_addr_preview10j4v0yvnyueuq2yekl9sqwc2lxkg87vw3pqv33kpsurjzcflt54ssz5l0v`

Switch the network targeting by running:
```bash
npm run network preview
```
