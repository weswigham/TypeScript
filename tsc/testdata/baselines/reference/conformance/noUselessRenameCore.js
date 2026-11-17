//// [tests/cases/conformance/lint/rules/no-useless-rename/noUselessRenameCore.ts] ////

//// [input.ts]
import { foo as foo, "bar" as bar, type Shape as Shape } from "module";
export { foo as "foo", bar as bar, type Shape as Shape };
const { value: value = (other), "key": key } = object;
({ value: (value) } = object);
({ value: (value) = other } = object);
({ value: /* keep */ value } = object);
const { [key]: key } = object;

//// [input.ts]
import { foo, bar, type Shape } from "module";
export { foo, bar, type Shape };
const { value = (other), key } = object;
({ value } = object);
({ value: (value) = other } = object);
({ value: /* keep */ value } = object);
const { [key]: key } = object;
