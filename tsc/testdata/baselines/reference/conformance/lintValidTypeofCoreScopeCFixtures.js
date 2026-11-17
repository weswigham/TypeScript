//// [tests/cases/conformance/lint/rules/valid-typeof/lintValidTypeofCoreScopeCFixtures.ts] ////

//// [input.ts]
typeof value === "strnig";
typeof value === undefined;
typeof value === 0;
typeof value === other;
typeof value === typeof other;
typeof value === "bigint";
"number" !== typeof value;
function shadowed(undefined: string) {
    return typeof value === undefined;
}

//// [input.ts]
typeof value === "strnig";
typeof value === undefined;
typeof value === 0;
typeof value === other;
typeof value === typeof other;
typeof value === "bigint";
"number" !== typeof value;
function shadowed(undefined: string) {
    return typeof value === undefined;
}
