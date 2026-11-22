# LateForClass product vision

LateForClass is a first-person 3D school navigation game. The player must find the correct classroom before class begins. The main challenge is learning the building, using room-numbering patterns to choose a route, and managing the time available.

## Core gameplay requirements

1. The player receives a class schedule showing the next class, its classroom identifier, and its scheduled start time.
2. The player navigates the school to find that classroom.
3. Classrooms have recognizable identifiers, such as numbers or letters.
4. The building layout and classroom identifiers follow patterns the player can discover and use to navigate.
5. The player identifies and reaches the scheduled classroom before the class start time.
6. The game checks whether the classroom is correct and evaluates whether the arrival was on time.

Walking, mouse look, jumping, gravity, and collisions support this loop. The game challenges the player through spatial navigation, understanding the building, discovering room patterns, and managing time.

## World and navigation requirements

- The navigable school or campus includes interconnected corridors, classrooms, doors, staircases, and multiple floors.
- Players can walk, look around, jump, navigate obstacles, and move between connected spaces.
- Classroom identifiers are visible in the environment. Their relationship to the layout gives players a pattern they can learn and apply.
- Objectives and navigation challenges support finding and reaching the scheduled classroom.
- The game world should eventually feel like a recognizable, visually coherent school rather than an exposed wireframe model. The environment must remain readable from the player's first-person perspective, including with opaque walls.

## Visual presentation and development diagnostics

- The finished game should be visually appealing and coherent, with solid geometry, materials, lighting, and legible environmental details. The final artistic style is not yet selected.
- Support a **game view** for normal play and a **debug view** or overlay for development. Game view presents solid surfaces and navigational cues; debug view makes wireframes and useful collision information visible.
- Both views must derive from the same level definitions. Changing visualization must not change physics, collision shapes, room identity, or gameplay outcomes.
- Maintain readable room signage, doors, stairways, and route cues. Favor clarity, performance, and reliable navigation over decorative complexity.
- Keep dedicated development scenes and wireframe diagnostic capabilities available even after normal gameplay uses solid rendering.
- Establish a simple visual-rendering foundation early, but defer selection of the game's artistic identity and detailed environment dressing until the core gameplay loop can be evaluated.

## Technical and architectural requirements

- Author levels in structured data so geometry and layout can change independently of game code. Define rooms, routes, collision geometry, spawn points, and interaction placements in level data.
- Keep room identity and schedule data explicit so the game can check a destination and deadline reliably.
- Keep render geometry aligned with collision and preserve the tested first-person camera and movement behavior as levels grow.
- Derive solid and debug presentations from shared level data rather than maintaining independent models of the environment.
- Verify rooms, doors, stairs, and objectives in small scenes before combining them into a full school route. Keep development scenes for movement, physics, and interaction testing.
- The current wireframe hallway is a development environment, not the intended final appearance.

## Ideas requiring future approval

- Displaying a countdown alongside the in-game clock or using narrative cues to convey urgency.
- Adding directional signs, maps, route hints, or discoverable shortcuts.
- Adding scoring, retries beyond the prototype restart, or progression across multiple classes.
- Choosing a particular artistic style, color palette, material set, lighting treatment, environmental detail level, or sound direction.

## Open design decisions

- How large is the school or campus, and which room-numbering pattern will it use?
- How should the schedule and time be presented, and how should the clock advance during play or pauses?
- What happens after a late arrival, and should the player be able to continue after the deadline?
- How many classes or challenges are included, and how does difficulty progress?
- How much route choice and navigation assistance should the player have?
- Who is the player, which doors are interactive, and how should those doors behave?
- What visual style, tone, and sound direction fit the game? How much detail best supports navigation without obscuring routes?

The product owner decides these questions and approves changes to this vision. Development milestones and approval status are tracked in [ROADMAP.md](ROADMAP.md).
