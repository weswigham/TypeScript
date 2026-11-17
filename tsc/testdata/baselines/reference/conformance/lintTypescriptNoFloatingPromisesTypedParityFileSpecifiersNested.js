//// [tests/cases/conformance/lint/rules/no-floating-promises/lintTypescriptNoFloatingPromisesTypedParityFileSpecifiersNested.ts] ////

//// [types.ts]
export type Allowed = Promise<void> & { brand: true };
//// [input.ts]
import { Allowed } from './types'; declare const value: Allowed; value;
export {};

//// [input.ts]
import { Allowed } from './types'; declare const value: Allowed; value;
export {};
//// [types.ts]
export type Allowed = Promise<void> & { brand: true };
