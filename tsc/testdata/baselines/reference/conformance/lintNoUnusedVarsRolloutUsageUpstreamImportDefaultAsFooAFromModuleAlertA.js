//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamImportDefaultAsFooAFromModuleAlertA.ts] ////

//// [globals.d.ts]

//// [input.ts]
import { default as foo, a } from 'module'; alert(a);

//// [input.ts]
import { default as foo, a } from 'module'; alert(a);
