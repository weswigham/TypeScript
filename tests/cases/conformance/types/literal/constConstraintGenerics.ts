// @declaration: true;
export declare function freeze<const T>(x: T): T;

export const x = freeze({
    x: 12,
    y: "ok",
    z: {
        a: 0,
        b: "yes"
    }
});

export interface Point {
    x: number;
    y: number;
}


export declare function freezePoint<const T extends Point>(x: T): T;

export const y = freezePoint({
    x: 12,
    y: 42,
    props: {
        a: 0,
        b: "yes"
    },
    data: "ok"
});
