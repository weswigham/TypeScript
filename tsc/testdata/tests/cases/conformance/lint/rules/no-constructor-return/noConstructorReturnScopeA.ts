// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-constructor-return": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
class Example {
    constructor(value: boolean) {
        function nested() { return 1; }
        const arrow = () => { return 2; };
        if (value) { return {}; }
        return;
    }
    method() { return 3; }
}