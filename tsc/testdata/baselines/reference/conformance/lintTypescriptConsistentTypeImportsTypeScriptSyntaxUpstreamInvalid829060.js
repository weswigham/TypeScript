//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829060.ts] ////

//// [input.ts]

import foo from 'foo';
type Bar = foo.Bar; // TSQualifiedName
          

//// [input.ts]

import type foo from 'foo';
type Bar = foo.Bar; // TSQualifiedName
          
