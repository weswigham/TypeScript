//// [tests/cases/conformance/lint/rules/no-useless-concat/noUselessConcatCore.ts] ////

//// [input.ts]
"a" + "b";
foo + `a` + `b`;
(foo + "a") + ("b" + "c");
"a" +
    "b";
1 + "b";

//// [input.ts]
"a" + "b";
foo + `a` + `b`;
(foo + "a") + ("b" + "c");
"a" +
    "b";
1 + "b";
