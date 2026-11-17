//// [tests/cases/conformance/lint/rules/no-global-assign/lintNoGlobalAssignRolloutBindingsRulesGlobalDirective.ts] ////

//// [input.ts]
/* global custom:false, writable:true, disabled:off */ custom = 1; writable++; disabled = 1;

//// [input.ts]
/* global custom:false, writable:true, disabled:off */ custom = 1; writable++; disabled = 1;
