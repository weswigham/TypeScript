package api

import (
	"errors"
	"fmt"

	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	"github.com/microsoft/TypeScript/tsc/internal/project"
)

func (s *Session) bindProgramSnapshot(program *compiler.Program, id project.SyntheticProjectID, projectHandle project.Handle) (*CreateSnapshotResponse, error) {
	snapshot, proj, err := s.snapshotHost.NewProgramSnapshot(program, id, projectHandle)
	if err != nil {
		return nil, err
	}
	handle := s.registerSnapshot(snapshot, snapshotOpenState{}, nil)
	response := &CreateSnapshotResponse{
		Snapshot:  handle,
		Projects:  []*ProjectResponse{NewProjectResponse(proj)},
		Operation: &SnapshotOperationResponse{},
	}
	s.snapshotsMu.Lock()
	s.snapshots[handle].readOnly = true
	s.snapshotsMu.Unlock()
	return response, nil
}

func (s *Session) bindProjectSnapshot(binding *lint.ProjectBinding, program *compiler.Program) (*CreateSnapshotResponse, error) {
	if binding == nil || binding.Snapshot == nil {
		return nil, errors.New("lint work requires a project snapshot binding")
	}
	snapshot, ok := binding.Snapshot.(*project.Snapshot)
	if !ok {
		return nil, fmt.Errorf("unsupported lint project snapshot %T", binding.Snapshot)
	}
	proj := snapshot.ProjectCollection.GetProjectByHandle(project.Handle(binding.Handle))
	if proj == nil || proj.Program != program || proj.CommandLine == nil {
		return nil, fmt.Errorf("lint project handle %d does not identify the supplied program in snapshot %d", binding.Handle, binding.Snapshot.ID())
	}
	snapshot.Retain()
	handle := s.registerSnapshot(snapshot, snapshotOpenState{}, nil)
	projects := make([]*ProjectResponse, 0, len(snapshot.ProjectCollection.Projects()))
	for _, current := range snapshot.ProjectCollection.Projects() {
		if current.CommandLine != nil {
			projects = append(projects, NewProjectResponse(current))
		}
	}
	return &CreateSnapshotResponse{
		Snapshot:  handle,
		Projects:  projects,
		Operation: &SnapshotOperationResponse{},
	}, nil
}
