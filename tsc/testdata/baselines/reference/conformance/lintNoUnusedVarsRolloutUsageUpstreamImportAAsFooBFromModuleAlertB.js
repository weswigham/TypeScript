//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamImportAAsFooBFromModuleAlertB.ts] ////

//// [globals.d.ts]

//// [input.ts]
import { a as foo, b } from 'module'; alert(b);

//// [input.ts]
import { a as foo, b } from 'module'; alert(b);
