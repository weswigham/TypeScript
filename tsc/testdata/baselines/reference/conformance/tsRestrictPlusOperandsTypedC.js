//// [tests/cases/conformance/lint/rules/restrict-plus-operands/tsRestrictPlusOperandsTypedC.ts] ////

//// [input.ts]
1 + 2;
'a' + 'b';
'a' + 1;
1n + 1;
[] + {};
declare const maybeString: string | null;
maybeString + '';
declare const untyped: any;
untyped + '';

//// [input.ts]
1 + 2;
'a' + 'b';
'a' + 1;
1n + 1;
[] + {};
declare const maybeString: string | null;
maybeString + '';
declare const untyped: any;
untyped + '';
