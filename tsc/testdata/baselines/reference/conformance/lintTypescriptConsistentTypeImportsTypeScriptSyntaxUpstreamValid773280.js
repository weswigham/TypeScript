//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773280.ts] ////

//// [input.ts]

import Type from 'foo';

export { Type }; // is a value export
export default Type; // is a value export
        

//// [input.ts]

import Type from 'foo';

export { Type }; // is a value export
export default Type; // is a value export
        
