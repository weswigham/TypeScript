//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackComputedThis.ts] ////

//// [input.ts]
foo(function() { const o = {[this.x]() {}}; });

//// [input.ts]
foo(function() { const o = {[this.x]() {}}; });
