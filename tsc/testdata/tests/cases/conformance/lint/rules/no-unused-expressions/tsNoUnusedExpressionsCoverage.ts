// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const value: number;
declare const enabled: boolean;
declare function run(): void;

value as number;
value!;
enabled && value;

run();
enabled && run();
void value;