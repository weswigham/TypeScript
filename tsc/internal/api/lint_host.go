package api

import (
	"bytes"
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"net"
	"runtime"
	"slices"
	"strings"
	"sync"
	"time"
	"weak"

	"github.com/microsoft/TypeScript/tsc/internal/api/encoder"
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/ipc"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/project"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/osvfs"
)

type lintHost struct {
	spawner            linthost.Spawner
	options            linthost.Options
	mu                 sync.Mutex
	control            *lintControl
	idle               chan *lintWorker
	active             int
	nextID             int
	changed            chan struct{}
	closed             bool
	workers            map[int]*lintWorker
	watched            map[string]struct{}
	watchedDirectories map[string]struct{}
	warmup             chan struct{}
}

type lintControl struct {
	conn   ipc.Conn
	stream io.ReadWriteCloser
	cancel context.CancelFunc
	done   chan struct{}
}

type lintWorker struct {
	id                    int
	control               *lintControl
	transport             *ipc.PipeTransport
	stream                io.ReadWriteCloser
	conn                  *ipc.SyncConn
	session               *Session
	retired               bool
	closeOnce             sync.Once
	closeErr              error
	cancel                context.CancelFunc
	workID                int32
	lastConfiguration     json.Value
	lastParsedCommandLine json.Value
	lastInspectionOptions json.Value
	lastInspectionRules   []string
	programRef            weak.Pointer[compiler.Program]
	programID             project.SyntheticProjectID
	programHandle         project.Handle
}

type lintWorkConfiguration struct {
	linthost.PluginOptions
	Rules             map[string]any `json:"rules"`
	ResolvedLibraries []string       `json:"resolvedLibraries"`
}

type lintProjectResponse struct {
	*ProjectResponse
	ParsedCommandLine json.Value `json:"parsedCommandLine"`
}

type lintSnapshotResponse struct {
	*CreateSnapshotResponse
	Projects []lintProjectResponse `json:"projects"`
}

func reuseLintConfiguration(current, previous json.Value) json.Value {
	if bytes.Equal(current, previous) {
		return json.Value(`"reuse"`)
	}
	return current
}

func (w *lintWorker) close() error {
	w.closeOnce.Do(func() {
		if w.cancel != nil {
			w.cancel()
		}
		err := w.stream.Close()
		if errors.Is(err, net.ErrClosed) {
			err = nil
		}
		transportErr := w.transport.Close()
		if errors.Is(transportErr, net.ErrClosed) {
			transportErr = nil
		}
		w.closeErr = errors.Join(err, transportErr)
		w.session.Close()
	})
	return w.closeErr
}

type lintControlHandler struct{}

func (lintControlHandler) HandleRequest(context.Context, string, json.Value) (any, error) {
	return nil, errors.New("lint control accepts native work dispatch only")
}

func (lintControlHandler) HandleNotification(context.Context, string, json.Value) error {
	return errors.New("unexpected lint control notification")
}

func NewLintHost(ctx context.Context, spawner linthost.Spawner, options linthost.Options) lint.Host {
	if spawner == nil {
		return nil
	}
	if options.Command == nil && options.ResolveCommand == nil {
		options.Command = linthost.CommandFromContext(ctx)
		if options.Command == nil {
			options.ResolveCommand = linthost.ResolveCommand
		}
	}
	if options.Workers <= 0 {
		options.Workers = runtime.GOMAXPROCS(0)
	}
	host := &lintHost{spawner: spawner, options: options, idle: make(chan *lintWorker, options.Workers), changed: make(chan struct{}), workers: make(map[int]*lintWorker), warmup: make(chan struct{}, 1)}
	context.AfterFunc(ctx, func() {
		if err := host.Close(); err != nil && options.Stderr != nil {
			fmt.Fprintln(options.Stderr, "closing lint host:", err)
		}
	})
	return host
}

func (h *lintHost) connect(ctx context.Context) error {
	if h.closed {
		return errors.New("lint host is closed")
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	if h.control != nil {
		select {
		case <-h.control.done:
			for _, worker := range h.workers {
				if err := worker.close(); err != nil && h.options.Stderr != nil {
					fmt.Fprintln(h.options.Stderr, "closing failed lint worker:", err)
				}
			}
			clear(h.workers)
			h.control = nil
			h.idle = make(chan *lintWorker, h.options.Workers)
			h.active, h.nextID = 0, 0
		default:
			return nil
		}
	}
	command := h.options.Command
	if h.options.ResolveCommand != nil {
		var err error
		command, err = h.options.ResolveCommand()
		if err != nil {
			return err
		}
	}
	if len(command) == 0 {
		return errors.New("no lint shim command is configured")
	}
	stream, err := h.spawner.Spawn(command, "", h.options.Stderr)
	if err != nil {
		return fmt.Errorf("starting lint host: %w", err)
	}
	root, cancel := context.WithCancel(context.Background())
	conn := ipc.NewAsyncConn(stream, lintControlHandler{})
	control := &lintControl{conn: conn, stream: stream, cancel: cancel, done: make(chan struct{})}
	stop := context.AfterFunc(root, func() { _ = stream.Close() })
	go func() {
		defer close(control.done)
		defer stop()
		defer cancel()
		defer stream.Close()
		if runErr := conn.Run(root); runErr != nil && root.Err() == nil && h.options.Stderr != nil {
			fmt.Fprintln(h.options.Stderr, "lint control:", runErr)
		}
	}()
	result, err := conn.Call(ctx, "initialize", map[string]any{"protocolVersion": 1, "astProtocolVersion": encoder.ProtocolVersion})
	if err == nil {
		var initialized struct {
			ProtocolVersion    int `json:"protocolVersion"`
			ASTProtocolVersion int `json:"astProtocolVersion"`
		}
		err = json.Unmarshal(result, &initialized)
		if err == nil && (initialized.ProtocolVersion != 1 || initialized.ASTProtocolVersion != int(encoder.ProtocolVersion)) {
			err = errors.New("lint host protocol mismatch")
		}
	}
	if err != nil {
		cancel()
		_ = stream.Close()
		return err
	}
	h.control = control
	return nil
}

func (h *lintHost) acquire(ctx context.Context) (*lintWorker, error) {
	for {
		h.mu.Lock()
		if err := h.connect(ctx); err != nil {
			h.mu.Unlock()
			return nil, err
		}
		control, idle, changed := h.control, h.idle, h.changed
		id := -1
		select {
		case worker := <-h.idle:
			h.mu.Unlock()
			return worker, nil
		default:
			if h.active < h.options.Workers {
				id = h.nextID
				h.nextID++
				h.active++
			}
		}
		h.mu.Unlock()
		if id >= 0 {
			worker, err := h.createWorker(ctx, control, id)
			if err != nil {
				cleanupCtx, cancel := context.WithTimeout(context.Background(), time.Second)
				_, destroyErr := control.conn.Call(cleanupCtx, "destroyWorker", map[string]int{"workerId": id})
				cancel()
				if destroyErr != nil {
					control.cancel()
					_ = control.stream.Close()
				}
				h.removeWorker(control, id)
				return nil, err
			}
			h.mu.Lock()
			if h.closed || h.control != control {
				h.mu.Unlock()
				return nil, errors.Join(errors.New("lint host closed while creating a worker"), worker.close())
			}
			h.workers[id] = worker
			h.mu.Unlock()
			return worker, nil
		}
		select {
		case worker := <-idle:
			return worker, nil
		case <-changed:
			continue
		case <-control.done:
			return nil, errors.New("lint host exited")
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}
}

func (h *lintHost) createWorker(ctx context.Context, control *lintControl, id int) (*lintWorker, error) {
	transport, err := ipc.NewPrivatePipeTransport("ts-lint-" + rand.Text())
	if err != nil {
		return nil, err
	}
	type accepted struct {
		stream io.ReadWriteCloser
		err    error
	}
	ready := make(chan accepted, 1)
	go func() { stream, acceptErr := transport.Accept(); ready <- accepted{stream, acceptErr} }()
	stop := context.AfterFunc(ctx, func() { _ = transport.Close() })
	defer stop()
	_, err = control.conn.Call(ctx, "createWorker", map[string]any{"workerId": id, "pipe": transport.Path()})
	if err != nil {
		_ = transport.Close()
	}
	connection := <-ready
	if err == nil {
		err = connection.err
	}
	if err == nil {
		err = ctx.Err()
	}
	if err != nil {
		if connection.stream != nil {
			_ = connection.stream.Close()
		}
		_ = transport.Close()
		return nil, err
	}
	if h.options.CurrentDirectory == "" {
		_ = connection.stream.Close()
		_ = transport.Close()
		return nil, errors.New("lint host requires its native current directory")
	}
	root, cancel := context.WithCancel(context.Background())
	session := NewStandaloneSession(&project.SessionInit{
		BackgroundCtx: root, FS: bundled.WrapFS(osvfs.FS()),
		Options: &project.SessionOptions{CurrentDirectory: h.options.CurrentDirectory, DefaultLibraryPath: bundled.LibPath(), PositionEncoding: lsproto.PositionEncodingKindUTF8},
	}, &SessionOptions{UseBinaryResponses: true})
	conn := ipc.NewSyncConn(connection.stream, NewMessagePackProtocol(connection.stream), session)
	session.SetConnection(conn)
	return &lintWorker{id: id, control: control, transport: transport, stream: connection.stream, conn: conn, session: session, cancel: cancel}, nil
}

func (h *lintHost) removeWorker(control *lintControl, id int) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.control == control {
		delete(h.workers, id)
		h.active--
		close(h.changed)
		h.changed = make(chan struct{})
	}
}

func (h *lintHost) release(worker *lintWorker) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.closed || worker.retired || worker.control != h.control {
		return
	}
	select {
	case h.idle <- worker:
		return
	default:
		panic("lint worker released twice")
	}
}

func (h *lintHost) execute(ctx context.Context, worker *lintWorker, request any, target any) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	worker.workID++
	var result json.Value
	var err error
	done := make(chan struct{})
	workCtx, cancelWork := context.WithCancel(context.WithoutCancel(ctx))
	defer cancelWork()
	go func() {
		// Drain the response even when the caller is cancelled so the next call
		// starts at a message boundary and nested API requests can finish.
		result, err = worker.conn.Call(workCtx, "lintWork", map[string]any{"workId": worker.workID, "request": request})
		close(done)
	}()
	select {
	case <-done:
		cancelWork()
	case <-ctx.Done():
		cancelCtx, cancel := context.WithTimeout(context.Background(), time.Second)
		_, _ = worker.control.conn.Call(cancelCtx, "cancelWorker", map[string]any{"workerId": worker.id, "workId": worker.workID})
		cancel()
		timer := time.NewTimer(time.Second)
		select {
		case <-done:
			timer.Stop()
		case <-timer.C:
			cancelWork()
			worker.cancel()
			_ = worker.stream.Close()
			<-done
			err = errors.Join(ctx.Err(), err)
		}
	}
	if err != nil {
		return h.retireWorker(worker, errors.Join(err, ctx.Err()))
	}
	var response struct {
		Result json.Value `json:"result"`
		Error  string     `json:"error"`
	}
	if err := json.Unmarshal(result, &response); err != nil {
		return h.retireWorker(worker, err)
	}
	if ctx.Err() != nil {
		return ctx.Err()
	}
	if response.Error != "" {
		return errors.New(response.Error)
	}
	if target != nil {
		if err := json.Unmarshal(response.Result, target); err != nil {
			return h.retireWorker(worker, err)
		}
	}
	return nil
}

func (h *lintHost) retireWorker(worker *lintWorker, err error) error {
	h.mu.Lock()
	worker.retired = true
	h.mu.Unlock()
	_ = worker.stream.Close()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	_, destroyErr := worker.control.conn.Call(ctx, "destroyWorker", map[string]int{"workerId": worker.id})
	if destroyErr != nil {
		// An unresponsive supervisor cannot be trusted to terminate its thread.
		worker.control.cancel()
		_ = worker.control.stream.Close()
	}
	closeErr := worker.close()
	h.removeWorker(worker.control, worker.id)
	return errors.Join(err, destroyErr, closeErr)
}

func (h *lintHost) watchPluginOptions(options linthost.PluginOptions) {
	h.watchPluginPackages(options)
	h.mu.Lock()
	if h.watched == nil {
		h.watched = make(map[string]struct{})
	}
	for namespace, specifier := range options.Plugins {
		if !tspath.IsRootedDiskPath(specifier) && !strings.HasPrefix(specifier, ".") {
			continue
		}
		origin := options.PluginResolveFrom[namespace]
		if origin == "" {
			origin = options.CurrentDirectory
		}
		if !tspath.IsRootedDiskPath(origin) {
			continue
		}
		path := tspath.RootedDirectoryPathFromAbsolute(origin).ResolveFile(specifier)
		h.watched[path.AsString()] = struct{}{}
		h.watched[path.Directory().ResolveFile("package.json").AsString()] = struct{}{}
	}
	h.mu.Unlock()
}

func (h *lintHost) InspectPlugins(ctx context.Context, options linthost.PluginOptions) ([]string, error) {
	h.watchPluginOptions(options)
	worker, err := h.acquire(ctx)
	if err != nil {
		return nil, err
	}
	defer h.release(worker)
	return h.inspectPlugins(ctx, worker, options)
}

func (h *lintHost) inspectPlugins(ctx context.Context, worker *lintWorker, options linthost.PluginOptions) ([]string, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	key, err := json.Marshal(options, json.Deterministic(true))
	if err != nil {
		return nil, err
	}
	if bytes.Equal(key, worker.lastInspectionOptions) {
		return slices.Clone(worker.lastInspectionRules), nil
	}
	var result struct {
		RuleNames    []string `json:"ruleNames"`
		WatchedFiles []string `json:"watchedFiles"`
	}
	err = h.execute(ctx, worker, struct {
		Kind string `json:"kind"`
		linthost.PluginOptions
	}{"inspectPlugins", options}, &result)
	if err == nil {
		h.mu.Lock()
		if h.watched == nil {
			h.watched = make(map[string]struct{})
		}
		for _, path := range result.WatchedFiles {
			h.watched[path] = struct{}{}
		}
		h.mu.Unlock()
		worker.lastInspectionOptions = key
		worker.lastInspectionRules = slices.Clone(result.RuleNames)
	}
	return result.RuleNames, err
}

func (h *lintHost) Warmup(ctx context.Context, options linthost.PluginOptions, workerCount int) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	workerCount = min(workerCount, h.options.Workers)
	if workerCount <= 0 {
		return nil
	}
	// Two warmups must not each hold a partial pool while waiting for the
	// other's reservations. Ordinary work continues using the existing pool.
	select {
	case h.warmup <- struct{}{}:
		defer func() { <-h.warmup }()
	case <-ctx.Done():
		return ctx.Err()
	}
	h.watchPluginOptions(options)
	workers := make([]*lintWorker, workerCount)
	errs := make([]error, workerCount)
	var wg sync.WaitGroup
	for index := range workerCount {
		wg.Go(func() {
			worker, err := h.acquire(ctx)
			if err != nil {
				errs[index] = fmt.Errorf("acquiring lint warmup worker: %w", err)
				return
			}
			workers[index] = worker
			if _, err := h.inspectPlugins(ctx, worker, options); err != nil {
				errs[index] = fmt.Errorf("warming lint worker %d: %w", worker.id, err)
			}
		})
	}
	wg.Wait()
	// Hold all acquisitions until the batch finishes so every inspection ran
	// on a distinct worker, including when imports finish at different times.
	for _, worker := range workers {
		if worker != nil {
			h.release(worker)
		}
	}
	return errors.Join(errors.Join(errs...), ctx.Err())
}

func (h *lintHost) LintBatch(ctx context.Context, program *compiler.Program, options linthost.PluginOptions, rules map[string]any, files []*ast.SourceFile) (*linthost.BatchResult, error) {
	return h.LintBatchWithProject(ctx, program, options, rules, files, nil)
}

func (h *lintHost) LintBatchWithProject(ctx context.Context, program *compiler.Program, options linthost.PluginOptions, rules map[string]any, files []*ast.SourceFile, projectBinding *lint.ProjectBinding) (*linthost.BatchResult, error) {
	worker, err := h.acquire(ctx)
	if err != nil {
		return nil, err
	}
	defer h.release(worker)
	var binding *CreateSnapshotResponse
	if projectBinding == nil {
		if worker.programRef.Value() != program {
			worker.programRef = weak.Make(program)
			worker.programID = ""
			worker.programHandle = 0
		}
		binding, err = worker.session.bindProgramSnapshot(program, worker.programID, worker.programHandle)
		if err == nil {
			worker.programID, _ = binding.Projects[0].Id.Synthetic()
			worker.programHandle = binding.Projects[0].Handle
		}
	} else {
		binding, err = worker.session.bindProjectSnapshot(projectBinding, program)
	}
	if err != nil {
		return nil, err
	}
	defer func() { _ = worker.session.releaseSnapshot(binding.Snapshot) }()
	var libraries []string
	for _, file := range program.GetSourceFiles() {
		if program.IsSourceFileDefaultLibrary(file.PathKey()) {
			libraries = append(libraries, file.FileName().AsString())
		}
	}
	configuration, err := json.Marshal(lintWorkConfiguration{options, rules, libraries}, json.Deterministic(true))
	if err != nil {
		return nil, err
	}
	parsedCommandLine, err := json.Marshal(binding.Projects[0].ParsedCommandLine, json.Deterministic(true))
	if err != nil {
		return nil, err
	}
	// Only acknowledged, valid batches establish reusable state. Cancellation
	// may arrive before or after decoding, so resend both values after errors.
	previousConfiguration, previousParsedCommandLine := worker.lastConfiguration, worker.lastParsedCommandLine
	worker.lastConfiguration, worker.lastParsedCommandLine = nil, nil
	snapshot := lintSnapshotResponse{
		CreateSnapshotResponse: binding,
		Projects: []lintProjectResponse{{
			ProjectResponse:   binding.Projects[0],
			ParsedCommandLine: reuseLintConfiguration(parsedCommandLine, previousParsedCommandLine),
		}},
	}
	names := make([]string, len(files))
	type fileRequest struct {
		FileName string `json:"fileName"`
	}
	descriptors := make([]fileRequest, len(files))
	for index, file := range files {
		names[index] = file.FileName().AsString()
		descriptors[index].FileName = names[index]
	}
	var result linthost.BatchResult
	err = h.execute(ctx, worker, struct {
		Kind          string               `json:"kind"`
		Configuration json.Value           `json:"configuration"`
		Files         []fileRequest        `json:"files"`
		Snapshot      lintSnapshotResponse `json:"snapshot"`
	}{"lint", reuseLintConfiguration(configuration, previousConfiguration), descriptors, snapshot}, &result)
	if err != nil {
		return nil, err
	}
	if len(result.Files) != len(files) {
		return nil, h.retireWorker(worker, errors.New("lint worker returned the wrong number of files"))
	}
	for index, file := range result.Files {
		if file.FileName != names[index] {
			return nil, h.retireWorker(worker, errors.New("lint worker returned results for a different file"))
		}
		worker.lastConfiguration, worker.lastParsedCommandLine = configuration, parsedCommandLine
	}
	return &result, nil
}

func (h *lintHost) Workers() int { return h.options.Workers }

func (h *lintHost) WatchedFiles() []string {
	h.mu.Lock()
	defer h.mu.Unlock()
	paths := make([]string, 0, len(h.watched))
	for path := range h.watched {
		paths = append(paths, path)
	}
	slices.Sort(paths)
	return paths
}

func (h *lintHost) Invalidate() {
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return
	}
	control, workers := h.control, h.workers
	h.control = nil
	h.workers = make(map[int]*lintWorker)
	h.idle = make(chan *lintWorker, h.options.Workers)
	h.active, h.nextID = 0, 0
	close(h.changed)
	h.changed = make(chan struct{})
	h.mu.Unlock()
	if control != nil {
		control.cancel()
		_ = control.stream.Close()
	}
	for _, worker := range workers {
		if err := worker.close(); err != nil && h.options.Stderr != nil {
			fmt.Fprintln(h.options.Stderr, "closing invalidated lint worker:", err)
		}
	}
}

func (h *lintHost) Close() error {
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return nil
	}
	h.closed = true
	control := h.control
	workers := h.workers
	h.workers = nil
	h.mu.Unlock()
	if control != nil {
		control.cancel()
		_ = control.stream.Close()
	}
	var errs []error
	for _, worker := range workers {
		errs = append(errs, worker.close())
	}
	return errors.Join(errs...)
}
