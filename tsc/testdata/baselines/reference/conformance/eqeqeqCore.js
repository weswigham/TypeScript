//// [tests/cases/conformance/lint/rules/eqeqeq/eqeqeqCore.ts] ////

//// [input.ts]
left == right;
left != null;
typeof left == "string";
1 != 2;
"first" == `second`;
left === right;
typeof left /* Keep */ == "string";

//// [input.ts]
left == right;
left != null;
typeof left === "string";
1 !== 2;
"first" === `second`;
left === right;
typeof left /* Keep */ === "string";
