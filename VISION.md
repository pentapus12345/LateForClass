# LateForClass — Product Vision

## The premise

**LateForClass is a first-person, time-pressured navigation game set in one enormous, historic school that becomes increasingly improbable the better you get to know it.** You have classes to attend, rooms to find and deadlines to beat. You are under pressure from the beginning. As you rush through the school, you glimpse inviting rooms, distant passages and intriguing clues that you would love to investigate—but usually cannot stop for. Over successive classes, learning routes, recognizing landmarks and interpreting the institution’s peculiar history become increasingly important to arriving on time.

The school should initially seem like a functioning, centuries-old English boarding school or university. It is beautiful, overwhelming, lived-in and sometimes inconvenient. With time it reveals forgotten departments, bizarre arrangements, impossible spaces and subtle changes to familiar routes. Its response to all this is characteristically bureaucratic. The tone is **curious, atmospheric, dryly funny and occasionally unsettling—not primarily horror**.

**Core promise:** *You have to get to class. The school is fascinating, enormous and confusing—and there is never quite enough time to see everything.*

**Primary player experience:** Immediate urgency, quick decisions and the pleasure of gradually mastering a place you initially barely understand. Exploration is a source of temptation and a means of solving later navigation problems, **not a replacement for the deadline-driven game**.

## 1. One school, not a sequence of unrelated levels

- The intended game takes place in **one connected school and its grounds**, rather than a set of independent corridor challenges. The world should persist conceptually across classes and school days.
- Each location has a recognizable identity, a believable institutional purpose and relationships to other places. Rooms, corridors and courtyards should not exist solely to create the shortest route to the next objective.
- The school is **far larger than the player initially understands**. A first visit reveals only a small part; distant buildings, galleries, stairs, courtyards and branching passages suggest much more beyond it.
- Navigation offers choices: meaningful junctions, optional detours, alternative routes and places worth investigating even when they do not serve the current class.
- **Unnecessary complexity is present from the opening minutes.** Before anything supernatural happens, the school already has redundant corridors, unexpected reconnections, inconvenient original entrances, awkwardly placed staircases and routes that make historical or administrative sense rather than navigational sense. The first class can be easy while the surrounding campus is bewildering. Complexity is a property of the place, not a late-game difficulty switch.
- **Run out of time, not places to go.** Within the developed, reachable campus, players are free to choose a wrong direction, take a detour or explore far from the scheduled classroom; the deadline, rather than an invisible gameplay fence, is the consequence. Plausible staff restrictions, safety barriers and the practical boundary of an unfinished world are acceptable, but new school areas should increasingly provide genuine routes beyond the immediate objective.
- The player builds a mental map. Previously learned routes, landmarks, numbering conventions and shortcuts remain useful over time. **Accumulated knowledge is a primary form of progression.**
- The existing Hallway, Physics Playground and six-classroom school are **development and regression prototypes**, not the required geography of the final school. Future school-building should not be constrained by those layouts.

## 2. Timetable-driven navigation and escalating challenges

- Scheduled classes give the player a **reason to move through the world**. A challenge identifies the class, destination room and start time. The player must find and **physically enter the correct classroom strictly before** the deadline. Merely reaching its door, entering another room or pressing a completion key does not count.
- Arriving on time succeeds; reaching the deadline first fails the **current class challenge**. The existing prototype's win/loss/retry behavior remains the reference implementation, but the long-term game should not treat every failed class as a reason to erase the entire school experience.
- **Early classes emphasize panic and orientation.** The player starts with a clearly specified but unfamiliar destination and a short, fair deadline. Reading signs, choosing a passage, opening the right door and correcting a small mistake are enough to create pressure. The first playable challenge should feel urgent immediately, not like a guided tour.
- **Later classes broaden the challenge.** More distant destinations, accumulated route knowledge and alternative paths require better decisions. Still later, longer allowances support investigating cryptic numbers, contradictory directions, renamed halls, obsolete notices, counterintuitive connections and historical clues. Finding out *where the classroom actually is* may become the puzzle.
- **Retry-driven mastery is central.** Class challenges may be deliberately tight: players can fail repeatedly, learn routes, reduce hesitation and execute an almost optimal run. Retries of the current challenge are unlimited and should be quick, predictable and free of punitive resource costs. A first attempt may be unsuccessful and still be good design if it provides legible, useful knowledge for the next attempt.
- The time budget reflects distance, navigational complexity, clue interpretation and learnable execution—not simply a fixed increase from one challenge to the next. A tight execution challenge can have little slack beyond a known effective route; an investigative challenge may need a substantially longer allowance for reasoning. Avoid requiring frame-perfect inputs, invisible traps or luck.
- Show helpful post-run timing feedback eventually (for example arrival margin, seconds late, or best time), without adding scoring or progression mechanics until approved.
- The environment should continually tempt the player with rooms and routes they lack time to inspect. Curiosity and time pressure reinforce each other. Optional untimed exploration can exist as a **development and playtesting mode**; whether ordinary players ever receive free-roaming periods remains undecided, not a core requirement.
- The school can contain genuine locked, staff-only or otherwise restricted spaces when these make sense in-world. Access should not depend on arbitrary game-level numbers.
- The immediate objective is understandable or solvable from the timetable and in-world clues. As the game progresses, what counts as a sufficient clue can become less direct, provided the solution remains fair and discoverable.

### Time and challenge rules

- The game uses **simulated school time**, independent of the computer clock. The initial/default speed is **60×**: one real second of active play advances one school minute.
- A readable clock and timetable derive from one authoritative simulation clock and schedule. Challenge start time, destination and deadline are data-defined.
- Pausing or suspending active play freezes simulated time; loading and interruption must not unfairly consume the player's deadline.
- Arrival strictly before class time counts as on time; arrival at or after the deadline is late. Outcomes must be deterministic and frame-rate independent.
- A class retry resets the appropriate challenge state **without restricting retry count**. It should let the player attempt the same route again immediately, preserving the player's *learned knowledge*. Which in-world changes, discoveries and longer-term progress survive retry, failure or a new day must be specified before progression is implemented.
- **Current difficulty evidence (27 November 2026):** The owner changed the Latin challenge to start at 09:30 for a 10:00 class (30 active seconds at 60×) and found it difficult, achievable and enjoyable to retry. Treat this as a valuable experienced-player trial, **not** evidence that the same deadline is fair to a blind first-time player. Preserve the data-defined deadline and test difficulty profiles later.

## 3. A vast, credible, historically layered institution

The architectural direction is **stylized realism inspired by old English universities and boarding schools**—not a fantasy castle, generic modern school, or monotonous medieval dungeon.

- Grand entrance halls, tall vaulted spaces, substantial arches, stone quadrangles, cloisters, galleries, monumental staircases, high windows, oak doors, stone and plaster walls, timber panelling, worn flagstones, patterned tiles and old wooden floors all have a place.
- The building should feel as though it has grown and been adapted **over centuries**: different wings, awkward connections, mismatched heights, renovated classrooms, practical modern fittings and occasional ancient fabric.
- The architecture must vary. Imposing public halls and warmly occupied academic corridors contrast with ordinary classrooms, narrow staircases, service tunnels, kitchens, neglected storage rooms and older, more austere sections.
- It is unmistakably **a school**: room plaques, directional signs, timetables, portraits, noticeboards, books, displays, teaching equipment, lamps, radiators and traces of daily institutional life accompany the historic architecture.
- **Windows genuinely look outside** onto courtyards, other wings, gardens, rooftops and grounds. Daylight helps convey the campus's size. Eventually the player can walk through courtyards and across outdoor sports areas, including a football field.
- Lighting varies deliberately: sunlit classrooms and courts, warm occupied interiors, dim back passages and neglected spaces. Darkness builds atmosphere but must not turn normal navigation into guesswork.
- Over time, students, teachers, maintenance staff and other moving people may help the building feel occupied. Ambient activity should enrich, not obstruct, navigation.
- The visual language should make the school beautiful and inviting enough that players **wish they could stop and wander, even while racing to class**.

## 4. Places worth discovering

Beyond classrooms, the eventual school should organically contain libraries, reading rooms, laboratories, lecture halls, administrative offices, dining halls, a cafeteria and its kitchens, service and delivery yards, maintenance rooms, utility corridors, storage, basements, changing rooms, showers, courtyards, gardens and sports grounds.

- Spaces have plausible everyday relationships. Kitchens connect to dining rooms and deliveries; changing rooms connect to sports facilities; service stairs and maintenance corridors reach otherwise inconvenient places.
- Sometimes an unlikely route—through a kitchen, a shower block, a courtyard or a maintenance passage—becomes a useful or essential shortcut.
- Some discoveries are simply interesting. Not every unlocked door or side corridor must contain a puzzle, reward or classroom.
- Distinctive architecture, signs, furnishings, paintings, views and sounds create memorable landmarks that help the player orient themselves.
- The first playable part of the new school should already offer **at least one meaningful direction choice or optional detour** and convincing views of a larger institution; it should not feel like a single long corridor dressed as a campus.

## 5. Familiarity, change and increasing absurdity

The school is **architecturally and bureaucratically absurd from the outset**; what emerges gradually is the suspicion that some of its geography is not merely inconvenient but impossible. Its mundane routines make the absurdities more convincing.

- **Most geography remains stable and learnable.** The player must be able to trust enough of the school for familiarity to matter.
- Occasionally, a familiar connection, door, staircase, sign or destination has changed since the previous visit. Changes are **rare enough to be noticed**, not constant random maze reshuffling.
- Changes generally occur between visits, between classes or out of sight. They should be surprising and retrospectively understandable, with clues and viable alternate routes.
- Deeper areas may have internally consistent but unconventional rules: strange room-number sequences, forgotten departments, improbable staircases, spaces larger inside than outside, and connections that cannot coexist in ordinary geometry.
- **Route-dependent impossible topology (late game):** The *same recognizably identical room*—its floor plan, objects, windows, architecture and orientation—can be encountered more than once, yet its doors or corridors connect to **different destinations depending on the approach, direction of travel, or path previously taken**. For example, circumnavigating a hall clockwise and returning may reveal the familiar room with a passage to one wing; returning anticlockwise may reveal the *same room* with that passage leading somewhere that cannot be geometrically adjacent, perhaps apparently on another floor despite no visible climb. The room itself is not casually swapped for a different-looking room. The paradox lies in the **relationships between spaces**. A doorway may initially look identical in both cases; its destination becomes apparent through traversal or distant cues.
- Route-dependent topology must have **deterministic, discoverable rules** (not random area replacement), consistent player orientation and collision, fair exits and return routes, and enough unchanged landmarks for the player to recognize the impossible repetition. It should sometimes reward route choice rather than merely disorient. Its implementation may require explicit logical place/connection identity separate from physical world coordinates; the current coordinate-based streaming system alone does not provide this behavior. This is future design intent, **not authorization to modify the engine now**.
- The player can learn and sometimes exploit these unusual rules. Strange routes can be shortcuts as well as obstacles.
- The school never arbitrarily makes an active scheduled destination unreachable or a timed challenge impossible without warning and a fair way to respond.
- Humor comes partly from institutional normality persisting amid absurdity: a timetable, directional plaque or official notice treats an impossible wing as entirely routine.
- Avoid relying on jump scares, arbitrary randomness or deliberately confusing controls. Mystery and mild unease are welcome; horror is not the primary identity.

## 6. Navigation and information design

- Use coherent, **discoverable room- and building-numbering conventions** as the default. A convention should help players infer locations from the environment; exceptional wings may deliberately have different, learnable rules.
- Signs are integral to gameplay and visual identity. Historic plaques, carved or painted directions, noticeboards and architectural landmarks should guide players without floating developer markers.
- **Technically correct, practically unhelpful signage is part of the school's identity.** A direction may refer to an original entrance, distinguish the north and south entrances of the same department, point along an unnecessarily long permitted route or use a surviving historic name. Such signs must be truthful, verifiable in the world and consistent with the school's history. They can frustrate a rushed player but must never be random falsehoods or bugs disguised as puzzles.
- Players should be able to reason about destinations from first-person clues rather than trying every door or needing prior knowledge of the map.
- Keep rooms, signs, doors and arrival regions tied to the same stable identities, independent of whether an area is currently loaded.
- **Physical traversal hazards belong to navigation, not a separate platform game.** Later shortcuts can require jumping across manageable gaps or over fallen objects. A miss should normally leave the player alive but inconveniently displaced—for example below in a service passage—with a genuine, time-consuming route back. Such hazards must have reliable controls, readable geometry, recoverable outcomes and a meaningful safe alternative. Failure costs time; it does not silently reset the game or create an unavoidable soft-lock.
- Every normal route must be navigable with reliable doors, stairs, floor contact, collision and adequate visual cues. Optional mystery should not be confused with broken wayfinding.
- Important routes and destinations should remain reachable after approved school-state changes. Connectivity and challenge fairness should be testable.

## 7. Experience and progression principles

- The school itself is the main recurring character. Its geography and history should become more interesting over repeated visits.
- Progression should expand the **horizon of navigational knowledge** through increasingly distant or obscure classes, new reasons to visit other wings, and routes learned under pressure—not primarily by locking the world behind discrete stages.
- Begin with **fair, fast wayfinding through an already gloriously overcomplicated building**. Early destinations need only a few trustworthy clues; the player may ignore most of the passages around them. Progress toward route mastery, shortcuts and bureaucratic interpretation, then investigations into numbering, renamed places and misleading history, and only later toward subtle physical or institutional impossibilities. This is a progression in *kinds of thinking*, not just journey length or corridor count.
- Longer time allowances for investigative challenges should create room to interpret environmental clues without abandoning the class deadline. Keep curiosity alive even when stopping to investigate would be risky.
- Offer routes that reward both first-time observation and later mastery. A shortcut discovered early may become important several classes later.
- New areas should broaden the world, not simply increase corridor length. Give each area a recognizable identity, landmarks and connections.
- Plan for repeated timed journeys across multiple classes or school days while leaving the exact day structure, saved discovery state, consequences of lateness and progression rules open for later approval.
- Test the first class with unfamiliar players **in timed mode first**: observe initial urgency, decisions at signs, wrong turns, recovery and whether the deadline feels fair without prior map knowledge. Also observe whether they notice intriguing places they wish to revisit. Test later investigative challenges for reasoning and clue fairness, not just speed.

## 8. Technical and architectural principles

- Implement the school as **connected, independently manageable areas** with stable identities and coherent spatial relationships. Normal neighboring spaces should support continuous movement; eventual impossible connections may use explicit area transitions.
- Separate immutable area definitions, connections, currently active world state and persistent player discovery. A school persists conceptually even when only a subset of its geometry is loaded.
- Keep **game session and schedule state independent of area loading**. Area changes must not reset the clock, destination or player controls.
- Reuse the established `World` / `Level` approach, shared model cache, environmental-object factory, GLB assets, lighting and collision systems. Prefer targeted extensions to parallel systems or wholesale engine changes.
- Assign clear ownership for per-area geometry, collision, doors, signs and lights versus shared assets. Loading, unloading, reloading, retry and failure recovery must be predictable and safe.
- Preserve consistent coordinates, collision continuity and first-person camera orientation across ordinary area boundaries. Preserve logical state such as door pose when an area reloads.
- Build the world from structured data, not hardcoded room-specific game logic. Room, schedule and arrival identities must remain stable when geometry or loading boundaries evolve.
- Scale to a browser through reusable assets, optimized textures, bounded active areas, sensible visibility and lighting costs, and measurements of **cumulative cached assets**, not just visible-scene resources.
- Maintain solid game view and collision/debug view without altering gameplay behavior. Preserve regression tests for movement, camera, doors, stairs, area transitions, arrivals, time boundaries, pause, retry, resource lifecycle and rendering.
- Retain the existing prototype environments as regression baselines. Introduce future systems such as non-player characters and impossible connections only when the preceding world and traversal foundations are sound.
- Follow [AGENTS.md](AGENTS.md) for development conventions and product-owner approval. Implementation sequence and scope belong in [ROADMAP.md](ROADMAP.md), not in this vision.

## 9. Controls and accessibility foundations

- First-person keyboard movement and mouse look must have reliable yaw and pitch, a level horizon and predictable collisions, jumping and gravity.
- Preserve the existing configurable movement/look control layouts, sensitivity, inversion and alternative jump input.
- Doors remain interactable through the established action input. Interaction prompts and signs should be legible and consistent.
- Lighting, environmental detail and difficulty must not conceal essential navigation information or require precision movement to compensate for unclear design.

## Open product decisions

These are intentionally **not yet settled** by the vision:

- How the school day is structured: scheduled classes, possible breaks, and progression between days; whether any player-facing free exploration is appropriate.
- What happens after a missed class, and how class retry differs from restarting a day or continuing the world.
- What is saved between play sessions: discovered areas, shortcuts, changes, timetables and other progress.
- Whether and when the player receives maps, annotations, additional hints or navigation assistance.
- How much of the school is explorable at first, how room numbering varies by building, and how later wings introduce unusual rules.
- The frequency, triggers and story logic of architectural changes and impossible connections.
- How characters, sound, school routines and narrative context enter the experience.
- Exact difficulty progression and deadlines for unfamiliar players, while preserving the demonstrated appeal of tight, unlimited-retry route mastery; how late-game clue solving and investigation fit into timed class challenges.
- Whether traversal hazards become optional shortcuts, required advanced routes, or both; when to first test a recoverable fall.
- How route-dependent impossible connections are introduced, communicated, persisted and reconciled with a single coherent school identity.

**Product principle:** **The player is trying not to be late, not taking a sightseeing tour.** Build a believable, enticing, increasingly surprising school that rewards growing familiarity, while preserving urgent navigation as the core game. Do not let a convenient technical milestone reduce that school to a linear timed corridor; equally, do not turn the opening class into an untimed exploration exercise.

The product owner approves changes to this vision. The development plan, milestone boundaries and acceptance tests are maintained separately in [ROADMAP.md](ROADMAP.md).
