package api

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ipc"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"gotest.tools/v3/assert"
)

func TestLintHostWarmupBoundsAndReusesDistinctWorkers(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 2)
	assert.NilError(t, host.Warmup(t.Context(), options, 0))
	assert.Assert(t, host.control == nil)
	assert.NilError(t, host.Warmup(t.Context(), options, 1))
	assert.Equal(t, host.active, 1)
	assert.NilError(t, host.Warmup(t.Context(), options, 20))
	assert.Equal(t, host.active, 2)
	assert.Equal(t, host.nextID, 2)
	assert.Equal(t, len(host.idle), 2)
	for _, worker := range host.workers {
		assert.Assert(t, len(worker.lastInspectionOptions) != 0)
		assert.DeepEqual(t, worker.lastInspectionRules, []string{"lifecycle/probe"})
	}
	first, err := host.acquire(t.Context())
	assert.NilError(t, err)
	second, err := host.acquire(t.Context())
	assert.NilError(t, err)
	assert.Assert(t, second != first)
	firstProtocol := &capturingLintProtocol{Protocol: NewMessagePackProtocol(first.stream)}
	secondProtocol := &capturingLintProtocol{Protocol: NewMessagePackProtocol(second.stream)}
	first.conn = ipc.NewSyncConn(first.stream, firstProtocol, first.session)
	second.conn = ipc.NewSyncConn(second.stream, secondProtocol, second.session)
	host.release(first)
	host.release(second)
	assert.NilError(t, host.Warmup(t.Context(), options, 2))
	assert.Equal(t, len(firstProtocol.requests), 0)
	assert.Equal(t, len(secondProtocol.requests), 0)

	warmOptions := options
	warmOptions.Plugins = map[string]string{"alternate": options.Plugins["lifecycle"]}
	assert.NilError(t, host.Warmup(t.Context(), warmOptions, 2))
	assert.Equal(t, len(firstProtocol.requests), 1)
	assert.Equal(t, len(secondProtocol.requests), 1)
	assert.NilError(t, host.Warmup(t.Context(), warmOptions, 2))
	assert.Equal(t, len(firstProtocol.requests), 1)
	assert.Equal(t, len(secondProtocol.requests), 1)
	names, err := host.InspectPlugins(t.Context(), warmOptions)
	assert.NilError(t, err)
	names[0] = "changed by caller"
	names, err = host.InspectPlugins(t.Context(), warmOptions)
	assert.NilError(t, err)
	assert.DeepEqual(t, names, []string{"alternate/probe"})
	assert.Assert(t, len(host.WatchedFiles()) != 0)
	_, err = host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	assert.Equal(t, host.nextID, 2)
}

func TestLintHostConcurrentWarmupAndWork(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 2)
	ctx, cancel := context.WithTimeout(t.Context(), 30*time.Second)
	defer cancel()
	var wg sync.WaitGroup
	for range 3 {
		wg.Go(func() { assert.NilError(t, host.Warmup(ctx, options, 2)) })
	}
	wg.Go(func() {
		result, err := host.LintBatch(ctx, program, options, lifecycleRules("normal"), files[:1])
		assert.NilError(t, err)
		assert.Equal(t, len(result.Files[0].Messages), 1)
	})
	wg.Wait()
	assert.Equal(t, host.active, 2)
	assert.Equal(t, host.nextID, 2)
}

func TestLintHostWarmupCancellationWhileQueued(t *testing.T) {
	t.Parallel()
	host := &lintHost{options: linthost.Options{Workers: 2}, warmup: make(chan struct{}, 1)}
	host.warmup <- struct{}{}
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	timer := time.AfterFunc(20*time.Millisecond, cancel)
	defer timer.Stop()
	err := host.Warmup(ctx, linthost.PluginOptions{}, 2)
	assert.Assert(t, errors.Is(err, context.Canceled))
	assert.Assert(t, host.control == nil)
	<-host.warmup
}

func TestLintHostWarmupErrorsPreserveHealthyPool(t *testing.T) {
	t.Parallel()
	host, options, _, _ := newLifecycleHost(t, 2)
	missing := options
	missing.Plugins = map[string]string{"missing": "./missing-lifecycle-plugin.mjs"}
	assert.ErrorContains(t, host.Warmup(t.Context(), missing, 2), "warming lint worker")
	assert.Equal(t, host.active, 2)
	assert.Equal(t, host.nextID, 2)
	for _, worker := range host.workers {
		assert.Assert(t, !worker.retired)
	}
	assert.NilError(t, host.Warmup(t.Context(), options, 2))
	assert.Equal(t, host.nextID, 2)
}

func TestLintHostShimWorkerIDsMayArriveOutOfOrder(t *testing.T) {
	t.Parallel()
	host, _, _, _ := newLifecycleHost(t, 2)
	host.mu.Lock()
	err := host.connect(t.Context())
	control := host.control
	host.mu.Unlock()
	assert.NilError(t, err)
	create := func(id int) *lintWorker {
		t.Helper()
		worker, createErr := host.createWorker(t.Context(), control, id)
		assert.NilError(t, createErr)
		host.mu.Lock()
		host.workers[id] = worker
		host.active++
		host.nextID = max(host.nextID, id+1)
		host.mu.Unlock()
		return worker
	}
	high := create(7)
	create(2)
	_, err = control.conn.Call(t.Context(), "createWorker", map[string]any{"workerId": 2, "pipe": "unused"})
	assert.ErrorContains(t, err, "is not new")
	// Unblock the synchronous pipe before terminating its worker.
	assert.NilError(t, high.close())
	_, err = control.conn.Call(t.Context(), "destroyWorker", map[string]int{"workerId": high.id})
	assert.NilError(t, err)
	host.removeWorker(control, high.id)
	_, err = control.conn.Call(t.Context(), "destroyWorker", map[string]int{"workerId": high.id})
	assert.NilError(t, err)
	_, err = control.conn.Call(t.Context(), "createWorker", map[string]any{"workerId": high.id, "pipe": "unused"})
	assert.ErrorContains(t, err, "is not new")
	_, err = control.conn.Call(t.Context(), "destroyWorker", map[string]int{"workerId": 3})
	assert.ErrorContains(t, err, "Unknown native worker 3")
	create(0)
	_, err = control.conn.Call(t.Context(), "createWorker", map[string]any{"workerId": 8, "pipe": 0})
	assert.ErrorContains(t, err, "API pipe")
	_, err = control.conn.Call(t.Context(), "createWorker", map[string]any{"workerId": 8, "pipe": "unused"})
	assert.ErrorContains(t, err, "is not new")
	_, err = control.conn.Call(t.Context(), "destroyWorker", map[string]int{"workerId": 8})
	assert.NilError(t, err)
	assert.Equal(t, host.active, 2)
}
