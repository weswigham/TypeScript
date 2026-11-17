//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesTypedParityFileSpecifiersEmptyPath.ts] ////

//// [types.ts]
export interface Allowed { value: number; }
//// [input.ts]
import { Allowed } from '../types'; function f(value: Allowed) {}
export {};

//// [input.ts]
import { Allowed } from '../types'; function f(value: Allowed) {}
export {};
//// [types.ts]
export interface Allowed { value: number; }
