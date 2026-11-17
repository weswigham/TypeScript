// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/array-type": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
type MutableViolation = Array<string>;
type ReadonlyViolation = ReadonlyArray<number>;
type UnionViolation = Array<string | number>;
type MutableValid = string[];
type ReadonlyValid = readonly number[];
type Shadowed<Array> = Array;
export {};