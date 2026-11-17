// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "strict": true },
    "lint": { "rules": { "@typescript-eslint/require-array-sort-compare": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts

[1, 2].sort();
['a', 'b'].sort();
[1, 2].sort((left, right) => left - right);
declare const tuple: readonly [string, ...number[]];
tuple.toSorted();
function sortNumbers<Values extends number[]>(values: Values) {
    values.sort();
}
declare const custom: { sort(): void };
custom.sort();