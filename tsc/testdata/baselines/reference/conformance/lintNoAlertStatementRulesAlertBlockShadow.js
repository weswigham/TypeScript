//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertBlockShadow.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
alert(); { let alert; alert(); }

//// [input.ts]
alert(); { let alert; alert(); }
