//// [tests/cases/conformance/lint/rules/no-unsafe-optional-chaining/noUnsafeOptionalChainingCore.ts] ////

//// [input.ts]
(obj?.method)();
(obj?.key).prop;
new (obj?.ctor)();
const { key } = obj?.value;
([{ foo } = obj?.value] = []);
for (item of obj?.items) {}
class Example extends obj?.base {}
const spread = [...obj?.items];
const safeSpread = { ...obj?.items };
obj?.method();
(obj?.key ?? fallback).prop;
obj?.value + other;

//// [input.ts]
(obj?.method)();
(obj?.key).prop;
new (obj?.ctor)();
const { key } = obj?.value;
([{ foo } = obj?.value] = []);
for (item of obj?.items) {}
class Example extends obj?.base {}
const spread = [...obj?.items];
const safeSpread = { ...obj?.items };
obj?.method();
(obj?.key ?? fallback).prop;
obj?.value + other;
