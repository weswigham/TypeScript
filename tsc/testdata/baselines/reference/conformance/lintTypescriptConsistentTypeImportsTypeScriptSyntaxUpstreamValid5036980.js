//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid5036980.ts] ////

//// [input.ts]

import type { Foo } from 'foo';
const key = 'k';
class A {
  @deco
  get [key]() {}

  set [key](value: Foo) {}
}
      

//// [input.ts]

import type { Foo } from 'foo';
const key = 'k';
class A {
  @deco
  get [key]() {}

  set [key](value: Foo) {}
}
      
