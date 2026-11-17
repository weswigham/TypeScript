//// [tests/cases/conformance/lint/rules/no-global-assign/lintNoGlobalAssignRolloutBindingsRulesGlobalWrites.ts] ////

//// [input.ts]
Array = 1; String++; ({Object = 0} = source); for (Math of values) {}

//// [input.ts]
Array = 1; String++; ({Object = 0} = source); for (Math of values) {}
