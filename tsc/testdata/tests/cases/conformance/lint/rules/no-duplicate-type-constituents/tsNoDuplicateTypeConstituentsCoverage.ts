// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "target": "esnext",
        "module": "preserve"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-duplicate-type-constituents": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
type Original = string;
type Alias = Original;
type DuplicateAliases = Original | Alias;
type DuplicateObjects = { value: string } | { value: string };
type NestedDuplicate = string | (number | string);
function optionalValue(value?: string | undefined) {
    return value;
}

type DistinctPrimitives = string | number;
type DistinctIntersection = { first: string } & { second: number };
type DistinctObjectSyntax = { first: string; second: number } | { second: number; first: string };
function optionalString(value?: string) {
    return value;
}