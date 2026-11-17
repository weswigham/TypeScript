// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/prefer-namespace-keyword": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
// @ts-ignore: exercise the lint rule for legacy module declarations.
declare module Legacy {
    interface Shape { size: number; }
}

declare namespace Modern {
    interface Shape { size: number; }
}

declare module "external-package" {
    export interface Shape { size: number; }
}