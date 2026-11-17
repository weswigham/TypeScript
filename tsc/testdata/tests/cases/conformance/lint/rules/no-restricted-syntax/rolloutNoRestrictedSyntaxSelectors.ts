// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-restricted-syntax":["error","CallExpression[callee.name='eval']",{"selector":"FunctionDeclaration[params.length>2]","message":"Keep signatures small. {{selector}}"},"Property > Literal.key","BreakStatement[label]","Literal[regex.flags=/i/]","[optional=true]","VariableDeclaration[kind='using']","VariableDeclaration[kind='await using']"]}},"files":["input.ts"]}
// @filename: input.ts
function tooMany(a, b, c) { eval(a); }
function small(a, b) { safe(a); }
const object = { foo: 1, "bar": 2 };
outer: for (;;) { break outer; }
for (;;) { break; }
const regex = /value/i;
const plain = /value/;
object?.foo?.();
{ using resource = acquire(); }
async function task() { await using resource = acquire(); }