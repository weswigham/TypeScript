//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid5036970.ts] ////

//// [input.ts]

import Foo from 'foo';
class A {
  @deco
  get foo() {}

  set ['foo'](value: Foo) {}
}
      

//// [input.ts]

import Foo from 'foo';
class A {
  @deco
  get foo() {}

  set ['foo'](value: Foo) {}
}
      
