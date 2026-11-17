//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream524.ts] ////

//// [input.ts]
throw new Error(); import foo from 'foo'; foo();

//// [input.ts]
throw new Error(); import foo from 'foo'; foo();
