/* @internal */
namespace ts.server {
    export class ThrottledOperations {
        private readonly pendingTimeouts: ts.Map<any> = ts.createMap<any>();
        private readonly logger?: ts.server.Logger | undefined;
        constructor(private readonly host: ts.server.ServerHost, logger: ts.server.Logger) {
            this.logger = logger.hasLevel(ts.server.LogLevel.verbose) ? logger : undefined;
        }
        /**
         * Wait `number` milliseconds and then invoke `cb`.  If, while waiting, schedule
         * is called again with the same `operationId`, cancel this operation in favor
         * of the new one.  (Note that the amount of time the canceled operation had been
         * waiting does not affect the amount of time that the new operation waits.)
         */
        public schedule(operationId: string, delay: number, cb: () => void) {
            const pendingTimeout = this.pendingTimeouts.get(operationId);
            if (pendingTimeout) {
                // another operation was already scheduled for this id - cancel it
                this.host.clearTimeout(pendingTimeout);
            }
            // schedule new operation, pass arguments
            this.pendingTimeouts.set(operationId, this.host.setTimeout(ThrottledOperations.run, delay, this, operationId, cb));
            if (this.logger) {
                this.logger.info(`Scheduled: ${operationId}${pendingTimeout ? ", Cancelled earlier one" : ""}`);
            }
        }
        private static run(self: ThrottledOperations, operationId: string, cb: () => void) {
            ts.perfLogger.logStartScheduledOperation(operationId);
            self.pendingTimeouts.delete(operationId);
            if (self.logger) {
                self.logger.info(`Running: ${operationId}`);
            }
            cb();
            ts.perfLogger.logStopScheduledOperation();
        }
    }
    export class GcTimer {
        private timerId: any;
        constructor(private readonly host: ts.server.ServerHost, private readonly delay: number, private readonly logger: ts.server.Logger) {
        }
        public scheduleCollect() {
            if (!this.host.gc || this.timerId !== undefined) {
                // no global.gc or collection was already scheduled - skip this request
                return;
            }
            this.timerId = this.host.setTimeout(GcTimer.run, this.delay, this);
        }
        private static run(self: GcTimer) {
            self.timerId = undefined;
            ts.perfLogger.logStartScheduledOperation("GC collect");
            const log = self.logger.hasLevel(ts.server.LogLevel.requestTime);
            const before = log && self.host.getMemoryUsage!(); // TODO: GH#18217
            self.host.gc!(); // TODO: GH#18217
            if (log) {
                const after = self.host.getMemoryUsage!(); // TODO: GH#18217
                self.logger.perftrc(`GC::before ${before}, after ${after}`);
            }
            ts.perfLogger.logStopScheduledOperation();
        }
    }
    export function getBaseConfigFileName(configFilePath: ts.server.NormalizedPath): "tsconfig.json" | "jsconfig.json" | undefined {
        const base = ts.getBaseFileName(configFilePath);
        return base === "tsconfig.json" || base === "jsconfig.json" ? base : undefined;
    }
    export function removeSorted<T>(array: ts.SortedArray<T>, remove: T, compare: ts.Comparer<T>): void {
        if (!array || array.length === 0) {
            return;
        }
        if (array[0] === remove) {
            array.splice(0, 1);
            return;
        }
        const removeIndex = ts.binarySearch(array, remove, ts.identity, compare);
        if (removeIndex >= 0) {
            array.splice(removeIndex, 1);
        }
    }
    const indentStr = "\n    ";
    export function indent(str: string): string {
        return indentStr + str.replace(/\n/g, indentStr);
    }
    /** Put stringified JSON on the next line, indented. */
    export function stringifyIndented(json: {}): string {
        return indentStr + JSON.stringify(json);
    }
}
