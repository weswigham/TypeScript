//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/tsNoUnsafeEnumAssignmentUnsafeConformance.ts] ////

//// [input.ts]
enum Fruit { Apple, Banana }
enum Flags { Read = 1, Write = 2 }
const fruit: Fruit = 0;
const safe: Fruit = Fruit.Apple;
const union: Fruit | number = 0;
const nested: {fruit: Fruit} = {fruit: 0};
const generic: Set<Fruit> = new Set<number>();
const flags: Flags = Flags.Read | Flags.Write;
const invalidFlags: Flags = Flags.Read | 4;
declare function take(value: Fruit): void;
declare function rest(...values: [Fruit, Fruit]): void;
take(0);
rest(...[Fruit.Apple, 1] as const);
function get(): Fruit { return 0; }
async function getAsync(): Promise<Fruit> { return Promise.resolve(0); }
const asserted = 0 as Fruit;
let mutable = Fruit.Apple;
mutable++;
declare const mapping: {[key in Fruit]: string};
mapping[0];
interface HasFruit {fruit: Fruit}
class Basket implements HasFruit {fruit = 0;}

//// [input.ts]
enum Fruit { Apple, Banana }
enum Flags { Read = 1, Write = 2 }
const fruit: Fruit = 0;
const safe: Fruit = Fruit.Apple;
const union: Fruit | number = 0;
const nested: {fruit: Fruit} = {fruit: 0};
const generic: Set<Fruit> = new Set<number>();
const flags: Flags = Flags.Read | Flags.Write;
const invalidFlags: Flags = Flags.Read | 4;
declare function take(value: Fruit): void;
declare function rest(...values: [Fruit, Fruit]): void;
take(0);
rest(...[Fruit.Apple, 1] as const);
function get(): Fruit { return 0; }
async function getAsync(): Promise<Fruit> { return Promise.resolve(0); }
const asserted = 0 as Fruit;
let mutable = Fruit.Apple;
mutable++;
declare const mapping: {[key in Fruit]: string};
mapping[0];
interface HasFruit {fruit: Fruit}
class Basket implements HasFruit {fruit = 0;}
