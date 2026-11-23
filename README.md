# LateForClass

LateForClass is a first-person browser game written in JavaScript, HTML, and CSS with Three.js r128. The default level is a wireframe hallway with twelve outer edges, ten pillars, and invisible perimeter collision. Reach the far end and press **E** when prompted to complete the level.

## Run locally

From the repository root, start a static server with Python 3.

```bash
python3 -m http.server 8090
```

Open <http://localhost:8090> in a desktop browser and click **Start Game**. The browser needs WebGL and Pointer Lock. The game includes Three.js r128 and runs directly from source. [Three.js license](assets/vendor/three-r128/LICENSE)

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

Open <http://localhost:8090/?level=3> and check the schedule. Rooms **001–003** are on the ground floor and **101–103** are upstairs. The default challenge is **Mathematics in Room 102**. Follow the signed passage beside Room 003 to the public staircase. Match the scheduled room number to its door plaque, press **E** to open the door, and walk through it. Visiting another room keeps the clock running. Press **R** or select **Play Again** to restore the starting position and close every door.

The **Next class** panel shows the current school time and the scheduled class, room, and start time. The prototype starts at **08:00** and class begins at **09:00**. At 60× speed, that's 60 seconds of active play. Pause, loss of focus, or loss of pointer lock stops the clock. Enter your scheduled room before 09:00 to win. At 09:00 the game shows **You’re Late!** and **Retry**. **Retry**, **Play Again**, and **R** all restore the starting time.

The level's `schedule` entry in `assets/levels.json` supplies `className`, `roomId`, and the class `startTime`. Its `clock` entry supplies the initial `startTime` and a positive `timeScale` (60× by default). Both times use 24-hour `HH:MM` on the same school day, with the clock starting at or before class time. Change `schedule.roomId` to choose any room from `classrooms`, such as `002` for the alternate ground-floor route. Each room defines its ID, sign placement and rotation, and three-dimensional `bounds`. Entries in `doors` link to those IDs through `roomId`. An X-facing door uses `axis: "x"`. The room's floors, walls, and ceilings use the existing `platforms` geometry.

The level's `signs` entries place floor and direction signs. The approved two-floor map is in the [roadmap](ROADMAP.md#105-multi-floor-school-prototype).

Room 003 and the ground-floor corridor contain sample furniture. Each `environmentObjects` entry selects a `type` and an `x`, `y`, and `z` placement. Optional `rotationY` is in degrees around world-up Y, `color` overrides colors on procedural furniture, and `collidable` controls whether the object blocks movement. The whiteboard is decorative by default.

Set `model` to a GLB path relative to `assets/levels.json`, such as `models/lfc_student_desk.glb`, to use an imported visual for a placement. The bundled r128 GLTFLoader reads each distinct model at startup. Imported furniture uses its authored scale and materials, keeps its horizontal origin, and aligns its lowest point with the placement's `y` (default 0). Each solid model gets one world-aligned box enclosing its rotated geometry. Press **V** to see the collider. Restart rebuilds the instances and outlines, with geometries and materials shared through the selected level's model cache.

The level’s `lighting` entry holds `lights` and visible ceiling `fixtures`. Light types are `ambient`, `hemisphere`, `directional`, `point`, and `spot`. Directional and spot lights can specify `position` and `target`. Add a `shadow` configuration to an eligible source, then use `castShadow` and `receiveShadow` on platform, door, and furniture entries to select the surfaces involved. Room 003 uses one 512-pixel soft shadow map. Collision view hides the fixtures and suspends shadow mapping.

Corridor and Classroom opens in solid view. Press **V** to switch between solid surfaces and wireframe collision outlines. You can also use the view button on the start and pause screens. The selected view stays active when you restart.

## Player physics

Y is vertical and X/Z are horizontal. The player position tracks the feet, and the camera stays at eye height above them. Movement follows camera yaw, and camera pitch leaves walking speed unchanged.

`assets/gameConfig.js` sets gravity to 9.8 world units per second squared and jump height to 1 world unit in open space. Its `maxStepHeight` of 0.35 world units limits automatic step-ups and ground following when stepping down. The player uses short time steps for wall sliding and checks the full vertical travel in each step for floors, ceilings, and platform faces.

Level definitions can include an optional `platforms` array of solid boxes. Each box uses `x` and `z` for its center, `y` for its bottom, and `width`, `height`, and `depth` for its size. Visible wireframes use those same collision bounds. The playground uses these boxes for its enclosure and each individual feature.

## Project layout

- [index.html](index.html) defines the game interface and loads the scripts in dependency order.
- [js/main.js](js/main.js) starts `Game` and its interface with the shared settings in [assets/gameConfig.js](assets/gameConfig.js).
- [js/controls.js](js/controls.js) defines the key layouts, control defaults, and browser storage.
- [Game](js/Game.js) loads the level and coordinates rendering, browser input, Pointer Lock, and the game loop.
- [GameSession](js/GameSession.js) owns the schedule, run phase, and arrival result. It uses [SchoolClock](js/SchoolClock.js) to track active school time and checks the deadline before movement.
- [GameUI](js/GameUI.js) renders the session, HUD, and menus and forwards menu actions to `Game`.
- [Player](js/Player.js) owns movement, physics, and the camera. It asks `Level` about the environment and handles collision response.
- [Level](js/Level.js) builds and clears the scene objects defined by [assets/levels.json](assets/levels.json). It uses [Wall](js/Wall.js) for perimeter collision queries.
- [LightingManager](js/LightingManager.js) builds and clears each level’s light sources, shadow maps, and visible fixtures.
- [EnvironmentObjectFactory](js/EnvironmentObjectFactory.js) loads GLB templates and builds furniture and collision boxes from level placements. Procedural resources are shared within a build. Imported resources stay shared across restarts.
- [tests/](tests/README.md) contains the offline test runner and the browser test page. [AGENTS.md](AGENTS.md) documents the development workflow.

## Tests

```bash
node tests/movement/run-tests.js
```

With the local server running, open <http://localhost:8090/tests/movement/> to run the shared test cases with Three.js in the browser.
