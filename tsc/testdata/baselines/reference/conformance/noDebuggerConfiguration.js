//// [tests/cases/conformance/lint/rules/no-debugger/noDebuggerConfiguration.ts] ////

//// [base.json]
{
    "lint": { "rules": { "no-debugger": "error" } }
}

//// [input.ts]
debugger;

//// [input.ts]
;
