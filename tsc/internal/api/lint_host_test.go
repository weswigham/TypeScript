package api

import (
	"bytes"
	"context"
	"crypto/rand"
	"errors"
	"io"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ipc"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"gotest.tools/v3/assert"
)

type lintTestStream struct {
	closes   atomic.Int32
	closeErr error
}

func (*lintTestStream) Read([]byte) (int, error)       { return 0, io.EOF }
func (*lintTestStream) Write(data []byte) (int, error) { return len(data), nil }
func (s *lintTestStream) Close() error {
	s.closes.Add(1)
	return s.closeErr
}

func TestLintHostClosesBusyAndIdleWorkers(t *testing.T) {
	t.Parallel()
	host := &lintHost{workers: make(map[int]*lintWorker), idle: make(chan *lintWorker, 2)}
	streams := make([]*lintTestStream, 2)
	for id := range 2 {
		transport, err := ipc.NewPrivatePipeTransport("ts-lint-test-" + rand.Text())
		assert.NilError(t, err)
		stream := &lintTestStream{}
		streams[id] = stream
		worker := &lintWorker{id: id, transport: transport, stream: stream, session: newSession(nil, nil, nil)}
		host.workers[id] = worker
		defer func() { assert.NilError(t, worker.close()) }()
		if id == 0 {
			host.idle <- worker
		}
	}
	assert.NilError(t, host.Close())
	assert.NilError(t, host.Close())
	for _, stream := range streams {
		assert.Equal(t, stream.closes.Load(), int32(1))
	}
	assert.NilError(t, (<-host.idle).close())
	assert.Equal(t, streams[0].closes.Load(), int32(1))
}

func TestLintWorkerClosePreservesErrors(t *testing.T) {
	t.Parallel()
	transport, err := ipc.NewPrivatePipeTransport("ts-lint-test-" + rand.Text())
	assert.NilError(t, err)
	expected := errors.New("worker pipe close failed")
	stream := &lintTestStream{closeErr: expected}
	worker := &lintWorker{transport: transport, stream: stream, session: newSession(nil, nil, nil)}
	defer func() { assert.Assert(t, errors.Is(worker.close(), expected)) }()
	assert.NilError(t, transport.Close())
	assert.Assert(t, errors.Is(worker.close(), expected))
	assert.Equal(t, stream.closes.Load(), int32(1))
}

type unresponsiveLintControl struct{ ipc.Conn }

func (unresponsiveLintControl) Call(ctx context.Context, _ string, _ any) (json.Value, error) {
	<-ctx.Done()
	return nil, ctx.Err()
}

func TestLintHostBoundsUnresponsiveSupervisorCleanup(t *testing.T) {
	t.Parallel()
	transport, err := ipc.NewPrivatePipeTransport("ts-lint-test-" + rand.Text())
	assert.NilError(t, err)
	var cancelled atomic.Bool
	controlStream := &lintTestStream{}
	control := &lintControl{
		conn: unresponsiveLintControl{}, stream: controlStream,
		cancel: func() { cancelled.Store(true) },
	}

	worker := &lintWorker{
		id: 0, control: control, stream: &lintTestStream{},
		transport: transport, session: newSession(nil, nil, nil),
	}
	defer func() { assert.NilError(t, worker.close()) }()
	host := &lintHost{control: control, active: 1, workers: map[int]*lintWorker{0: worker}, changed: make(chan struct{})}
	expected := errors.New("lint worker failed")
	start := time.Now()
	err = host.retireWorker(worker, expected)
	assert.Assert(t, errors.Is(err, expected))
	assert.Assert(t, errors.Is(err, context.DeadlineExceeded))
	assert.Assert(t, time.Since(start) < 3*time.Second)
	assert.Assert(t, cancelled.Load())
	assert.Equal(t, controlStream.closes.Load(), int32(1))
	assert.Assert(t, worker.retired)
	assert.Equal(t, host.active, 0)
}

func TestLintHostInvalidationReportsCleanupErrors(t *testing.T) {
	t.Parallel()
	transport, err := ipc.NewPrivatePipeTransport("ts-lint-test-" + rand.Text())
	assert.NilError(t, err)
	expected := errors.New("worker pipe close failed")
	worker := &lintWorker{
		stream:    &lintTestStream{closeErr: expected},
		transport: transport, session: newSession(nil, nil, nil),
	}
	defer func() { assert.Assert(t, errors.Is(worker.close(), expected)) }()
	var output bytes.Buffer
	host := &lintHost{
		options: linthost.Options{Workers: 1, Stderr: &output},
		workers: map[int]*lintWorker{0: worker}, changed: make(chan struct{}),
	}
	host.Invalidate()
	assert.Assert(t, strings.Contains(output.String(), "closing invalidated lint worker: worker pipe close failed"))
}
