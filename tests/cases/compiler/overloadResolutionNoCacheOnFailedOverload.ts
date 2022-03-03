interface TypegenDisabled {
    "@@xstate/typegen": false;
}
interface TypegenEnabled {
    "@@xstate/typegen": true;
}
interface EventObject {
    type: string;
}
interface ActionObject<TEvent extends EventObject> {
    _TE: TEvent;
}

interface StateMachine<
    TEvent extends EventObject,
    TTypesMeta = TypegenDisabled
    > {
    _TE: TEvent;
    _TRTM: TTypesMeta;
}

interface MachineOptions<TEvent extends EventObject> {
    action?: ActionObject<TEvent>;
}

type MaybeTypegenMachineOptions<
    TEvent extends EventObject,
    TTypesMeta = TypegenDisabled
    > = TTypesMeta extends TypegenEnabled
    ? {
        action?: ActionObject<{ type: "WITH_TYPEGEN" }>;
    }
    : MachineOptions<TEvent>;

declare function assign<TEvent extends EventObject>(
    assignment: (ev: TEvent) => void
): ActionObject<TEvent>;

// atm I have a single signature and it **matches**
// however, if I uncomment this additional overload then **no signature** matches
// if later on I reorder the signatures then the first one (the one that is currently not commented out) matches

// what happens here is that some inferences made when attempting to match the first overload are cached 
// and "carried over" to matching the second overload - which makes the whole thing fail

declare function useMachine<
    TEvent extends EventObject,
    TTypesMeta extends TypegenEnabled
>(
    getMachine: StateMachine<TEvent, TTypesMeta>,
    options: MaybeTypegenMachineOptions<TEvent, TTypesMeta>
): { first: true };
declare function useMachine<TEvent extends EventObject>(
    getMachine: StateMachine<TEvent>,
    options?: MachineOptions<TEvent>
): { second: true };

const machine = {} as StateMachine<{ type: "WITHOUT_TYPEGEN" }>;

const ret = useMachine(machine, { // should use 2nd overload without error
    action: assign((_ev) => {
        ((_type: "WITHOUT_TYPEGEN") => null)(_ev.type);
    }),
});