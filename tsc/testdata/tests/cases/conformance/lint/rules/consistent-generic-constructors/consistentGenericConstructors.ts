// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "@typescript-eslint/consistent-generic-constructors": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
class Box<T> {}
const plain: Box<string> = new Box();
const bare: Box<number> = new Box;
const comments: /* before */ Box /* after */ <string> = new Box();
const inside: Box</* retained */ string> = new Box();
const existing: Box<string> = new Box<string>();
const different: Other<string> = new Box();
const builtin: Uint8Array<ArrayBufferLike> = new Uint8Array();
function shadowed() {
    class Uint8Array<T> {}
    const local: Uint8Array<string> = new Uint8Array();
}
function defaults(value: Box<string> = new Box()) {}
const arrow = (value: Box<string> = new Box()) => value;
class Properties {
    property: Box<string> = new Box();
    ["computed"]: Box<number> = new Box;
    accessor value: Box<string> = new Box();
    constructor(public parameter: Box<string> = new Box()) {}
    method(value: Box<string> = new Box()) {}
}