//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream525.ts] ////

//// [input.ts]
throw new Error(); foo(); import foo from 'foo'; foo();

//// [input.ts]
throw new Error(); foo(); import foo from 'foo'; foo();
