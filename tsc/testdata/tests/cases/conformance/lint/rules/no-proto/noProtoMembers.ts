// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-proto": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
object.__proto__;
object["__proto__"];
object[`__proto__`];
object["__pro\u0074o__"];
object?.__proto__;
object?.["__proto__"];
object.__proto__ = null;
delete object.__proto__;
object[__proto__];
object["__" + "proto__"];
object[`__proto__${""}`];
object[`__proto__
`];
const literal = { __proto__: null };
class Example {
    #__proto__;
    inspect() {
        this.#__proto__;
    }
}