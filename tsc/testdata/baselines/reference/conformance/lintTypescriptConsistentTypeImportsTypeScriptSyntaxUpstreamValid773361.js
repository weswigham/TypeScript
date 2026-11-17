//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773361.ts] ////

//// [input.ts]

import * as Type from 'foo';

export { Type }; // is a type-only export
export default Type; // is a type-only export
export type { Type }; // is a type-only export
          

//// [input.ts]

import * as Type from 'foo';

export { Type }; // is a type-only export
export default Type; // is a type-only export
export type { Type }; // is a type-only export
          
