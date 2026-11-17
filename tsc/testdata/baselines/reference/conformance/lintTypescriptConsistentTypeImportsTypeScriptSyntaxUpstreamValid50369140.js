//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid50369140.ts] ////

//// [input.ts]

import { V } from 'foo';
import type { Foo, Bar, T } from 'foo';
@deco
class A {
  constructor(foo: Foo) {}
  foo(@deco bar: Bar) {}
}
      

//// [input.ts]

import { V } from 'foo';
import type { Foo, Bar, T } from 'foo';
@deco
class A {
  constructor(foo: Foo) {}
  foo(@deco bar: Bar) {}
}
      
