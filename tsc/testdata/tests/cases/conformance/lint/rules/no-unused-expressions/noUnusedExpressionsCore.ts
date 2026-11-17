// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "jsx": "preserve" },
    "lint": { "rules": { "no-unused-expressions": "error" } },
    "files": ["input.tsx"]
}

// @filename: input.tsx
"directive";
call();
"not directive";
value as any;
value!;
Map<string, number>;
value && call();
value ? call() : other();
obj?.key;
obj?.method();
void call();
delete obj.key;
tag`template`;
<div />;
namespace Foo { "directive"; }
class Example { static { "not directive"; } }