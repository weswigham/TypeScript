// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/consistent-type-assertions": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const source: unknown;
const numberViolation = <number>source;
const unionViolation = <string | number>source;
const validAssertion = source as number;
const validConst = 1 as const;
const angleConstViolation = <const>"literal";
export {};