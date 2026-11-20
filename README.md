# Late for Class — Campus Puzzles v5

Play in a browser. This is a lightweight, dependency-free first-person ray-casting game.

## Run

From the `game` directory:

```bash
python3 -m http.server 8090
```

Open http://localhost:8090. If port 8090 is in use, select another port.

## Controls

- WASD or arrow keys: move
- Mouse: look around (click the game to capture pointer; Escape releases it)
- Shift: sprint
- E: enter a classroom / use a staircase
- R: restart level
- L: open level selector

## Levels and progressive logic

1. wireframe box

## Architecture

- `assets/levels.json`: floor and stair geometry, room numbers, timer start, level name, etc.
- `src/building.js`: building objects, walls, stairs, doorways etc
- `src/game.js`: gameplay, floor transitions, level selection
- `tests/`: structural, numbering, path-reachability and logic checks

## Tests

```bash
node --test tests/*.test.js
```

## Known limitations


