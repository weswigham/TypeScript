// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-unnecessary-parameter-property-assignment":"error"}},"files":["input.ts"]}
// @filename: input.ts
export {};
class Redundant {
    constructor(public value: number) {
        this.value = value;
    }
}
class Modified {
    constructor(public value: number) {
        value = 1;
        this.value = value;
    }
}
class Ordinary {
    value: number;
    constructor(value: number) {
        this.value = value;
    }
}