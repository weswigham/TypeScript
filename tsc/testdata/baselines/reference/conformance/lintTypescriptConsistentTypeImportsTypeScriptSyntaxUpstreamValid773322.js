//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773322.ts] ////

//// [input.ts]

import * as Type from 'foo';

export { Type }; // is a value export
export default Type; // is a value export
        

//// [input.ts]

import * as Type from 'foo';

export { Type }; // is a value export
export default Type; // is a value export
        
