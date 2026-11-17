//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829001.ts] ////

//// [input.ts]

import Foo from 'foo';
let foo: Foo;
type Bar = Foo;
interface Baz {
  foo: Foo;
}
function fn(a: Foo): Foo {}
          

//// [input.ts]

import type Foo from 'foo';
let foo: Foo;
type Bar = Foo;
interface Baz {
  foo: Foo;
}
function fn(a: Foo): Foo {}
          
