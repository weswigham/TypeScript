//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/tsSwitchExhaustivenessCheckFinalOwnership.ts] ////

//// [input.ts]
enum State { Ready, Waiting }
declare const state: State;
switch (state) { case State.Ready: break; }
declare const payload: { kind: 'open' } | { kind: 'closed' };
switch (payload.kind) { case 'open': break; default: break; }
declare const enabled: boolean;
switch (enabled) { case true: break; }
declare const numeric: number;
switch (numeric) { case 1: break; }

//// [input.ts]
enum State { Ready, Waiting }
declare const state: State;
switch (state) { case State.Ready: break; }
declare const payload: { kind: 'open' } | { kind: 'closed' };
switch (payload.kind) { case 'open': break; default: break; }
declare const enabled: boolean;
switch (enabled) { case true: break; }
declare const numeric: number;
switch (numeric) { case 1: break; }
