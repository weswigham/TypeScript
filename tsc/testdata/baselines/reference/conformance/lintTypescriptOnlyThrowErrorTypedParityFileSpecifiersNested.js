//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorTypedParityFileSpecifiersNested.ts] ////

//// [types.ts]
export class Allowed { value = 0; }
//// [input.ts]
import { Allowed } from './types'; throw new Allowed();
export {};

//// [input.ts]
import { Allowed } from './types'; throw new Allowed();
export {};
//// [types.ts]
export class Allowed { value = 0; }
