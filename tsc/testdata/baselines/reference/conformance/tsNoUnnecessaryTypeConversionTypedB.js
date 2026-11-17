//// [tests/cases/conformance/lint/rules/no-unnecessary-type-conversion/tsNoUnnecessaryTypeConversionTypedB.ts] ////

//// [input.ts]
String("value");
Number(2);
Boolean(true);
BigInt(2n);
!!true;
++2;
~~2;
~~2.5;
function shadowed(String: (value: string) => string) { String("value"); }

//// [input.ts]
String("value");
Number(2);
Boolean(true);
BigInt(2n);
!!true;
++2;
~~2;
~~2.5;
function shadowed(String: (value: string) => string) { String("value"); }
