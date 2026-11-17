// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/unified-signatures": ["error", { "ignoreDifferentlyNamedParameters": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare function run(value: number): void;
declare function run(value: string): void;

declare class Item {
    run(): void;
    run(value: number): void;
}

interface DifferentArity {
    run(): void;
    run(value: number, other: number): void;
}

declare function named(value: number): void;
declare function named(other: string): void;

declare function unified(value: number | string): void;