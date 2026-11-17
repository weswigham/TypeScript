// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
	"compilerOptions": { "target": "esnext", "strict": true },
	"lint": { "rules": { "@typescript-eslint/restrict-plus-operands": ["error", { "allowAny": false, "allowBoolean": false, "allowNullish": false, "allowNumberAndString": false, "allowRegExp": false }] } },
	"files": ["input.ts"]
}

// @filename: input.ts

1 + 2;
'a' + 'b';
'a' + 1;
1n + 1;
[] + {};
declare const maybeString: string | null;
maybeString + '';
declare const untyped: any;
untyped + '';