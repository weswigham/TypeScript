//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773411.ts] ////

//// [input.ts]

import type * as constants from './constants';

export type Y = {
  [constants.X]: ReadonlyArray<string>;
};
        

//// [input.ts]

import type * as constants from './constants';

export type Y = {
  [constants.X]: ReadonlyArray<string>;
};
        
