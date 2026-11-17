// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-call": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
foo.call(undefined, 1);
foo.apply(void 0, [1]);
object.method.call(object, 1);
(object?.method).call(object, 1);
object.method.call(other, 1);
foo["call"](null, 1);
object.method.apply(object, args);