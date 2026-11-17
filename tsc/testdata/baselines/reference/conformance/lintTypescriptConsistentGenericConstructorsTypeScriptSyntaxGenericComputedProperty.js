//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericComputedProperty.ts] ////

//// [input.ts]
class C { ['key']: Box<string> = new Box; }

//// [input.ts]
class C { ['key'] = new Box<string>(); }
