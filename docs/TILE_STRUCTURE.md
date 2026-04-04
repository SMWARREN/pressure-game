# Tile Structure Reference

## Required Fields for Tiles

Every tile in the Pressure game must have these fields to render correctly:

### Required Properties

```json
{
  "id": "unique-identifier",
  "type": "tile-type",
  "x": 0,
  "y": 0,
  "connections": ["direction1", "direction2"],
  "isGoalNode": false,
  "canRotate": true
}
```

### Field Definitions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | **YES** | Unique identifier for the tile. Without this, tile will NOT render. | `"path-2-3"`, `"decoy-4-1"`, `"wall-0-0"` |
| `type` | string | **YES** | The tile type. Valid values: `"path"`, `"wall"`, `"node"`, `"empty"`, `"crushed"` | `"path"` for playable pipes, `"wall"` for boundaries, `"node"` for goal nodes |
| `x` | number | **YES** | X coordinate (0-indexed, left to right) | `0`, `3`, `5` |
| `y` | number | **YES** | Y coordinate (0-indexed, top to bottom) | `0`, `2`, `4` |
| `connections` | array | **YES** | Directions this tile connects to. Valid: `"up"`, `"down"`, `"left"`, `"right"` | `["left", "right"]`, `["up", "down"]`, `["up", "right", "down"]` |
| `isGoalNode` | boolean | **YES** | Whether this is a goal node (endpoint to connect). Only true for `type: "node"` | `true`, `false` |
| `canRotate` | boolean | **YES** | Whether player can rotate this tile. False for walls and nodes. | `true` for `"path"`, `false` for `"wall"` and `"node"` |

## Common Tile Configurations

### Path Tiles (Playable Pipes)
```json
{
  "id": "path-2-3",
  "type": "path",
  "x": 2,
  "y": 3,
  "connections": ["left", "right"],
  "isGoalNode": false,
  "canRotate": true
}
```

### Goal Nodes (Connection Endpoints)
```json
{
  "id": "node-1-2",
  "type": "node",
  "x": 1,
  "y": 2,
  "connections": ["up", "down", "left", "right"],
  "isGoalNode": true,
  "canRotate": false
}
```

### Wall Tiles (Boundaries, Crushers)
```json
{
  "id": "wall-0-0",
  "type": "wall",
  "x": 0,
  "y": 0,
  "connections": [],
  "isGoalNode": false,
  "canRotate": false
}
```

### Decoy Tiles (Red Herrings)
```json
{
  "id": "decoy-4-1",
  "type": "path",
  "x": 4,
  "y": 1,
  "connections": ["up", "left"],
  "isGoalNode": false,
  "canRotate": true
}
```

## Critical Requirements

### 1. **ID Field is Essential for Rendering**
- **Without `id`, tiles will NOT appear in the game**
- IDs must be unique within a level
- Naming convention: `{type}-{x}-{y}` or `{type}-{x}-{y}-{index}`
- Examples: `"path-2-3"`, `"decoy-4-1-0"`, `"wall-0-5"`

### 2. **Type Must Be Exact**
- ❌ Do NOT use `"straight"`, `"corner"`, `"t-junction"` (these describe shape, not type)
- ✓ Use `"path"` for all playable pipes (connections define the shape)
- ✓ Use `"wall"` for boundary/crusher tiles
- ✓ Use `"node"` for goal connection points

### 3. **Connections Array Format**
- Valid directions: `"up"`, `"down"`, `"left"`, `"right"` (lowercase, exact spelling)
- Array can have 1-4 directions
- Empty array `[]` for walls
- All 4 directions `["up", "down", "left", "right"]` for junction nodes

### 4. **Coordinates**
- (0,0) is top-left corner
- X increases left-to-right
- Y increases top-to-bottom
- Must be within grid bounds (e.g., if grid is 6x6, max x=5, max y=5)

## Validation Checklist

Before adding tiles to a level, verify:

- [ ] Every tile has an `id` field
- [ ] Every `id` is unique within the level
- [ ] `type` is one of: `"path"`, `"wall"`, `"node"`, `"empty"`, `"crushed"`
- [ ] `x` and `y` coordinates are numbers within grid bounds
- [ ] `connections` is an array with valid directions
- [ ] `isGoalNode` is boolean (true only for `type: "node"`)
- [ ] `canRotate` is boolean (false for `"wall"` and `"node"`, true for `"path"`)

## Real Example: Level 10 (Bridge)

Level 10 demonstrates proper tile structure with path tiles strategically placed:

```json
{
  "id": 10,
  "name": "Bridge",
  "world": 2,
  "gridSize": 5,
  "tiles": [
    {
      "id": "wall-0-0",
      "type": "wall",
      "x": 0,
      "y": 0,
      "connections": [],
      "isGoalNode": false,
      "canRotate": false
    },
    {
      "id": "node-1-1",
      "type": "node",
      "x": 1,
      "y": 1,
      "connections": ["up", "down", "left", "right"],
      "isGoalNode": true,
      "canRotate": false
    },
    {
      "id": "path-2-1",
      "type": "path",
      "x": 2,
      "y": 1,
      "connections": ["up", "down"],
      "isGoalNode": false,
      "canRotate": true
    }
  ]
}
```

## Debugging Missing Tiles

If tiles aren't showing in the game:
1. ✓ Check that `id` field exists on every tile
2. ✓ Check that `type` is exactly one of the valid types (case-sensitive)
3. ✓ Verify `connections` is an array with valid direction strings
4. ✓ Ensure coordinates are within grid bounds
5. ✓ Validate JSON syntax (use `jq` or JSON validator)

## Script Requirements

When writing scripts to generate tiles:
1. Always include the `id` field with unique value
2. Always use `type: 'path'` for playable pipes (not 'straight', 'corner', etc.)
3. Use appropriate connection patterns based on intended tile shape
4. Validate output JSON structure matches this specification
5. Test that generated tiles actually render in-game
