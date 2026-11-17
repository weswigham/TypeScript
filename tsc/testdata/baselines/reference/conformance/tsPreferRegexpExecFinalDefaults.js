//// [tests/cases/conformance/lint/rules/prefer-regexp-exec/tsPreferRegexpExecFinalDefaults.ts] ////

//// [input.ts]
declare const text: string;
declare const dynamic: string;
declare const unknownPattern: RegExp;
const fixed = "ab";
text.match(/ab/);
text.match("a/b");
text.match(fixed);
text.match(new RegExp(dynamic));
text.match(/ab/g);
text.match(unknownPattern);
text.match("[");

//// [input.ts]
declare const text: string;
declare const dynamic: string;
declare const unknownPattern: RegExp;
const fixed = "ab";
/ab/.exec(text);
/a\/b/.exec(text);
RegExp(fixed).exec(text);
new RegExp(dynamic).exec(text);
text.match(/ab/g);
text.match(unknownPattern);
text.match("[");
