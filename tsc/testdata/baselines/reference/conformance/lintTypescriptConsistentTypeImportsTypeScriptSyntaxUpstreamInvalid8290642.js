//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290642.ts] ////

//// [input.ts]

import Foo from 'foo';
@deco
class A {
  constructor(foo: Foo) {}
}
          

//// [input.ts]

import type Foo from 'foo';
@deco
class A {
  constructor(foo: Foo) {}
}
          
