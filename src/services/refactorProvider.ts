/* @internal */
namespace ts.refactor {
    // A map with the refactor code as key, the refactor itself as value
    // e.g.  nonSuggestableRefactors[refactorCode] -> the refactor you want
    const refactors: ts.Map<ts.Refactor> = ts.createMap<ts.Refactor>();
    /** @param name An unique code associated with each refactor. Does not have to be human-readable. */
    export function registerRefactor(name: string, refactor: ts.Refactor) {
        refactors.set(name, refactor);
    }
    export function getApplicableRefactors(context: ts.RefactorContext): ts.ApplicableRefactorInfo[] {
        return ts.arrayFrom(ts.flatMapIterator(refactors.values(), refactor => context.cancellationToken && context.cancellationToken.isCancellationRequested() ? undefined : refactor.getAvailableActions(context)));
    }
    export function getEditsForRefactor(context: ts.RefactorContext, refactorName: string, actionName: string): ts.RefactorEditInfo | undefined {
        const refactor = refactors.get(refactorName);
        return refactor && refactor.getEditsForAction(context, actionName);
    }
}
