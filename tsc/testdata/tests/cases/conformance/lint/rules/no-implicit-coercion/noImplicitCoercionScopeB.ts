// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-implicit-coercion":"error"}},"files":["input.ts"]}
// @filename: input.ts
const boolean = !!value;
const sequence = !!(first, second);
typeof!!value;
+value;
- -value;
value * 1;
value - 0;
"" + value;
value += "";
~items.indexOf(value);
~items?.lastIndexOf(value);
`${value}`;
function shadow(Boolean) { return !!value; }
const comment = !!(/* keep */value);
value * 1 / 4;
(value * 1) / 4;