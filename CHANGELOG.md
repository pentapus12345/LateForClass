# Changelog

All notable changes to this project will be documented in this file.

Release headings use [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Older entries use the
file paths and test status from the time of the change.

## [Unreleased]

### 2026-11-27 — Reuse the Scholars’ Passage finish preset

- The Gatehouse passage and East Range vestibule builders share the Scholars’ oak, limewash and runner defaults. They read straight wall faces and supported opening dimensions from the First Court manifest, while fitted junctions and runner lengths stay explicitly authored.
- Both rebuilt runtime GLBs match their pre-change bytes. A temporary manifest test verified that moved walls and a resized arched opening move the derived finishes, and that missing, duplicate or misaligned sources fail the build. All 123 Node and 96 Chrome tests passed. The product owner approved the pilot as the foundation for future school expansion. [Authoring notes](docs/first-court-visual-spec.md#offline-finish-preset)

### 2026-11-27 — Make First Court’s architectural finishes consistent

- Carried the existing profiled oak, limewash, runner and ceiling assembly through Scholars’ Passage, the Reading Room leg, the cross passage and the East Range vestibule. Fitted the panel returns and doorway stops to the existing geometry.
- Completed the reception, teaching and reading room wall finishes. Used a lower dado in the lodge and a stone plinth in the cloakroom. Continued the cloister stone through its porches and fitted the East Range and lookout reveals.
- Captured 29 matched Chrome views. All 123 Node and 96 Chrome tests passed. The timed and untimed walks, restart, and 1,877-pose streaming visibility sweep passed.
- Peak startup transfer was 8,372,705 B against the 8 MiB limit. Timed routes peaked at 8.4 ms p95 with zero streaming holds. The finish pass awaits visual review. [Gallery and verification](docs/first-court-visual-spec.md#12-architectural-finish-consistency-pass)

### 2026-11-27 — Finish First Court’s courtyard and tower

- Rebuilt the existing tower as a limestone belfry with recessed louvres, a crenellated crown and four pinnacles. The same tower anchors both the cloister and stair lookout views.
- Varied the existing ranges with lancets, tall transomed hall windows, flat-headed mullioned windows and continuous slate roof sections. Added a flagstone walk, clipped lawn, and a small date plaque by the court gate.
- Fitted the cloister piers and coping, north porch wall, and the teaching roof and plinth below the lookout. Closed a jump-height sightline to an unloaded stair roof with the far court gable.
- All 123 Node and 96 Chrome tests passed. Both timed routes, both directions of the untimed loop, restart and area-load recovery passed. The visibility sweep found zero absent-area pixels across 1,877 poses.
- First Court startup peaked at 8,317,781 B, 70,827 B under 8 MiB. Peak estimated decoded assets were 59.87 MiB. Timed runs peaked at 9.2 ms p95 with zero streaming holds. Stage V4 awaits visual approval, with unfamiliar-player validation and the existing legacy startup exception still open. [V4 gallery and measurements](docs/first-court-visual-spec.md#11-stage-v4-courtyard-tower-and-final-review)

### 2026-11-26 — Furnish First Court’s teaching and public rooms

- Replaced the teaching furniture placeholders in Rooms 14 and 25 with optimized shared furniture, with copywork in the schoolroom and a geometry exercise in Mathematics. Furnished the Reading Room with bookcases, a reading table, upholstered chairs, a rug and a warm lantern.
- Fitted the lodge counter, pigeonholes and waiting bench. Added selective oak and limewash in reception and East Range, a working-room peg shelf in the cloakroom and one plaque in the stone arcade.
- All 122 Node and 95 Chrome tests passed, including streaming continuity and retained-resource checks. Chrome reached Room 25 via both routes and completed the untimed loop in both directions.
- First Court startup measured 7,596,007–7,596,342 B, down about 1.10 MB from V2 and below the unchanged 8 MiB gate. Peak estimated decoded assets fell to 57.89 MiB. Standard routes had a 9.1 ms p95 and zero streaming holds. V3 awaits visual review. [Matched Chrome views and measurements](docs/first-court-visual-spec.md#10-stage-v3-furnishings-and-room-identities)

### 2026-11-26 — Repair First Court’s architectural joins

- Joined the separate Scholars’ Passage plaster faces at the bright corner seam. Set the reception soffits back from the vault masonry and fitted the gable tops to the existing profile.
- Closed the unintended openings at both cloister vault ends, seated the ribs into the spine, and fitted the north soffit step. Finished the exposed lookout recess and corrected local oak trim and stone jamb joins.
- All 121 Node and 94 Chrome tests passed. The visibility sweep found no missing-area pixels across 1,887 sampled poses. The measured First Court startup was 8,695,772 B, above the existing 8 MiB gate. Stage V2 awaits review. [Matched Chrome views and verification](docs/first-court-visual-spec.md#9-stage-v2-architectural-geometry-review)

### 2026-11-26 — Fit the Scholars’ Passage visual sample

- Added warm limewash, fitted dark oak panelling and jambs, a muted runner, the existing John Locke portrait and iron lanterns, and schoolroom notices above a narrow ledge. The sample covers the passage past Rooms 13 and 14 through the first turn.
- Removed the competing solid-view dado and rail faces at local joins while preserving the original collision outlines. Both timed routes and both directions of the untimed loop passed, along with 120 Node and 93 Chrome regressions.
- Stage V1 awaits visual approval. The paired views, collision evidence, and startup and resource measurements are recorded with the sample. [Stage V1 review](docs/first-court-visual-spec.md#8-stage-v1-sample-for-visual-review)

### 2026-11-25 — Stream First Court’s three areas

- First Court starts with the gatehouse and cloister, then prefetches and retires areas using the three authored connections and the approved layout’s routes and sightlines. Door swings survive reloading. Cross-boundary lighting stays active, and reusing detached local lights bounds Three.js’s per-light uniform cache.
- A delayed passage pauses the active clock and clears movement before the player reaches missing scenery or collision. Retry passage and Resume keep the current attempt. Restart restores the initial area set, clock and closed doors.
- All 119 Node and 92 Chrome regressions passed. Three cold approaches had zero holds, and ten alternating loops kept the same retained area resources. Both startup byte budgets were exceeded. The streaming stage awaits product-owner review. [Measurements and verification](docs/milestone-20-new-school.md#8-streaming-stage-implementation-and-evidence)

### 2026-11-24 — Seven-room First Court blockout ready for timed-first review

- Connected both arms of First Court with a third physical passage. Added the seven approved room plaques, five working entrances and two furnished teaching rooms. Both the ordinary timed entry and optional development entry keep all three areas active.
- Room metadata now supplies public labels to plaques, range signs, instructions, the timetable, the objective and both results. Session and arrival logic use stable IDs across renumbering and retry.
- Verification covered both timed routes, a recoverable wrong turn, all working and restricted doors, both directions around the loop, and the alternate classroom schedule. The all-resident cold startup measured 3.11 s median and 8,406,276 B, 17,668 B above the eventual two-area byte target. The product owner’s first-time pacing and sightline review is pending. [Playtest and evidence](docs/first-court-blockout.md)

### 2026-11-24 — Open First Court for milestone 20 layout review

- Added a fourth selectable school with a gatehouse, a public porter’s lodge, a covered cloister, the ER-G-01 teaching room and a walkable stair overlooking the same courtyard tower. Three area definitions share one manifest and model cache. The original three level definitions keep their geometry and schedules.
- The ordinary entry begins Mathematics at 08:15 for a 09:00 class. An explicit development entry opens the same layout without a deadline. Startup and retry activate the authored area set.
- All 113 Node tests and 87 Chrome tests passed. A timed Chrome walk arrived at 08:30. An untimed walk visited both detours and crossed both seams in reverse. The fourth school used 1,764,600 B at startup. The original prototype stayed within its startup budget with 4,996 B of headroom in the largest sample.
- The three areas stay resident during layout review. Streaming, failure handling, final art and first-time playtesting follow the geometry and sightline decision. [First-person views and measurements](docs/first-court-blockout.md)

### 2026-11-24 — Prepare independently loaded school areas

- Adapted each playable level to a one-area school. World coordinates area lifecycle and delegates active-area queries. Level owns local instances and colliders, ModelCache shares GLBs, and LightingManager releases local lights and fixtures independently. Door swings survive unload and reload within a run.
- All 108 Node and 83 Chrome tests passed, including the concurrent two-area fixture. Browser walkthroughs covered all three levels and three timed Room 102 arrivals. Across eight fixed first-person comparisons, six pairs matched exactly and two differed at one pixel each.
- Startup increased by 14,564 bytes to 16,768,600 bytes, leaving 8,616 bytes under the 16 MiB ceiling. Median startup was 5.946 seconds, worst route p95 was 9.2 ms, and estimated decoded asset storage was 238.1 MiB. Cached templates live until world teardown. [Architecture decision and comparison](docs/connected-school-architecture.md#verification)

### 2026-11-24 — Add courtyard windows and daylight

- Opened the vaulted corridor near Room 103 and Room 101’s outer wall with matching mullioned windows onto a shared quadrangle. Added local daylight and thin blocking glazing with V outlines. The courtyard uses repeated stone bays, paved walks, and a central lawn.
- All 100 Node and 76 Chrome tests passed. Three timed Room 102 runs met the browser budgets, with 15.978 MiB at startup and a worst-run 95th-percentile frame interval of 9.3 ms. [First-person views and benchmark](docs/courtyard-window-review.md)

### 2026-11-24 — Complete milestone 18

- The product owner accepted the historic visual slice, including the collegiate corridor and Room 101’s student seating. The final implementation passed all 99 Node and 75 Chrome tests. [Screenshots and performance results](docs/historic-slice.md#collegiate-corridor-review)

### 2026-11-24 — Use student chairs in Room 101

- Room 101’s two desks now use the cataloged student-chair model, with both seats facing the chalkboard. All 99 Node and 75 Chrome tests passed, including a playthrough through Room 101 to the scheduled Room 102.

### 2026-11-24 — Refine the vaulted hall as a collegiate corridor

- Added pale, aged plaster above oak wainscoting, replaced the two corridor slabs with worn oak at the same finished floor height, and mounted a portrait and college noticeboard. Exposed stone marks the vault, arches, and thresholds.
- All 99 Node and 75 Chrome tests passed. Three timed runs visited Room 101 and finished in Room 102 within all four browser budgets. Startup used 15.93 MiB. [First-person comparison and benchmark](docs/historic-slice.md#collegiate-corridor-review)

### 2026-11-24 — Schedule Mathematics in Room 102

- Room 102 is now the default destination, so players can explore the historic Room 101 while the clock runs. The default-route regression verifies that visiting Room 101 keeps the game active and reaching Room 102 completes the run.
- All 98 Node and 74 Chrome tests passed. A Chrome playthrough explored Room 101 and finished in Room 102.

### 2026-11-24 — Finish the historic stair-to-classroom route

- Added textured stone stairs and walls, warm lanterns, and wooden signs along the vaulted route. Room 101 now has worn oak boards, timber beams, reused furniture, and a limewashed teaching wall. The brass-style classroom plaques draw their labels from room IDs.
- All 98 Node and 74 Chrome tests passed. Three timed runs finished in Room 101 and met all four browser budgets. Startup used 15.995 MiB of the 16 MiB budget. The first-person comparison is ready for visual acceptance. [Screenshots and benchmarks](docs/historic-slice.md)

### 2026-11-24 — Complete milestone 17

- The product owner accepted the historic architectural kit, including the vaulted hall, integrated masonry arches, and fitted oak doors. The final furniture and collision checks passed all 97 Node and 73 Chrome tests. [Roadmap](ROADMAP.md#17-asset-catalog-reproducible-model-pipeline-and-historic-architectural-kit)

### 2026-11-24 — Adjust the green hallway chair scale

- Enlarged the green hallway chair by 25% so it sits in better proportion to the console. Shifted it slightly away from the wall to fit the larger footprint while keeping the sign and walking route clear.
- All 97 Node and 73 Chrome tests passed. Checked the new proportions in first person and verified the fitted collision outline in V view.

### 2026-11-24 — Try the console and green chair in the vaulted hall

- Placed the imported hallway console and green chair along the first-floor wall, beside the stairs sign. Both have fitted colliders, with the center route and classroom thresholds clear.
- Corrected the chair source filename to `lfc_green_hallway_chair.glb`. The game loads two cataloged runtime copies with textures capped at 288 pixels, totaling about 0.79 MiB.
- All 97 Node and 73 Chrome tests passed. Three 1080p walkthroughs finished in Room 101 within the approved browser budgets. The startup download measured 15.96 MiB.

### 2026-11-24 — Fit oak leaves into pointed masonry openings

- Cut the same pointed profile through the three upstairs classroom openings and shaped their oak leaves from it. The existing E interaction, hinge poses, and room-arrival logic still apply. V shows the fitted collision sections. Rectangular doors remain supported.
- All 96 Node and 72 Chrome tests passed. Three 1080p runs met the browser budgets. Chrome also checked the closed fit from each side, both swing directions, and shared geometry after restart.

### 2026-11-24 — Rebuild the upstairs hall as a vaulted stone interior

- Replaced the flat first-floor corridor with two catalog-defined rib-vault bays, a pointed masonry portal at the stairs, deep classroom reveals, and worn flagstones. The corridor crown is about 6.5 units above the floor.
- All 95 Node and 71 Chrome tests passed. The existing Room 101 route met all four browser budgets in three 1080p runs. The kit documentation records the first-person views and comparison with the approved visual references.

### 2026-11-24 — Catalog classroom GLBs and add a historic starter kit

- Added level-data aliases for all six classroom GLBs, with the imported chair’s facing correction stored in the catalog. Added offline build commands and verified a byte-for-byte rebuild of the student chair.
- Added original limestone arches, oak doors and frames, and mullioned window samples to the upstairs benchmark route. Oak leaves use the existing door hinge and collision. Window frames are backed by the existing wall.
- All 95 Node and 71 Chrome tests passed. Three 1080p timed routes stayed within the approved browser budgets and finished in Room 101. The asset kit notes record screenshots and benchmark results.

### 2026-11-24 — Target Room 101 and prepare the historic school reference

- Mathematics now starts in Room 101. The route regression visits Rooms 003 and 102 before winning in Room 101. All 93 Node and 69 Chrome tests passed.
- Prepared a photographic reference sheet, an asset attribution register, and a desktop Chrome benchmark for the historic school. The product owner approved the reference direction, shortlist, benchmark route, and browser budgets.

### 2026-11-24 — Furnish Room 102 and correct imported chair facing

- Room 102 has two student desk-and-chair pairs, the teacher’s desk, a standing chalkboard, and wooden display shelves with seven decorative books. The two imported chairs in Room 003 now face their desks after the source model’s orientation change.
- The game uses six lighter GLB copies totaling 13.0 MiB. All 93 Node and 69 Chrome tests passed, including aisle clearance, collision view, model reuse across restart, and automatic arrival on the default timed route. Startup timing was measured on localhost.

### 2026-11-23 — Load original GLB desks and chairs in Room 003

- Added local Three.js r128 GLTFLoader and reused the furniture factory for two desks and two chairs. Model paths and rotations are configured in level JSON. Each model instance uses one fitted collision box shown in V view. Restart recreates the instances and wireframes while retaining shared model resources.
- All 92 Node and 68 Chrome tests passed. The Chrome walkthrough verified two model requests, shared resources across restart, the classroom aisles, and automatic arrival in both the furnished classroom and the default upstairs destination.

### 2026-11-23 — Prototype a visual style across both school floors

- Applied warm off-white walls and matte finishes, with teal ground-floor and ochre first-floor accents on the corridors, doors and plaques. Added stair and upper corridor lights and a whiteboard in Room 102. Floor names and room numbers continue to provide directions in text.
- All 90 Node and 67 Chrome regressions passed. The Chrome walkthrough verified signage on approach, visible stair treads, the collision view toggle, and timed arrival in Room 102.

### 2026-11-23 — Furnish Room 003 and its corridor

- Arranged eight desk-and-chair pairs in two rows, with a center aisle and a cross aisle. Added a teaching area at the far wall and grouped three lockers across from the corridor bench. Room 003 uses cool walls, warm furniture, and the existing soft shadows.
- All 90 Node and 67 Chrome tests passed. A Chrome walkthrough verified aisle clearance, solid and collision views, automatic arrival, the route to Room 102, and cleanup on restart. At 1000×600 with GPU readback, the test machine recorded median render times of 1.10 ms without shadows and 1.41 ms with shadows. The prototype uses basic geometry and flat materials.

### 2026-11-23 — Add configurable lighting and soft shadows

- Added level-defined lighting, three visible ceiling fixtures, and one 512-pixel soft shadow map for Room 003 and its corridor. Selected furniture, walls, doors, and floors participate in shadows. Collision view suspends shadow mapping and hides the fixtures.
- All 88 Node and 65 Chrome tests passed. Chrome confirmed visible door shadows in both positions, readable signs and stairs, resource disposal on restart, and the upstairs route. At 1000×600, median per-render time with GPU readback was 0.63 ms with shadows off and 0.77 ms with shadows on in the test session.

### 2026-11-23 — Add reusable school furniture

- Added student desks, student chairs, a teacher’s desk, a whiteboard, lockers, and benches as data-defined objects. The sample placements furnish Room 003 and the ground-floor corridor. Solid pieces use box colliders and appear in collision view. The whiteboard is decorative by default.
- All 86 Node and 63 Chrome tests passed. Chrome verified locker and desk collision, rotated debug bounds, resource disposal on restart, and the existing upstairs challenge route.

### 2026-11-23 — Close the rear wall of Room 003

- Sealed the old opening from Room 003 to the stair vestibule with a full-width wall. The public passage provides access to the stairs.
- All 83 Node and 60 Chrome tests passed. Chrome verified collision from both sides, the matching debug outline, and stair traversal through the public passage.

### 2026-11-23 — Set up the first complete class-navigation challenge

- The default schedule sends Mathematics to First-floor Room 102, with 60 seconds of active play from the existing ground-floor spawn. Ground Room 002 serves as an alternate test destination through the same schedule data.
- All 82 Node and 59 Chrome regression tests passed. Chrome visited a wrong room, won the default upstairs run, won the alternate ground-floor run, waited out the stock deadline, and verified reset. First-time wayfinding remains to be observed during playtesting.

### 2026-11-23 — Connect two playable floors

- Renumbered the ground-floor classrooms 001–003 and added Rooms 101–103 upstairs. Mathematics remains in the same physical room as Room 003. Floor and direction signs connect the numbered corridors to the public west passage and stairwell.
- Moved the existing twelve-tread flight and upper landing 2.5 world units along the stairwell to make room for a flat public approach. The upper landing opens into the new corridor. The rooms, signs, doors, and colliders come from level data.
- All 82 Node tests and 59 Chrome regression tests passed. Chrome verified all three upstairs destinations, the default ground-floor arrival, a wrong-floor visit, stair ascent and descent, both render modes, timeout, Retry, and sign visibility. First-time player comprehension remains to be verified in playtesting.

### 2026-11-23 — Fix the stuck loading screen

- Versioned the updated startup scripts and made the bootstrap show an error when a required component fails to load. Level data is revalidated on startup, and a stalled request times out after ten seconds.
- Included the existing Three.js r128 build and its license so the game and browser tests load it locally.
- All 79 Node tests and 57 Chrome tests passed. Chrome reproduced the loading hang with a blocked startup script, then verified the visible error, the level request timeout, and gameplay with the CDN blocked.

### 2026-11-23 — Establish discoverable room numbering

- Numbered the existing corridor from a fixed origin. Room 101 is east, Room 102 is west, and Room 103 is at the far end. Floor and direction signs show the routes from both ends. The Mathematics schedule follows its original physical classroom to Room 103.
- All 78 Node tests and 57 Chrome regression tests passed. Scripted Chrome routes verified Room 101 from the origin sign, Room 102 from the far-end sign, and Mathematics arrival in Room 103. First-time player comprehension remains to be verified during playtesting.

### 2026-11-23 — Extract game session and interface components

- Added `GameSession` as the owner of the run phase, schedule, and arrival result. It composes `SchoolClock` and applies the deadline before movement. `GameUI` owns the menus, options form, HUD, and result screens. `Game` coordinates rendering, browser input, and Pointer Lock.
- All 77 Node tests and 56 Chrome regression tests passed. New tests exercise session transitions and the UI contract independently. Chrome verified startup, all three room routes, pause and resume, Options and Restore Defaults, debug view, the full 60-second timeout, and Retry.

### 2026-11-23 — Add two numbered classrooms to the timed corridor

- Added Rooms 102 and 103 off the existing corridor. Level data defines the three rooms' signs, door associations, and arrival volumes. The nearest closed door opens with E, and the schedule selects which room completes the run.
- All 74 Node tests and 54 Chrome regression tests passed. Chrome verified the three signs in solid view, each room as a winning destination, the running clock after a wrong-room visit, and door reset. Tests also compared closed and open door panels and debug outlines with their colliders.

### 2026-11-23 — Add the accelerated school clock and deadline

- Corridor and Classroom starts at 08:00 and advances one school minute per active second. The schedule shows the current time and the class start time. Pause, loss of focus, and loss of pointer lock freeze the clock.
- Entering the scheduled classroom before class starts wins. At the deadline, **You’re Late!** ends the run and **Retry** restores the clock, spawn, and door. The starting time and speed are set in the level data.
- All 72 Node tests and 52 Chrome regression tests passed. Chrome verified automatic arrival, 08:10 after ten active seconds, pausing in Options, a full 60-second timeout, and retry. Deterministic tests covered the exact deadline and focus and visibility transitions.

### 2026-11-23 — Register classroom arrival at the doorway

- Corridor and Classroom now completes when the player fully enters the scheduled room. E opens the door. The classroom volume and door association come from level data, and the green destination marker has been removed.
- All 66 Node tests and 50 Chrome regression tests passed. A Chrome playthrough checked the closed door, partial threshold clearance, other floor heights, automatic Room 101 arrival, and restart. An alternate schedule verified that entering the wrong room leaves the objective active and the stairs traversable.

### 2026-11-22 — Add configurable controls and an Options screen

- Added Standard and Swapped keyboard layouts, independent keyboard and mouse look, adjustable keyboard camera speed and mouse sensitivity, inverted vertical mouse look, and optional left-click jumping. The Options screen is available before play and while paused. Changes save in the browser, and Restore Defaults resets all controls.
- Physical inputs map to gameplay actions before reaching Player. Keyboard and mouse look share the existing yaw and pitch model, with zero roll. Keyboard look starts at 120°/s and the existing mouse sensitivity is 1×.
- All 65 Node tests and 50 Chrome regression tests passed. A Chrome playthrough verified the Options screen, reload and restore, movement and camera controls in both layouts, Space and click jumping, the Room 101 route, and pause and restart.

### 2026-11-22 — Add the player schedule panel

- Added a **Next class** panel to Corridor and Classroom. The level data supplies the prototype entry, Mathematics in Room 101 at 09:00. The scheduled room drives the objective and arrival check. The start time is informational.
- All 58 Node tests and 46 Chrome regression tests passed. Tests verified updated configuration values, room matching, and panel visibility. A Chrome playthrough verified that the panel fits alongside the objective and view hint at desktop and 360-pixel widths, and that it works with movement, the door, arrival, pause, resume, and restart.

### 2026-11-22 — Fix the view toggle before start and while paused

- V previously required pointer lock. It now switches views in Corridor and Classroom before starting, during play, and while paused. The start and pause screens also have a button that switches views and redraws immediately.
- All 57 Node tests and 46 Chrome regression tests passed. A Chrome playthrough verified the shortcut and button on the start and pause screens and the shortcut during play.

### 2026-11-22 — Add solid rendering and collision debug view

- Corridor and Classroom now starts with opaque surfaces and basic lighting. The door, sign, stairs, and green arrival marker stand out in solid view.
- V switches between solid surfaces and wireframe collision outlines built from the same bounds. The view persists on restart. The Hallway and Physics Playground retain their wireframes.
- All 57 Node tests and 46 Chrome regression tests passed. A Chrome playthrough checked matching bounds in both views, the door, staircase ascent in solid view and descent in debug view, a jump on the landing, arrival, and reset.

### 2026-11-22 — Identify the classroom and record arrival

- Added prototype identifier Room 101 and a matching destination to Corridor and Classroom in `assets/levels.json`. `js/Level.js` renders the doorway label and checks room identity, horizontal bounds, and floor height. `js/Game.js` displays the named objective and records arrival with E.
- Updated the README, test documentation, and roadmap. All 54 Node tests and 44 Chrome regression tests passed. A Chrome playthrough verified the Room 101 objective, door interaction, arrival, and reset. Tests cover a mismatched room identifier and sign texture cleanup.

### 2026-11-22 — Complete one classroom objective

- Added a floor-level destination to Corridor and Classroom in `assets/levels.json`. `Level` draws a green marker and checks its footprint and floor height. `Game` displays the objective, keeps the door interaction available, and completes the run when E is pressed inside the marker.
- Updated the README, test documentation, and roadmap. All 53 Node tests and 43 Chrome regression tests passed. A Chrome playthrough verified opening the door, rejecting E outside the marker and on the upper landing, completing inside the marker, and resetting the objective and door with R.

### 2026-11-22 — Connect two floors by stairs

- Extended Corridor and Classroom in `assets/levels.json` with twelve treads, a stairwell, and an enclosed upper landing three world units above the classroom floor. The route uses the existing rendering and collision system.
- Updated the README, test documentation, and roadmap. All 51 Node and 42 Chrome regression tests passed. A Chrome playthrough verified opening the existing door, walking every tread in both directions while grounded, and stopping at the landing wall. Automated coverage checks head clearance and landing boundaries.

### 2026-11-22 — Add one interactive classroom door

- Added a data-defined door to Corridor and Classroom. `Level` keeps the panel and collider aligned as the door swings away from the player. `Game` shows the prompt in range, routes E to open it, and restores the closed state on restart.
- Updated the README, test documentation, and roadmap. All 48 Node tests and 39 Chrome regression tests passed. A Chrome playthrough verified both approaches, out-of-range input, traversal, reset, and matching panel and collider bounds in both states.

### 2026-11-22 — Add a level picker

- Added `/levels/` using `levels/index.html` and `js/level-picker.js`. It lists every level by name from `assets/levels.json` and opens the selected level through its existing URL.
- Added a picker link to the game screen and documented it in `README.md` and `ROADMAP.md`.
- All 47 Node tests passed, including future level entries and empty or unavailable data. Chrome verified all three level links, the return link, and the list at a narrow viewport.

### 2026-11-22 — Connect one corridor and one classroom

- Added the Corridor and Classroom development scene to `assets/levels.json` at `/?level=3`. A level doorway connects the two spaces, with the visible wireframe and collision using the existing box data. The default hallway and Physics Playground retain their level definitions.
- Documented the route in `README.md` and recorded the approved milestone as completed in `ROADMAP.md`.
- Updated the browser and Node test entry points and added doorway regressions in `tests/movement/`. All 45 Node tests and 38 Chrome regression tests passed. A Chrome playthrough verified the grounded round trip, collision beside the doorway, and R restoring spawn and view.

### 2026-11-22 — Physics Playground and stair movement

- Added the Physics Playground to `assets/levels.json` with a jump gap, three raised platforms, six stair treads, a low ceiling, and an elevated deck. `js/Game.js` selects it with `?level=2` and restarts the selected level. The original hallway remains the default with its existing definition and controls.
- Updated `js/Level.js` to draw each playground wireframe from the same box bounds used for collision. `js/Player.js` now clears short steps when grounded and follows nearby lower treads, subject to head clearance and the `maxStepHeight` setting in `assets/gameConfig.js`.
- Updated the project and test readmes and the runner, shared tests, and browser test page in `tests/movement/`. All 41 Node and 35 Chrome regression tests passed, including camera checks. A Chrome playthrough verified the gap jump, stair ascent and descent, elevated fall, restart, and matching rendered and collision bounds.
- The playground uses static axis-aligned boxes. Grounded stair motion follows each discrete tread height, and larger drops use gravity.

### 2026-11-22 — Unify first-person camera orientation

- Diagnosed two camera orientation paths in `js/Player.js`. Startup and restart used Three.js `lookAt()`, which could initialize pitch outside the mouse clamp. Chrome reproduced a pitch snap on the first horizontal-only mouse event after a vertical spawn. The stock hallway did not reproduce sideways roll during that check.
- Gave Player explicit yaw and pitch and one `YXZ` rotation method that applies zero roll. Startup targets, restart, and mouse look share the same clamp. WASD uses the same yaw to determine horizontal direction.
- Added the camera rule to `AGENTS.md` and documented the regression checks in `tests/README.md`. The Node and shared tests in `tests/movement/` check the world-space camera basis, including the horizontal right axis that keeps the horizon level.
- Passed 31 Node tests and 26 Chrome tests using Three.js. A pointer-locked Chrome session exercised horizontal turns while looking up and down, circular mouse input, multiple full turns, and restart. The horizon test also detected a deliberate rotation-order error in an isolated copy.

### 2026-11-22 — Player jumping and vertical collision

- Updated `js/Player.js` and `assets/gameConfig.js` with grounded jumps on Space, configurable gravity and jump height, and short physics steps that interleave vertical motion with camera-relative walking and wall sliding.
- Updated `js/Level.js` and `js/Wall.js` to find the first floor, ceiling, or platform face crossed in a vertical step. Optional solid platforms support landing, underside collision, and stepping off. The current level data and rendered geometry remain the same.
- Updated `js/Game.js` to route Space and stop accepting movement and mouse input on focus or pointer-lock loss. Pausing preserves vertical momentum for resume.
- Updated `README.md`, `tests/README.md`, and the Node and shared tests in `tests/movement/`. All 22 Node tests and 18 Chrome regression tests passed. A Chrome playthrough verified Space, landing, pointer lock, mouse look, pause and resume, wall collision, restart, and completion.
- Elevated platforms and ceiling impacts from high jumps are covered by test fixtures. The shipped hallway has a flat floor and no elevated platforms.

### 2026-11-22 — Repository cleanup and standardization

- Renamed `js/player.js` to `js/Player.js` and `js/wall.js` to `js/Wall.js` using intermediate Git moves. Moved `test/` to `tests/` and updated the game, browser test page, offline runner, and documentation references.
- Standardized JavaScript constants and names, HTML IDs and CSS selectors, and control-flow formatting. Removed the duplicate global config export and kept the existing startup path and class responsibilities.
- Added `AGENTS.md` as the shared development guide, pointed `CLAUDE.md` to it, and updated the project and test readmes.
- Passed all 14 Node tests and all 11 shared tests in Chrome. The playthrough verified controls, collisions, completion, and reset. Compared the rendered spawn, overlay styles, geometry, camera, and wall bounds with the baseline using a server that enforces exact filename casing.
- The game requires a desktop browser with WebGL, Pointer Lock, and access to the Three.js CDN.

### 2026-11-22 — Restore the minimal wireframe hallway

- Kept the verified `js/main.js` bootstrap and the single `Game` / `Player` / `Level` implementation. Moved camera creation and resizing into `js/player.js`. Updated `js/Game.js` to load level data before starting the renderer, and adjusted `index.html` and the on-screen instructions for the wireframe layout.
- Updated `js/Level.js`, `js/wall.js`, `assets/gameConfig.js`, and `assets/levels.json` to use the same hallway dimensions for the twelve outer edges and four invisible wall colliders. Restored the ten intended pillars and removed the rendered floor, grid, walls, and door. The existing classroom prompt still appears at the far end.
- Updated `README.md`, `test/README.md`, and the Node and shared tests in `test/movement/`. All 14 Node tests and all 11 Chrome regression tests passed. A separate Chrome playthrough verified the scene, mouse look, movement, pause, restart, wall collision, and completion.
- The starting level requires a desktop browser with WebGL, Pointer Lock, and access to the Three.js CDN.

### 2026-11-22 — First playable level

- Added `js/Game.js` and `js/Level.js` to complete the refactor. Updated `index.html` and `js/main.js` to use one startup path and load `js/player.js` with its exact filename.
- Updated `js/player.js` and `assets/gameConfig.js` to fix mouse look, frame-rate-dependent movement, braking, and camera height. Escape pauses the game, and Resume recaptures the mouse.
- Updated `js/wall.js` and `assets/levels.json` so the hallway walls match their collision geometry. Restart resets the player to spawn and disposes of the previous level's meshes.
- Added a classroom door and interaction prompt. Pressing E in range completes the level, and Play Again starts a fresh attempt.
- Updated `README.md`, `test/README.md`, and the three files under `test/movement/` to document the controls and test the production classes.
- Verified 11 Node tests and 10 Chrome regression tests. The Chrome playthrough also verified pointer lock, mouse look, Escape and Resume, wall collision, restart, completion, and Play Again.
- The game has one level and uses the Three.js CDN. It requires a desktop browser with WebGL and Pointer Lock support.

## [0.2.0] - 2026-11-22

### Added

- Game class (`js/Game.js`) for central application coordination
- Level class (`js/Level.js`) for level management and scene building
- Player class (`js/player.js`) for player movement and physics
- Wall class with improved collision detection (`js/wall.js`)
- Asynchronous level loading from assets/levels.json

### Changed

- Refactored main.js into a bootstrap file that initializes the Game object
- Implemented object-oriented architecture with clear separation of concerns
- Improved level loading to use JSON data instead of hardcoded values
- Enhanced Wall class to properly handle collision detection and rendering
- Centralized game logic in the Game class while delegating responsibilities to other classes

### Removed

- Duplicated physics code from main.js
- Hardcoded level geometry in main.js
- Global variables for movement state (now managed by Player)
- Redundant event listeners and input handling code

## [0.1.1] - 2026-11-20

### Added

- Level data structure in assets/levels.json including player starting position and look direction
- Frame-rate independent movement calculations
- Proper camera positioning based on level data

### Changed

- Refactored main.js to clean up scene creation and movement logic
- Normalized direction vectors for movement key combinations
- Optimized Three.js scene to use only 12 line segments for box edges
- Improved movement physics with proper delta time application
- Removed collision detection for middleWall that was blocking player movement

### Removed

- Unnecessary floor mesh and middleWall geometry
- Unused variables and code related to deleted elements

## [0.1.0] - 2026-11-20

### Added

- Initial HTML, CSS, and JavaScript project structure with `index.html`, `js/main.js`, `js/wall.js`, and `assets/gameConfig.js`.
- Movement test runner, browser test page, and documentation in `test/`. The initial movement tests used mock logic.
- Project documentation, development guidelines in `CLAUDE.md`, and this changelog.
