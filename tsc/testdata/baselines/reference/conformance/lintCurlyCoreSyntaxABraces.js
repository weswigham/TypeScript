//// [tests/cases/conformance/lint/rules/curly/lintCurlyCoreSyntaxABraces.ts] ////

//// [input.ts]
if (value) work(); else other(); while (value) work();

//// [input.ts]
if (value) {
    work();
} else {
    other();
} while (value) {
    work();
}
