//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327300.ts] ////

//// [input.ts]

function foo({ a } = new Foo<string>()) {}
      

//// [input.ts]

function foo({ a }: Foo<string> = new Foo()) {}
      
