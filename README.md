# LateForClass

LateForClass is a first-person browser game written in JavaScript, HTML, and CSS with Three.js r128. The default level is a wireframe hallway with twelve outer edges, ten pillars, and invisible perimeter collision. Reach the far end and press **E** when prompted to complete the level.

## Run locally

From the repository root, start a static server with Python 3.

```bash
python3 -m http.server 8090
```

Open <http://localhost:8090> in a desktop browser and click **Start Game**. The browser needs WebGL, Pointer Lock, and access to the Three.js CDN. The game runs directly from source.

Open the [level picker](http://localhost:8090/levels/) or click **Choose a level** from the game screen to browse all levels by name. The list comes from `assets/levels.json` and includes new levels automatically.

## Controls and options

Choose **Options** on the start or pause screen. The Standard layout uses WASD to move and the arrow keys to look. The Swapped layout reverses those roles. The Keyboard and Mouse sections let you turn each look input on or off, adjust camera speed and mouse sensitivity, invert vertical mouse look, and optionally jump with a left click.

Changes apply when you play and are saved in this browser. **Back** returns to the menu, and **Restore Defaults** resets both sections. The default keyboard camera speed is 120°/s and mouse sensitivity is 1×.

| Input | Action |
| --- | --- |
| WASD | Move relative to the camera |
| Mouse or arrow keys | Look around |
| Space | Jump from the ground or a platform |
| E | Open a door in range, or confirm the original Hallway objective |
| Escape | Pause and release the mouse. Click Resume to continue. |
| R | Restart the level |

Choose **Play Again** on the completion screen to return to the starting position.

## Physics Playground

Open <http://localhost:8090/?level=2> to load the development level. The blue decks mark the gap to jump across. On the far side, try the purple platforms, the amber staircase and elevated deck, and the red low ceiling. Press **R** to restart after a fall into the pit. Open the default URL to return to the hallway.

## Corridor and Classroom

Open <http://localhost:8090/?level=3> and find **Room 101**. Press **E** to open the amber door, then walk through it. The level completes as soon as you are fully inside the scheduled classroom. Press **R** or select **Play Again** to restore the starting position and close the door.

The **Next class** panel shows the current school time and the scheduled class, room, and start time. The prototype starts at **08:00** and class begins at **09:00**. At 60× speed, that's 60 seconds of active play. Pause, loss of focus, or loss of pointer lock stops the clock. Enter Room 101 before 09:00 to win. At 09:00 the game shows **You’re Late!** and **Retry**. **Retry**, **Play Again**, and **R** all restore the starting time.

The level's `schedule` entry in `assets/levels.json` supplies `className`, `roomId`, and the class `startTime`. Its `clock` entry supplies the initial `startTime` and a positive `timeScale` (60× by default). Both times use 24-hour `HH:MM` on the same school day, with the clock starting at or before class time. The scheduled room ID identifies the classroom with its sign and three-dimensional `bounds`. The door's `roomId` links it to the same classroom.

Corridor and Classroom opens in solid view. Press **V** to switch between solid surfaces and wireframe collision outlines. You can also use the view button on the start and pause screens. The selected view stays active when you restart.

## Player physics

Y is vertical and X/Z are horizontal. The player position tracks the feet, and the camera stays at eye height above them. Movement follows camera yaw, and camera pitch leaves walking speed unchanged.

`assets/gameConfig.js` sets gravity to 9.8 world units per second squared and jump height to 1 world unit in open space. Its `maxStepHeight` of 0.35 world units limits automatic step-ups and ground following when stepping down. The player uses short time steps for wall sliding and checks the full vertical travel in each step for floors, ceilings, and platform faces.

Level definitions can include an optional `platforms` array of solid boxes. Each box uses `x` and `z` for its center, `y` for its bottom, and `width`, `height`, and `depth` for its size. Visible wireframes use those same collision bounds. The playground uses these boxes for its enclosure and each individual feature.

## Project layout

- [index.html](index.html) defines the game interface and loads the scripts in dependency order.
- [js/main.js](js/main.js) starts `Game` with the shared settings in [assets/gameConfig.js](assets/gameConfig.js).
- [js/controls.js](js/controls.js) defines the key layouts, control defaults, and browser storage.
- [Game](js/Game.js) loads the level definition and coordinates the scene, renderer, input events, and game loop.
- [Player](js/Player.js) owns movement, physics, and the camera. It asks `Level` about the environment and handles collision response.
- [Level](js/Level.js) builds and clears the scene objects defined by [assets/levels.json](assets/levels.json). It uses [Wall](js/Wall.js) for perimeter collision queries.
- [tests/](tests/README.md) contains the offline test runner and the browser test page. [AGENTS.md](AGENTS.md) documents the development workflow.

## Tests

```bash
node tests/movement/run-tests.js
```

With the local server running, open <http://localhost:8090/tests/movement/> to run the shared test cases with Three.js in the browser.
