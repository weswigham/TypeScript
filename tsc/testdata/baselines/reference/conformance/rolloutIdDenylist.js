//// [tests/cases/conformance/lint/rules/id-denylist/rolloutIdDenylist.ts] ////

//// [input.ts]
let denied;
denied = 1;
denied(denied);
object.denied;
object.denied = 1;
const { denied: allowed, other: deniedAlias } = source;
class Example { #denied; method() { this.#denied = 1; } }
import { denied as imported } from "module";
export { imported as denied };

//// [input.ts]
let denied;
denied = 1;
denied(denied);
object.denied;
object.denied = 1;
const { denied: allowed, other: deniedAlias } = source;
class Example { #denied; method() { this.#denied = 1; } }
import { denied as imported } from "module";
export { imported as denied };
