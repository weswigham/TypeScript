//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290672.ts] ////

//// [input.ts]

import Foo from 'foo';
class A {
  @deco
  foo(): Foo {}
}
          

//// [input.ts]

import type Foo from 'foo';
class A {
  @deco
  foo(): Foo {}
}
          
