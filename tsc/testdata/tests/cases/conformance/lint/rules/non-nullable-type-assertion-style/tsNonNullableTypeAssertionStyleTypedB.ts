// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true},"lint":{"rules":{"@typescript-eslint/non-nullable-type-assertion-style":"error"}}}
// @filename: input.ts
declare const nullable: string | null | undefined;
nullable as string;
nullable as string | null;
nullable as any;
"literal" as const;