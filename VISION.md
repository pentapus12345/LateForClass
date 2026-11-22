# LateForClass product vision

LateForClass is a first-person 3D game set in a navigable school or campus. The long-term experience is to find and reach a classroom by moving through interconnected spaces. Being late to class is the core premise.

## Confirmed requirements

- The school or campus includes corridors, classrooms, doors, stairs, and multiple floors.
- Players can walk, look around, jump, navigate obstacles, and move between connected spaces.
- Levels are authored in structured data so geometry and layout can change independently of game code.
- The game eventually includes objectives and navigation challenges tied to getting to class.
- The current wireframe hallway is a development environment. The final visual direction remains open.


## Long-term technical goals

- Define rooms, routes, collision geometry, spawn points, and interaction placements in level data.
- Keep rendering aligned with collision geometry and preserve the tested first-person camera and movement behavior as the levels grow.
- Make connected spaces, doors, stairs, and objectives independently testable in small scenes before combining them into a full school route.
- Retain development scenes that make movement, physics, and interactions easy to verify.


## Gameplay ideas requiring approval

- A countdown, a lateness window, or narrative urgency as different ways to convey being late.
- Signs, maps, route hints, or discoverable shortcuts as ways to help players navigate.
- Scoring, retries beyond the current prototype restart, or progression across multiple objectives.
- A final art style, lighting approach, and sound direction.
- Eventually the rooms will be labled with numbers or characters, and figuring out the pattern will be part of the challenge
- The player will see a "schedule" in a side panel, which shows what class he has next at what time and in what room, he will have to find it before the clock reaches class time.

## Open design questions

- Is the first playable setting one school building or part of a larger campus?
- Who is the player, and what happens if they arrive late?
- How much route choice and navigation assistance should the player have?
- How should doors behave, and which should be interactive?
- What tone should the final environment, visuals, and audio convey?

The product owner decides the answers and approves changes to this vision. Development milestones and their approval status are tracked in [ROADMAP.md](ROADMAP.md).
