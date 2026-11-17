//// [tests/cases/conformance/lint/rules/no-unsafe-optional-chaining/noUnsafeOptionalChainingCoreArithmetic.ts] ////

//// [input.ts]
obj?.value + other;
value += obj?.value;
+obj?.value;
async function foo() { (await obj?.value) * other; }
(obj?.value ?? fallback) + other;
value |= obj?.value;

//// [input.ts]
obj?.value + other;
value += obj?.value;
+obj?.value;
async function foo() { (await obj?.value) * other; }
(obj?.value ?? fallback) + other;
value |= obj?.value;
