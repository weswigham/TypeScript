//// [tests/cases/conformance/lint/rules/max-nested-callbacks/lintMaxNestedCallbacksCoreSyntaxACallbacks.ts] ////

//// [input.ts]
call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {});});});});});});});});});});});

//// [input.ts]
call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {});});});});});});});});});});});
