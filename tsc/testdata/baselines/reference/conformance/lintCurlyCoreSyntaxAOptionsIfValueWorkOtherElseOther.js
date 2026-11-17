//// [tests/cases/conformance/lint/rules/curly/lintCurlyCoreSyntaxAOptionsIfValueWorkOtherElseOther.ts] ////

//// [input.ts]
if (value) { work(); other(); } else other();

//// [input.ts]
if (value) { work(); other(); } else {
    other();
}
