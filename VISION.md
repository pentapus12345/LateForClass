# LateForClass product vision

LateForClass is a first-person 3D school-navigation game. The player must find the correct classroom before class begins. The challenge is learning the building, discovering room-numbering patterns, choosing a route, and managing limited time.

## Core gameplay requirements

1. Each level gives the player a scheduled class, a classroom identifier, and a class start time.
2. The player navigates interconnected school spaces and uses classroom labels and building patterns to find the destination.
3. The player opens doors as necessary and **physically enters the correct classroom**. Merely approaching its door or pressing an arrival button does not count.
4. Entering the correct classroom before class starts automatically wins the level. Entering another room does not.
5. If the class start time is reached before a valid arrival, the player immediately loses the level.
6. After a win or loss, the player can restart the level from its initial state.

Walking, camera control, jumping, gravity, and collisions support this gameplay loop; they are not the primary challenge.

## Time and scheduling

- Each level defines the **starting school time**, **class name**, **class start time**, **destination classroom identifier**, and **time multiplier** in structured level JSON.
- Time is simulated, not taken from the computer's clock. The default multiplier is **60×**: one second of active real time advances school time by one minute; one real minute advances it by one school hour.
- A readable in-game clock shows the current school time. The existing schedule display shows the next class, room, and start time. Both use the same authoritative data and simulated clock.
- The clock advances only during active gameplay; pausing or suspending gameplay freezes simulated time. The deadline must not be bypassed or extended unintentionally by focus or pointer-lock changes.
- Arrival **strictly before** the class start time counts as on time. At the deadline or later is late. The result is final until restart.
- Restart restores the configured time, player spawn, doors, objective, and other level state. Time progression and deadline checks must be independent of frame rate.

## World and navigation

- The school or campus contains connected corridors, classrooms, interactive doors, stairs, and multiple floors.
- Classroom identifiers are visible and follow discoverable patterns related to the layout. Players learn and use these patterns to navigate.
- Room boundaries and arrival regions are defined in level data and evaluated in three dimensions: proximity outside the door, or being above or below a classroom, must not count as entry.
- The school must be navigable and understandable from a first-person viewpoint, including when walls are opaque. Room labels and environmental clues should make the numbering system learnable without requiring trial-and-error entry into every classroom.
- The intended challenge is finding a plausible route from in-world information; it should not require the player to know the level in advance or follow a developer-only marker.

## Challenge design and validation

- Difficulty should come primarily from learning the building, understanding its room-numbering pattern, choosing routes, and managing the remaining time—not from obscure clues, hidden hitboxes, or precision movement.
- The time allowance is set per level in JSON and should be balanced against route complexity and realistic player discovery time. The default 60× clock speed is independent of the amount of school time granted for a challenge.
- Before adding substantial progression or complexity, validate a complete navigation challenge with someone unfamiliar with the layout. Observe navigation decisions, wrong turns, sign comprehension, and whether the deadline feels fair; adjust level data and clues accordingly.
- Multiple playable classrooms must have consistent room identities across their signs, doors, spatial arrival regions, and schedule targets. Entering a wrong room does not cause an automatic win.

## Player controls

- Support first-person keyboard movement and mouse look with reliable yaw, pitch clamping, and zero camera roll.
- Support both WASD-for-movement/arrow-keys-for-looking and the swapped keyboard layout; keyboard looking and mouse looking may be enabled independently.
- Allow mouse sensitivity, vertical inversion, and keyboard look speed to be configured in an Options screen, with locally persisted settings and a restore-defaults action.
- Space is the default jump input, with optional left-click jumping; E is the default interaction input for doors. Mouse motion controls looking, not walking.

## Visual presentation and development diagnostics

- The finished game should be a visually coherent, appealing 3D school, not merely a wireframe model. The final artistic style is not yet selected.
- A **game view** provides solid surfaces, lighting, materials, readable classroom labels, and visible routes. A **debug view** or overlay exposes wireframes and useful collision diagnostics.
- Both views derive from the same level geometry and must not change movement, collision, room identity, timing, or outcomes.
- Prioritize spatial readability, signage, and performance over decoration. Retain the hallway and Physics Playground as development and diagnostic environments.
- Establish solid rendering early; make the final artistic-direction decision after the complete gameplay loop is playable.

## Technical and architectural requirements

- Define levels using structured data, separating room layout, walls, doors, stairs, player spawn, collision/arrival volumes, schedule, and timing from the game code.
- Use the scheduled room identifier to determine the valid arrival area; avoid hardcoded room coordinates or identifiers in the game controller.
- Keep visual and collision geometry aligned and ensure both game and debug presentations use the same definitions.
- Maintain clear responsibilities for Game (lifecycle, clock, outcomes), Player (input, motion, physics), Level (level definitions, room and collision queries), and Wall (wall geometry and associated bounds).
- Preserve regression coverage for camera orientation, movement, doors, stairs, room entry, time boundaries, win/loss states, pause, and restart. Verify small test scenes before expanding to larger buildings.
- Follow [AGENTS.md](AGENTS.md) for development conventions and milestone approval.

## Ideas requiring future approval

- An explicit countdown, warning sounds, or narrative cues to increase urgency.
- Directional signs, maps, navigation hints, optional shortcuts, or assistance systems.
- Scoring, difficulty modes, multi-class schedules, progression, and broader restart systems.
- A specific art style, color palette, materials, furniture, sound direction, or environmental storytelling.

## Open design decisions

- How large should the school become, and what classroom-numbering system will it use?
- How should the time display and schedule be visually integrated, and should there also be a countdown?
- How should level difficulty increase, including the initial time allowance, complexity of routes, and the balance between exploration and time pressure?
- What should win and loss screens say or show, and what happens narratively when the player is late?
- How much route choice and navigational assistance should be available?
- Who is the player, which doors are interactive, and how should those doors behave in later levels?
- What visual and audio identity suits the game?

The product owner controls this vision and approves changes to it. Progress and proposals are tracked in [ROADMAP.md](ROADMAP.md).
