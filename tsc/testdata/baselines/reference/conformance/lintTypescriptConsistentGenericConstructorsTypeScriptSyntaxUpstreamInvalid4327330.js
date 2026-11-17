//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327330.ts] ////

//// [input.ts]

const a = function (a = new Foo<string>()) {};
      

//// [input.ts]

const a = function (a: Foo<string> = new Foo()) {};
      
