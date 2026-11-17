//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid50369160.ts] ////

//// [input.ts]

import type * as Type from 'foo';
@deco
class A {
  constructor(foo: Type.Foo) {}
}
      

//// [input.ts]

import type * as Type from 'foo';
@deco
class A {
  constructor(foo: Type.Foo) {}
}
      
