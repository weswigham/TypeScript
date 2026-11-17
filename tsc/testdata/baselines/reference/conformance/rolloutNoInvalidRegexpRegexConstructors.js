//// [tests/cases/conformance/lint/rules/no-invalid-regexp/rolloutNoInvalidRegexpRegexConstructors.ts] ////

//// [input.ts]
RegExp("[");
new RegExp(".", "gg");
RegExp(".", "uv");
RegExp("\\1", "u");
RegExp("\\1");
RegExp("[[a-z]--[aeiou]]", "v");
RegExp("/");

//// [input.ts]
RegExp("[");
new RegExp(".", "gg");
RegExp(".", "uv");
RegExp("\\1", "u");
RegExp("\\1");
RegExp("[[a-z]--[aeiou]]", "v");
RegExp("/");
