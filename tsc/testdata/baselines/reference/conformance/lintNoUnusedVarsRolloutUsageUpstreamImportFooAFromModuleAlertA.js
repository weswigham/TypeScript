//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamImportFooAFromModuleAlertA.ts] ////

//// [globals.d.ts]

//// [input.ts]
import foo, { a } from 'module'; alert(a);

//// [input.ts]
import foo, { a } from 'module'; alert(a);
