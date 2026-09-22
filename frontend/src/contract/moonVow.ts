import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

// Import using relative path so tsc doesn't complain without tsconfig paths
import * as MoonVow from '../../../contracts/managed/moon-vow/contract/index.js';

export type MoonVowPrivateState = {
  goalTextHash: Uint8Array;
  salt: Uint8Array;
};

export const compiledContract = CompiledContract.make('moon-vow', MoonVow.Contract).pipe(
  CompiledContract.withWitnesses({
    goalTextHash: (context: any) => {
      const state = context.privateState;
      if (!state.goalTextHash) throw new Error('goalTextHash not found in private state');
      return [context.privateState, state.goalTextHash];
    },
    salt: (context: any) => {
      const state = context.privateState;
      if (!state.salt) throw new Error('salt not found in private state');
      return [context.privateState, state.salt];
    },
  })
);

export const ledger = MoonVow.ledger;
