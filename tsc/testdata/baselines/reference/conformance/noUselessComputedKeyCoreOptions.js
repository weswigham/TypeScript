//// [tests/cases/conformance/lint/rules/no-useless-computed-key/noUselessComputedKeyCoreOptions.ts] ////

//// [input.ts]
({ ["key"]: value });
class Example { ["key"]() {} ["field"]; }

//// [input.ts]
({ "key": value });
class Example { ["key"]() {} ["field"]; }
