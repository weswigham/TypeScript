//// [tests/cases/conformance/lint/rules/no-self-assign/noSelfAssignCorePatterns.ts] ////

//// [input.ts]
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

//// [input.ts]
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
