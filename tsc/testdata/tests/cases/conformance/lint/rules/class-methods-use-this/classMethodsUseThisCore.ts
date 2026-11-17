// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "class-methods-use-this": ["error", { "exceptMethods": ["excepted"], "ignoreOverrideMethods": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
class Example {
    constructor() {}
    missing() { return 1; }
    nested() { return function() { return this; }; }
    present() { return () => this; }
    field = () => 1;
    excepted() {}
    static staticMethod() {}
}