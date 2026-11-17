//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamImportAAsFooFromModuleA.ts] ////

//// [globals.d.ts]

//// [input.ts]
import a, * as foo from 'module'; a();

//// [input.ts]
import a, * as foo from 'module'; a();
