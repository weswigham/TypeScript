//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid77352.ts] ////

//// [input.ts]

import Foo from 'foo';
function fn() {
  type Foo = {}; // shadowing
  let foo: Foo;
}
        

//// [input.ts]

import Foo from 'foo';
function fn() {
  type Foo = {}; // shadowing
  let foo: Foo;
}
        
