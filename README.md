# LateForClass

LateForClass is a first-person browser game written in JavaScript, HTML, and CSS with Three.js r128. The single level is a wireframe hallway with twelve outer edges, ten pillars, and invisible perimeter collision. Reach the far end and press **E** when prompted to complete the level.

## Run locally

From the repository root, start a static server with Python 3.

```bash
python3 -m http.server 8090
```

Open <http://localhost:8090> in a desktop browser and click **Start Game**. The browser needs WebGL, Pointer Lock, and access to the Three.js CDN. The game runs directly from source.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move relative to the camera |
| Mouse | Look around |
| E | Complete the level when the classroom prompt appears |
| Escape | Pause and release the mouse. Click Resume to continue. |
| R | Restart the level |

Choose **Play Again** on the completion screen to return to the starting position.

## Project layout

- [index.html](index.html) defines the game interface and loads the scripts in dependency order.
- [js/main.js](js/main.js) starts `Game` with the shared settings in [assets/gameConfig.js](assets/gameConfig.js).
- [Game](js/Game.js) loads the level definition and coordinates the scene, renderer, input events, and game loop.
- [Player](js/Player.js) owns movement, physics, and the camera. It asks `Level` about the environment and handles collision response.
- [Level](js/Level.js) builds and clears the scene objects defined by [assets/levels.json](assets/levels.json). It uses [Wall](js/Wall.js) for perimeter collision queries.
- [tests/](tests/README.md) contains the offline test runner and the browser test page. [AGENTS.md](AGENTS.md) documents the development workflow.

## Tests

```bash
node tests/movement/run-tests.js
```

With the local server running, open <http://localhost:8090/tests/movement/> to run the shared test cases with Three.js in the browser.
