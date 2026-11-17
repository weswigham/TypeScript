//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamImportABAsFooFromModuleAlertA.ts] ////

//// [globals.d.ts]

//// [input.ts]
import { a, b as foo } from 'module'; alert(a);

//// [input.ts]
import { a, b as foo } from 'module'; alert(a);
