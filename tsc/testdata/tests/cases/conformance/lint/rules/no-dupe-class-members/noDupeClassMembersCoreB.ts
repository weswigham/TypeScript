// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-dupe-class-members":"error"}},"files":["input.ts"]}
// @filename: input.ts
class Item {
    value;
    ['value']() {}
    static value() {}
    get pair() { return 1; }
    set pair(value) {}
    get pair() { return 2; }
    method(value: string): void;
    method(value: any) {}
    #value;
    constructor() {}
    ['constructor']() {}
}