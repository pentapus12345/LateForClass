# Late For Class

A first-person browser game built with Three.js. Walk down the hallway and enter the classroom to complete the level.

## Run locally

From the repository root:

```bash
python3 -m http.server 8090
```

Open <http://localhost:8090> in a desktop browser with WebGL and Pointer Lock support. The page loads Three.js from a CDN.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Mouse | Look around |
| E | Enter the classroom when the prompt appears |
| Escape | Pause and release the mouse. Click Resume to continue. |
| R | Restart the level |

## Project layout

- `js/main.js` starts the game.
- `js/Game.js` handles rendering, input, and the start, pause, and completion screens.
- `js/player.js` handles movement, collision response, and the camera.
- `js/Level.js` and `js/wall.js` build and clear the level and check collisions.
- `assets/levels.json` defines the spawn point, walls, and classroom location.

## Tests

```bash
node test/movement/run-tests.js
```

With the local server running, open <http://localhost:8090/test/movement/> to run the gameplay tests with Three.js in the browser.
