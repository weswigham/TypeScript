//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290380.ts] ////

//// [input.ts]

import type { Type } from 'foo';

export { Type }; // is a type-only export
export default Type; // is a type-only export
export type { Type }; // is a type-only export
          

//// [input.ts]

import { Type } from 'foo';

export { Type }; // is a type-only export
export default Type; // is a type-only export
export type { Type }; // is a type-only export
          
