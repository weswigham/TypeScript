// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-computed-key": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
({ [("x")]: 0 });
({ [/* keep */ "x"]: 0 });
({ ["__proto__"]: 0 });
({ ["__proto__"]: value } = source);
const { ["key"]: renamed } = source;
({ get[2]() {} });
class Example {
    ["x"]() {}
    ["constructor"]() {}
    static ["prototype"]() {}
    static[0];
}