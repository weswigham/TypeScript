// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-dupe-args": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
function repeated(first, first, first) {}
function twoNames(first, second, first, second) {}
const expression = function named(first, second, first) {};
function destructured({ key: first }, [first]) {}
function nested({ key: [first, { other: first }] }) {}
function defaults(first = 0, first = 1) {}
const object = { method(first, first) {} };
class Example { method(first, first) {} }
function escaped(first, \u0066irst) {}
function distinct(first, second, third) {}
function keys({ first: value }, { first: other }) {}
function holes([, first], [,, second]) {}
function nestedScope(first, second = function(first) {}) {}
const arrow = (first, first) => {};
declare function overload(first: any, first: any): void;