// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/prefer-optional-chain": ["error", { "checkAny": false, "requireNullish": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const optional: { name: string } | undefined;
const guarded = optional && optional.name;

declare const nullable: { name: string } | null;
const nullGuarded = nullable && nullable.name;

const chained = optional?.name;
declare const definite: { name: string };
const nonNullish = definite && definite.name;
declare const unchecked: any;
const ignored = unchecked && unchecked.name;