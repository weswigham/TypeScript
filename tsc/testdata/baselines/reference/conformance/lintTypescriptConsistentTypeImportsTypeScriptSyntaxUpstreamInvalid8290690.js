//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290690.ts] ////

//// [input.ts]

import Foo from 'foo';
class A {
  @deco
  set foo(value: Foo) {}
}
          

//// [input.ts]

import type Foo from 'foo';
class A {
  @deco
  set foo(value: Foo) {}
}
          
