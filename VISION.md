# LateForClass product vision

LateForClass is a first-person 3D school-navigation game set in an enormous, historic, increasingly improbable school. The immediate challenge is reaching the correct class before it begins; the longer-term challenge is learning the school, recognizing its patterns, discovering hidden routes, and adapting when familiar parts of the building subtly change. The tone combines believable old-English academic architecture, exploration, dry institutional absurdity, and occasional unease—not primarily horror.

## Core gameplay requirements

1. Each level gives the player a scheduled class, a classroom identifier, and a class start time.
2. The player navigates interconnected school spaces and uses classroom labels and building patterns to find the destination.
3. The player opens doors as necessary and **physically enters the correct classroom**. Merely approaching its door or pressing an arrival button does not count.
4. Entering the correct classroom before class starts automatically wins the level. Entering another room does not.
5. If the class start time is reached before a valid arrival, the player immediately loses the level.
6. After a win or loss, the player can restart the level from its initial state.

Walking, camera control, jumping, gravity, and collisions support this gameplay loop; they are not the primary challenge. Across multiple classes or days, knowledge of the school becomes a form of player progression.

## Time and scheduling

- Each level defines the **starting school time**, **class name**, **class start time**, **destination classroom identifier**, and **time multiplier** in structured level JSON.
- Time is simulated, not taken from the computer's clock. The default multiplier is **60×**: one second of active real time advances school time by one minute; one real minute advances it by one school hour.
- A readable in-game clock shows the current school time. The existing schedule display shows the next class, room, and start time. Both use the same authoritative data and simulated clock.
- The clock advances only during active gameplay; pausing or suspending gameplay freezes simulated time. The deadline must not be bypassed or extended unintentionally by focus or pointer-lock changes.
- Arrival **strictly before** the class start time counts as on time. At the deadline or later is late. The result is final until restart.
- Restart restores the configured time, player spawn, doors, objective, and other level state. Time progression and deadline checks must be independent of frame rate.

## The school: setting and progression

- The school should feel **far larger than the player can initially comprehend**. It evokes an old English university or boarding school: stone quadrangles, gothic or collegiate arches, oak doors, tall windows, timber, worn floors, layered additions, and mismatched wings from different eras.
- It contains places with purposes beyond teaching: libraries, dining halls, cafeteria kitchens, changing rooms and showers, maintenance rooms, utility corridors, service stairs, storage areas, courtyards, and outdoor sports grounds including a football field.
- The player discovers these spaces gradually. Some unusual service routes become useful shortcuts to scheduled destinations; an apparently inconvenient route through a kitchen, showers, or outdoor grounds may prove essential.
- Most of the school is stable and learnable. Some passages, entrances, destinations, or signs can change **infrequently and intentionally**, often between visits or school days. The player should notice that something once familiar is different, while previous knowledge remains valuable.
- Stranger areas may have internally consistent but increasingly absurd rules: unusual room-numbering systems, implausibly large interiors, forgotten departments, and connections that could not fit in a conventional building.
- The absurdity should unfold gradually, contrasted with mundane school bureaucracy and the ever-present class schedule. Favor curiosity, humor, mystery, and mild unease over arbitrary randomness or jump scares.
- Significant layout changes must never silently make the current destination unreachable or cause an unwinnable timed run. Changes should be legible in hindsight, with clues or alternative routes.

## World and navigation

- The school or campus contains connected corridors, classrooms, interactive doors, stairs, multiple floors, basements, outdoor paths, service areas, and varied building wings.
- Classroom identifiers are visible and follow discoverable patterns related to the layout. Players learn and use these patterns to navigate.
- Room boundaries and arrival regions are defined in level data and evaluated in three dimensions: proximity outside the door, or being above or below a classroom, must not count as entry.
- The school must be navigable and understandable from a first-person viewpoint, including when walls are opaque. Room labels and environmental clues should make the numbering system learnable without requiring trial-and-error entry into every classroom.
- The intended challenge is finding a plausible route from in-world information; it should not require the player to know the level in advance or follow a developer-only marker.

## Challenge design and validation

- Difficulty should come primarily from learning the building, understanding its room-numbering pattern, choosing routes, and managing the remaining time—not from obscure clues, hidden hitboxes, or precision movement.
- The time allowance is set per level in JSON and should be balanced against route complexity and realistic player discovery time. The default 60× clock speed is independent of the amount of school time granted for a challenge.
- Before adding substantial progression or complexity, validate a complete navigation challenge with someone unfamiliar with the layout. Observe navigation decisions, wrong turns, sign comprehension, and whether the deadline feels fair; adjust level data and clues accordingly.
- Multiple playable classrooms must have consistent room identities across their signs, doors, spatial arrival regions, and schedule targets. Entering a wrong room does not cause an automatic win.

## World persistence and evolving routes

- The player should be able to revisit recognizable areas across multiple classes or school days; routes learned earlier generally remain useful.
- Persistent discovery includes which areas and passages the player has found, and which world changes have occurred. Specific progression, save behavior, and consequences require separate milestone approval.
- Maintain a distinction between **area definitions** (what spaces exist), **connections** (which doors, stairs, or passages link them), and **school state** (which approved connections or conditions are currently active).
- Impossible spaces may eventually use transitions between areas whose coordinates do not align physically; seamless portals are optional, not a requirement for the initial implementation.
- Changes should normally happen out of sight or between visits, rather than visibly rearranging corridors around the player during a timed run.

## Player controls

- Support first-person keyboard movement and mouse look with reliable yaw, pitch clamping, and zero camera roll.
- Support both WASD-for-movement/arrow-keys-for-looking and the swapped keyboard layout; keyboard looking and mouse looking may be enabled independently.
- Allow mouse sensitivity, vertical inversion, and keyboard look speed to be configured in an Options screen, with locally persisted settings and a restore-defaults action.
- Space is the default jump input, with optional left-click jumping; E is the default interaction input for doors. Mouse motion controls looking, not walking.

## Visual presentation and development diagnostics

- The target art direction is **stylized architectural realism inspired by an old English university**: historic masonry, aged wood, varied architectural eras, rich but restrained materials, and believable proportions. Avoid generic modern-school styling as the final target.
- The building has real window openings with views onto exterior environments and convincing daylight; later levels can let the player walk outside through courtyards and across the football field.
- Some spaces are bright and welcoming, others dim or neglected. Lighting and darkness should build atmosphere while maintaining fair, accessible navigation and legible clues.
- Detailed reusable 3D assets and physically based materials should create convincing spaces. Use optimization and selective detail rather than requiring every object to be highly detailed.
- Moving people, such as students, teachers, and maintenance staff, are a long-term ambition. They are not essential to the first visual-quality benchmark.

- The finished game should be a visually coherent, appealing 3D historic school, not merely a wireframe model. The target atmosphere is established above; detailed asset choices and final execution still require product-owner approval.
- A **game view** provides solid surfaces, lighting, materials, readable classroom labels, and visible routes. A **debug view** or overlay exposes wireframes and useful collision diagnostics.
- Both views derive from the same level geometry and must not change movement, collision, room identity, timing, or outcomes.
- Prioritize spatial readability, signage, and performance over decoration. Retain the hallway and Physics Playground as development and diagnostic environments.
- Preserve earlier visual prototypes as technical baselines; choose specific asset packs, materials, and reference images through separately approved visual-quality milestones.

## Technical and architectural requirements

- Scale the school through coherent **connected areas** rather than assuming every room and outdoor location must remain fully loaded and rendered simultaneously. Area loading/unloading, shared asset caching, visibility management, and resource cleanup should be introduced when justified by measured performance.
- Support outdoor geometry and views through real architectural openings; never use painted-on windows when the level requires a physically traversable or visible outside world.
- Separate stable level/area definitions from temporary school-state variations and persistent player discovery. Keep navigational connectivity testable, including when some links change.
- Reuse the established environmental-object factory, GLB imports, lighting system, and collision/debug tools; expand them instead of introducing parallel render or object systems.
- Plan for animation and character navigation later, but do not add crowd simulation or non-player-character behavior before the environment and traversal systems are solid.

- Define levels using structured data, separating room layout, walls, doors, stairs, player spawn, collision/arrival volumes, schedule, and timing from the game code.
- Use the scheduled room identifier to determine the valid arrival area; avoid hardcoded room coordinates or identifiers in the game controller.
- Keep visual and collision geometry aligned and ensure both game and debug presentations use the same definitions.
- Maintain clear responsibilities for Game (coordination and rendering), GameSession (run state, scheduling and outcomes, composing SchoolClock), GameUI (interface), Player (input, motion, physics), Level (world definitions and spatial queries), and the existing geometry, furniture and lighting modules.
- Preserve regression coverage for camera orientation, movement, doors, stairs, room entry, time boundaries, win/loss states, pause, and restart. Verify small test scenes before expanding to larger buildings.
- Follow [AGENTS.md](AGENTS.md) for development conventions and milestone approval.

## Ideas requiring future approval

- An explicit countdown, warning sounds, or narrative cues to increase urgency.
- Directional signs, maps, navigation hints, optional shortcuts, or assistance systems.
- Scoring, difficulty modes, multi-class schedules, progression, and broader restart systems.
- Specific model packs, materials, architectural variants, sound design, and environmental storytelling treatments within the historic-school direction.

## Open design decisions

- How much of the school should exist in the initial playable chapter, and how will numbering work in unusual wings?
- How should the time display and schedule be visually integrated, and should there also be a countdown?
- How should level difficulty increase, including the initial time allowance, complexity of routes, and the balance between exploration and time pressure?
- What should win and loss screens say or show, and what happens narratively when the player is late?
- How much route choice and navigational assistance should be available?
- Who is the player, which doors are interactive, and how should those doors behave in later levels?
- Which visual references best define the historic-school look, and how stylized or realistic should the final execution be?
- How frequently should the school change, what triggers changes, and what clues make them fair?
- When should service spaces, outdoor routes, and other people first appear?

The product owner controls this vision and approves changes to it. Progress and proposals are tracked in [ROADMAP.md](ROADMAP.md).
