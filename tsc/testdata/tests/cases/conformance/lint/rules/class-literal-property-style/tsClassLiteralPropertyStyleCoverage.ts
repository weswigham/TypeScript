// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/class-literal-property-style": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
class LiteralGetters {
    get label() { return "fixed"; }
    get count() { return 1; }
    readonly validLabel = "fixed";
    readonly validCount = 1;
    private stored = 0;
    get mutable() { return 1; }
    set mutable(value: number) { this.stored = value; }
    get computed() { return this.stored + 1; }
}
export {};