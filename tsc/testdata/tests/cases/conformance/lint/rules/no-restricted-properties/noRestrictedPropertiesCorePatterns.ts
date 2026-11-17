// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-restricted-properties": ["error", { "object": "foo", "property": "bar", "message": "Use baz instead." }, { "property": "bad" }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
foo.bar;
foo['bar'];
foo?.bar;
foo[dynamic];
other.bar;
const {bar: baz} = foo;
({bar: baz = 1} = foo);
function value({bar} = foo) {}
const {bar: {bad} = {}} = foo;
({bad}) => {};
const [{bad}] = source;
class Example { #bad; bad = 0; method() { this.#bad; this['bad']; } }