// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-sparse-arrays": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const first = [,];
const second = [1,,2];
const third = [(( [a,] )),,,];
const fourth = [
    /* keep */, // keep
    ,
];
const dense = [1, 2,];
const [, value] = dense;
[, other] = dense;