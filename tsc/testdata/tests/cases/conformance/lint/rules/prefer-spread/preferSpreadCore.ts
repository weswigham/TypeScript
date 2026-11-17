// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "prefer-spread": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
foo.apply(null, args);
object.method.apply(object, args);
foo["apply"](null, args);
foo.apply(null, []);
foo.apply(null, ...args);
(a?.b).c.foo.apply(a?.b.c, args);
a?.b.c.foo.apply((a?.b).c, args);