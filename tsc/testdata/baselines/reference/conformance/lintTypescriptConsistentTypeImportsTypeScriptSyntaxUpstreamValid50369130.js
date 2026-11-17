//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid50369130.ts] ////

//// [input.ts]

import type { Type } from 'foo';
import { Foo, Bar } from 'foo';
@deco
class A {
  constructor(foo: Foo) {}
}
type T = Bar;
      

//// [input.ts]

import type { Type } from 'foo';
import { Foo, Bar } from 'foo';
@deco
class A {
  constructor(foo: Foo) {}
}
type T = Bar;
      
