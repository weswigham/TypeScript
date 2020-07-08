type ForwardRefRenderFunction<T, P> = (props: P) => T;
type ForwardRefExoticComponent<P> = { defaultProps?: Partial<P> };

declare function forwardRef<T, P = {}>(render: ForwardRefRenderFunction<T, P>): ForwardRefExoticComponent<PropsWithoutRef<P>>;

type PropsWithoutRef<P> =
    'ref' extends keyof P
        ? Pick<P, Exclude<keyof P, 'ref'>>
        : P;

function renderAsComponent<
    TOwnProps,
    TDefaultElement
>(
    factory: (x: TOwnProps & {renderAs?: unknown}) => TDefaultElement,
    defaultElement: TDefaultElement,
) {
    const forward = forwardRef(factory);
    forward.defaultProps = { renderAs: defaultElement };
}