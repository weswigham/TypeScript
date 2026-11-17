//// [tests/cases/conformance/lint/rules/no-void/noVoidStatements.ts] ////

//// [input.ts]
void 0;
void(0);
const value = void work();
const nested = void (void 0);
(void 0);
const object = { void() {}, value: 0 };
object.void();
object.value = 1;
type Callback = () => void;
function work(): void {}

//// [input.ts]
void 0;
void(0);
const value = void work();
const nested = void (void 0);
(void 0);
const object = { void() {}, value: 0 };
object.void();
object.value = 1;
type Callback = () => void;
function work(): void {}
