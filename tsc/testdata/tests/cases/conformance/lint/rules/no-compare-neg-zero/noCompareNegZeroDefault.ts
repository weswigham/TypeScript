// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-compare-neg-zero": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const value: any;
value === -0;
-0 !== value;
value == -0;
-0 != value;
value > -0;
-0 >= value;
value < -0;
-0 <= value;
-0 === -0;
value === -(0x0);
value === (-0.0);
value === -0e10;
value === -1e-9999;
value === /* keep this comment */ -0;
value === 0;
value === "-0";
value === -1;
value === -0n;
value === +0;
value === -(-0);
Object.is(value, -0);