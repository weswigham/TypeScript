package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"testing"
	"time"

	"gotest.tools/v3/assert"
)

func TestGenerationChildProcess(t *testing.T) {
	t.Parallel()
	for _, mode := range []string{"success", "failure"} {
		t.Run(mode, func(t *testing.T) {
			t.Parallel()
			var stderr bytes.Buffer
			process, err := spawnProcess([]string{os.Args[0], "-test.run=^TestGenerationProcessHelper$", "--", mode}, t.TempDir(), &stderr)
			assert.NilError(t, err)
			defer process.Close()
			child := process.(*childProcess)
			assert.NilError(t, child.CloseInput())
			output, err := io.ReadAll(process)
			assert.NilError(t, err)
			err = child.Wait()
			if mode == "success" {
				assert.NilError(t, err)
				assert.Equal(t, string(output), "generated\n")
			} else {
				exitError, ok := errors.AsType[*exec.ExitError](err)
				assert.Assert(t, ok)
				assert.Equal(t, exitError.ExitCode(), 7)
				assert.Equal(t, stderr.String(), "generation failed\n")
			}
		})
	}
}

type cancellingCommandWriter struct {
	cancel context.CancelFunc
}

func (writer *cancellingCommandWriter) Write(data []byte) (int, error) {
	writer.cancel()
	return len(data), nil
}

func TestGenerationRunCancellation(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	sys := &osSys{}
	err := sys.Run(ctx, []string{os.Args[0], "-test.run=^TestGenerationProcessHelper$", "--", "wait"}, t.TempDir(), &cancellingCommandWriter{cancel: cancel}, io.Discard)
	assert.Assert(t, errors.Is(err, context.Canceled))
}

func TestGenerationProcessHelper(t *testing.T) {
	t.Parallel()
	if len(os.Args) < 3 || os.Args[len(os.Args)-2] != "--" {
		return
	}
	if os.Args[len(os.Args)-1] == "wait" {
		fmt.Println("started")
		timer := time.NewTimer(time.Hour)
		defer timer.Stop()
		<-timer.C
		os.Exit(0)
	}
	if os.Args[len(os.Args)-1] == "failure" {
		fmt.Fprintln(os.Stderr, "generation failed")
		os.Exit(7)
	}
	fmt.Println("generated")
	os.Exit(0)
}
