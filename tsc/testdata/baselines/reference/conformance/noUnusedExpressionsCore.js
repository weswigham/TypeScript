//// [tests/cases/conformance/lint/rules/no-unused-expressions/noUnusedExpressionsCore.ts] ////

//// [input.tsx]
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

//// [input.tsx]
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
