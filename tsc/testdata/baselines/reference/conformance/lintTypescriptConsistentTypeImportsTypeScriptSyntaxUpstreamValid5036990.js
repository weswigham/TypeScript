//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid5036990.ts] ////

//// [input.ts]

import * as foo from 'foo';
@deco
class A {
  constructor(foo: foo.Foo) {}
}
      

//// [input.ts]

import * as foo from 'foo';
@deco
class A {
  constructor(foo: foo.Foo) {}
}
      
