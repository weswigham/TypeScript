// @declaration: true
// @filename: module1.ts
export type Constructor<T> = new (...args: any[]) => T;
export function IdentityMixin<T extends Constructor<{}>>(Base : T) {
    return class extends Base {
        identity(): this {
            return this;
        }
    };
}

export class Foo {}
export class IdFoo extends IdentityMixin(Foo) {}

export const id = new IdFoo();
export const same = id.identity();

// @filename: index.ts
import { IdentityMixin, same as other } from './module1';

export class Foo {}
export class IdFoo extends IdentityMixin(Foo) {}

export const id = new IdFoo();
export let same = id.identity();
same = other;