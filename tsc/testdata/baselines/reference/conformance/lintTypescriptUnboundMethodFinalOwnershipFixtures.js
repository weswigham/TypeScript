//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipFixtures.ts] ////

//// [input.ts]

class Owner {
    method() {}
    typed(this: Owner) {}
    independent(this: void) {}
    arrow = () => {};
}
const owner = new Owner();
const detached = owner.method;
const typed = owner.typed;
const { method: renamed } = owner;
const computed = owner['method'];
const promise = Promise.all;
owner.method();
owner.method.bind(owner);
const safe = owner.independent;
const arrow = owner.arrow;
const native = Math.floor;
const compare = new Intl.Collator().compare;

//// [input.ts]

class Owner {
    method() {}
    typed(this: Owner) {}
    independent(this: void) {}
    arrow = () => {};
}
const owner = new Owner();
const detached = owner.method;
const typed = owner.typed;
const { method: renamed } = owner;
const computed = owner['method'];
const promise = Promise.all;
owner.method();
owner.method.bind(owner);
const safe = owner.independent;
const arrow = owner.arrow;
const native = Math.floor;
const compare = new Intl.Collator().compare;
