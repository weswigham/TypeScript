// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-unassigned-vars":"error"}},"files":["input.ts"]}
// @filename: input.ts
let read;
use(read);
let unused;
let written;
written = 1;
use(written);
let iterated;
for (iterated of values) use(iterated);
let updated;
updated++;
let shorthand;
const object = { shorthand };
declare let ambient;
use(ambient);
declare namespace Ambient { let value: string; }