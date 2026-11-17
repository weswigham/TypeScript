//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesTypedParityFileSpecifiersParentRelative.ts] ////

//// [types.ts]
export interface Allowed { value: number; }
//// [input.ts]
import { Allowed } from '../../outside/types'; function f(value: Allowed) {}
export {};

//// [types.ts]
export interface Allowed { value: number; }
//// [input.ts]
import { Allowed } from '../../outside/types'; function f(value: Allowed) {}
export {};
