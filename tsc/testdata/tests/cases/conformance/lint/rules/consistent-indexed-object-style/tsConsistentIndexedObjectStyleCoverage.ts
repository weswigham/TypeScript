// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/consistent-indexed-object-style": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
type StringIndexViolation = { [name: string]: number };
interface NumberIndexViolation { [index: number]: string; }
type ValidRecord = Record<string, number>;
type RecursiveValid = { [name: string]: RecursiveValid };
type DependentValid<Shape> = { [Name in keyof Shape]: Shape[Name] };
interface NamedValid { name: string; }
export {};