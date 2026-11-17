// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/explicit-member-accessibility": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
class Accessibility {
    value = 1;
    run(): number { return this.value; }
    get inferred(): number { return this.value; }
    public constructor() {}
    public validField = 2;
    public validMethod(): number { return this.validField; }
    protected protectedField = 3;
    private privateField = 4;
    #nativePrivate = 5;
}
export {};