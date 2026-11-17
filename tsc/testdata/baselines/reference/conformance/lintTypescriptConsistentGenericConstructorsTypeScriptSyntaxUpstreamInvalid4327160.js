//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327160.ts] ////

//// [input.ts]

function foo([a]: Foo<string> = new Foo()) {}
      

//// [input.ts]

function foo([a] = new Foo<string>()) {}
      
