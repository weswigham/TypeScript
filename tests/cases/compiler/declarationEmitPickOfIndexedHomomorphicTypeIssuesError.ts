// @declaration: true
// @strict: true
export type Omit<T, K extends keyof T> = Pick<T, 
    ({ [P in keyof T]: P } & { [P in K]: never } )[keyof T]>;

export interface IOmitTest {
	(): { notSupposedToHappen: Omit<IXProps, "unwantedProp"> }
}

export interface IXProps {
    optionalProp?: string
    unwantedProp: string
}

const Y: IOmitTest = null as any;
export const Z = Y();

export interface IMouseOver {
    wrong: Omit<IXProps, "unwantedProp">
}