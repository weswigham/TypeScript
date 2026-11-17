// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-throw-literal": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
throw 'error';
throw 0;
throw false;
throw null;
throw {};
throw undefined;
throw 'a' + error;
throw error += new Error();
throw error &&= 'literal';
throw error && 'literal';
throw `${error}`;
throw new Error();
throw error ||= 'literal';
throw error ??= 'literal';
throw foo ? new Error() : 'literal';
throw tag`${error}`;
function shadowed(undefined) { throw undefined; }