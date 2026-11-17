// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-self-assign": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
a = a;
a &&= a;
a ||= a;
a ??= a;
a += a;
[a, ...b] = [a, ...b];
[...a] = [...a, 1];
[x, a] = [...x, a];
({a, b} = {a, ...x, b});
({a: {b}, c: [d]} = {a: {b}, c: [d]});
({['a']: b} = {a: b});
({a = 1} = {a});
a.b = a['b'];
a.b = a?.b;
a[b + 1] = a[b + 1];
class Example { #field; method() { this.#field = this.#field; } }