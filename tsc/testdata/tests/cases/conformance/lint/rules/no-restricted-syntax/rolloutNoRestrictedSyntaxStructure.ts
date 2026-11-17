// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext","jsx":"preserve"},"lint":{"rules":{"no-restricted-syntax":["error","!FunctionDeclaration:has(CallExpression[callee.name='eval'])","VariableDeclarator:not([init]):matches([id.name=/^missing/],[id.name='absent'])","ArrayExpression > Literal:nth-child(2)","ExpressionStatement + ExpressionStatement","JSXElement ~ JSXElement","MemberExpression[computed=type(boolean)][property.name='denied']"]}},"files":["input.tsx"]}
// @filename: input.tsx
function task() { eval("first"); eval("second"); }
let missingValue;
let absent;
const values = [1, 2, 3];
first();
second();
const elements = [<div />, <span />];
object.denied;