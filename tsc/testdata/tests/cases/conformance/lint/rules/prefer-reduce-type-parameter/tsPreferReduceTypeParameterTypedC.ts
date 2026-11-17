// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
	"compilerOptions": { "target": "esnext", "strict": true },
	"lint": { "rules": { "@typescript-eslint/prefer-reduce-type-parameter": "error" } },
	"files": ["input.ts"]
}

// @filename: input.ts

[1, 2].reduce((acc, value) => acc.concat(value), [] as number[]);
[1, 2].reduce((acc, value) => acc.concat(value), <number[]>[]);
[1, 2].reduce<number[]>((acc, value) => acc.concat(value), []);
['a', 'b'].reduce((acc, key) => acc, {} as Record<'a' | 'b', boolean>);