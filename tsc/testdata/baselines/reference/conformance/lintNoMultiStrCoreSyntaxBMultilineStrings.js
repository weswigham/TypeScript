//// [tests/cases/conformance/lint/rules/no-multi-str/lintNoMultiStrCoreSyntaxBMultilineStrings.ts] ////

//// [input.ts]
const first = 'line\
next'; const second = `line
next`; const third = 'line\nnext';

//// [input.ts]
const first = 'line\
next'; const second = `line
next`; const third = 'line\nnext';
