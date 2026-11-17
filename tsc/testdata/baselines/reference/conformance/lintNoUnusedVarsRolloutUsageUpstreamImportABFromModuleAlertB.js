//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamImportABFromModuleAlertB.ts] ////

//// [globals.d.ts]

//// [input.ts]
import { a, b } from 'module'; alert(b);

//// [input.ts]
import { a, b } from 'module'; alert(b);
