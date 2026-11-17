// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-self-compare": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
x === x;
x !== x;
x == x;
x != x;
x > x;
x < x;
x >= x;
x <= x;
foo.bar().baz.qux >= foo.bar ().baz .qux;
x === y;
'x' === "x";
class Example { #field; method() { this.#field === this.#field; this.#field === this['#field']; } }