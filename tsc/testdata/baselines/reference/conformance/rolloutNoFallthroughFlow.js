//// [tests/cases/conformance/lint/rules/no-fallthrough/rolloutNoFallthroughFlow.ts] ////

//// [input.ts]
declare const value: number;
declare function work(): void;
switch (value) { case 0: work(); case 1: break; }
switch (value) { case 0: work(); /* falls through */ case 1: break; }
switch (value) { case 0: break; /* falls through */ default: work(); }
switch (value) { case 0: try { work(); } finally { break; } case 1: work(); }
switch (value) { case 0: { work(); /* falls through */ } case 1: break; }

//// [input.ts]
declare const value: number;
declare function work(): void;
switch (value) { case 0: work(); case 1: break; }
switch (value) { case 0: work(); /* falls through */ case 1: break; }
switch (value) { case 0: break; /* falls through */ default: work(); }
switch (value) { case 0: try { work(); } finally { break; } case 1: work(); }
switch (value) { case 0: { work(); /* falls through */ } case 1: break; }
