// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/prefer-destructuring":["error",{"VariableDeclarator":{"array":false,"object":true},"AssignmentExpression":{"array":true,"object":false}},{"enforceForDeclarationWithTypeAnnotation":true,"enforceForRenamedProperties":true}]}}}
// @filename: input.ts
declare const source: { value: number };
declare const values: number[];
const annotated: number = source.value;
const renamed = source.value;
const first = values[0];
let destination: number;
destination = values[0];
destination = source.value;