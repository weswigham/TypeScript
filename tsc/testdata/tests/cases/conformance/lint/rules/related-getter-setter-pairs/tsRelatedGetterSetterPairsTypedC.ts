// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true },
    "lint": { "rules": { "@typescript-eslint/related-getter-setter-pairs": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts

interface InvalidPair {
    get value(): number;
    set value(value: string);
}
interface ValidPair {
    get value(): string;
    set value(value: string | undefined);
}