// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-restricted-globals":["error","event",{"name":"missing","message":"Use a local binding."}]}},"files":["input.ts"]}
// @filename: input.ts
event;
const object = { event };
object.event;
missing();
function shadow(event) { return event; }
let type: event;