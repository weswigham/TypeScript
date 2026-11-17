//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamImportFooAFromModuleFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
import foo, { a } from 'module'; foo();

//// [input.ts]
import foo, { a } from 'module'; foo();
