//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid50369100.ts] ////

//// [input.ts]

import type { ClassA } from './classA';

export class ClassB {
  public constructor(node: ClassA) {}
}
      

//// [input.ts]

import type { ClassA } from './classA';

export class ClassB {
  public constructor(node: ClassA) {}
}
      
