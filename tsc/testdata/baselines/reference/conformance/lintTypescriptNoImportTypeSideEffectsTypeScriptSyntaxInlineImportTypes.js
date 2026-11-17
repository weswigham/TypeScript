//// [tests/cases/conformance/lint/rules/no-import-type-side-effects/lintTypescriptNoImportTypeSideEffectsTypeScriptSyntaxInlineImportTypes.ts] ////

//// [input.ts]
import { type First, type Second as Alias } from 'mod';

//// [input.ts]
import type { First, Second as Alias } from 'mod';
