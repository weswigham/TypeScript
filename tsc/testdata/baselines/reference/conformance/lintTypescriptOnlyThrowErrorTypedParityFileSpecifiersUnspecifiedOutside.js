//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorTypedParityFileSpecifiersUnspecifiedOutside.ts] ////

//// [types.ts]
export class Allowed { value = 0; }
//// [input.ts]
import { Allowed } from '../../outside/types'; throw new Allowed();
export {};

//// [types.ts]
export class Allowed { value = 0; }
//// [input.ts]
import { Allowed } from '../../outside/types'; throw new Allowed();
export {};
