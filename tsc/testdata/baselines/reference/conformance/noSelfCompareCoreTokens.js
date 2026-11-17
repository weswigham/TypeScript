//// [tests/cases/conformance/lint/rules/no-self-compare/noSelfCompareCoreTokens.ts] ////

//// [input.ts]
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

//// [input.ts]
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
