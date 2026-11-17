//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid50369150.ts] ////

//// [input.ts]

import type { Foo, T } from 'foo';
import { V } from 'foo';
@deco
class A {
  constructor(foo: Foo) {}
}
      

//// [input.ts]

import type { Foo, T } from 'foo';
import { V } from 'foo';
@deco
class A {
  constructor(foo: Foo) {}
}
      
