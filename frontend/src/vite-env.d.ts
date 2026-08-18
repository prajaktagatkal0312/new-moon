/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PREVIEW_CONTRACT_ADDRESS: string;
  readonly VITE_MIDNIGHT_INDEXER_URL: string;
  readonly VITE_MIDNIGHT_INDEXER_WS_URL: string;
  readonly VITE_MIDNIGHT_NODE_URL: string;
  readonly VITE_MIDNIGHT_PROOF_SERVER_URL: string;
  readonly VITE_MIDNIGHT_FAUCET_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
