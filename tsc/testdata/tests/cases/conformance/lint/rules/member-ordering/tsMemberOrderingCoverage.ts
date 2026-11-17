// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/member-ordering": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
class InvalidOrder {
    run(): number { return this.value; }
    value = 1;
}
interface InvalidInterface {
    run(): void;
    value: number;
}
class ValidOrder {
    value = 1;
    constructor() { this.value = 2; }
    run(): number { return this.value; }
}
interface ValidInterface {
    value: number;
    run(): void;
}
export {};