package interfaces

import (
	"context"

	"github.com/reearth/reearth/server/internal/usecase"
	"github.com/reearth/reearth/server/pkg/id"
	"github.com/reearth/reearth/server/pkg/storytelling"
)

type CreateStoryInput struct {
	Scene id.SceneID
	Title string
	Index *int
}

type UpdateStoryInput struct {
	StoryID id.StorytellingID
	Title   *string
	Index   *int
}

type MoveStoryInput struct {
	StoryID id.StorytellingID
	Index   int
}

type CreatePageParam struct {
	StoryID     id.StorytellingID
	Title       string
	Swipe       bool
	Layers      []id.LayerID
	SwipeLayers []id.LayerID
	Index       *int
}

type UpdatePageParam struct {
	StoryID     id.StorytellingID
	PageID      id.PageID
	Title       string
	Swipe       bool
	Layers      []id.LayerID
	SwipeLayers []id.LayerID
	Index       *int
}

type MovePageParam struct {
	StoryID id.StorytellingID
	PageID  id.PageID
	Index   int
}

type CreateBlockParam struct {
	StoryID     id.StorytellingID
	PageID      id.PageID
	PluginID    id.PluginID
	ExtensionID id.PluginExtensionID
	Index       *int
}

type MoveBlockParam struct {
	StoryID id.StorytellingID
	PageID  id.PageID
	BlockID id.BlockID
	Index   *int
}

type RemoveBlockParam struct {
	StoryID id.StorytellingID
	PageID  id.PageID
	BlockID id.BlockID
}

type Story interface {
	Fetch(context.Context, []id.StorytellingID, *usecase.Operator) (storytelling.List, error)
	Create(context.Context, CreateStoryInput, *usecase.Operator) (storytelling.Story, error)
	Update(context.Context, UpdateStoryInput, *usecase.Operator) (storytelling.Story, error)
	Remove(context.Context, id.StorytellingID, *usecase.Operator) (id.StorytellingID, error)
	Move(context.Context, MoveStoryInput, *usecase.Operator) (id.StorytellingID, int, error)

	CreatePage(context.Context, CreatePageParam, *usecase.Operator) (storytelling.Story, error)
	UpdatePage(context.Context, UpdatePageParam, *usecase.Operator) (storytelling.Story, error)
	RemovePage(context.Context, id.StorytellingID, id.PageID, *usecase.Operator) (storytelling.Story, error)
	MovePage(context.Context, MovePageParam, *usecase.Operator) (storytelling.Story, error)

	CreateBlock(context.Context, CreateBlockParam, *usecase.Operator) (*id.BlockID, storytelling.Page, error)
	RemoveBlock(context.Context, RemoveBlockParam, *usecase.Operator) (id.BlockID, storytelling.Page, error)
	MoveBlock(context.Context, MoveBlockParam, *usecase.Operator) (id.BlockID, storytelling.Page, int, error)
}