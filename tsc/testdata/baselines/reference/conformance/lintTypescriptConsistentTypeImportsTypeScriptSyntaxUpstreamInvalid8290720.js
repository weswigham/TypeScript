//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290720.ts] ////

//// [input.ts]

import * as foo from 'foo';
@deco
class A {
  constructor(foo: foo.Foo) {}
}
          

//// [input.ts]

import type * as foo from 'foo';
@deco
class A {
  constructor(foo: foo.Foo) {}
}
          
