// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/consistent-type-definitions": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
/** Retained documentation for the converted declaration. */
type ShapeViolation = { value: number };
type GenericViolation<Value> = { readonly value: Value };
interface ValidShape { value: number; }
type ValidUnion = string | number;
type ValidFunction = (value: number) => number;
export {};