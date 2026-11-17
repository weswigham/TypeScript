//// [tests/cases/conformance/lint/rules/no-floating-promises/lintTypescriptNoFloatingPromisesTypedParityFileSpecifiersWrongDirectory.ts] ////

//// [types.ts]
export type Allowed = Promise<void> & { brand: true };
//// [input.ts]
import { Allowed } from '../../outside/types'; declare const value: Allowed; value;
export {};

//// [types.ts]
export type Allowed = Promise<void> & { brand: true };
//// [input.ts]
import { Allowed } from '../../outside/types'; declare const value: Allowed; value;
export {};
