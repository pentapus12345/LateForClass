# Route-dependent impossible room — future gameplay design (not approved for implementation)

**Status:** Long-range design intent for milestone 26. Do not implement in milestone 21.

## The essential illusion

The player walks around a hall by one route and enters a particular room. Later the player takes the hall in the opposite direction and enters **that recognizably identical room**: same architecture, floor dimensions, furniture placement, portraits, windows and local layout. There is no obvious room swap, alternate décor or "floor changed" message. But its exits connect to **different places** depending on the route by which the player arrived. The paradox is in the connections between places, not in the appearance of the room. A player might leave through what seems to be the same door and find a corridor leading to another wing or an apparently different floor, despite no visible change of elevation.

Use M. C. Escher-like impossible topology as an artistic reference, not a literal mandate to replicate a copyrighted picture. The institution treats this as normal.

## Invariants

- Room identity, dimensions, stable local landmarks, object positions and look direction remain recognizable between visits.
- Arrival-route context selects one of **deterministic, authored exit maps**. Random remapping and arbitrary replacement rooms are not acceptable.
- At least one exit's **destination** differs; exit positions in the shared room can remain the same.
- The result must be fair to investigate and learn through clues, institutional paperwork, or repeated observation; not merely surprising once.
- The player must be able to leave, retry and reach any active scheduled target without becoming trapped.
- Continuity must hold through doorway views, lighting, collision, player movement and orientation, entering/exiting/backtracking and area streaming. No visible mesh swaps or pop.
- Ordinary campus geography remains largely stable, so learned routes still matter.

## Future technical questions (do not decide prematurely)

1. Separate a **logical place ID** and a **portal/exit link** from a unique world `(x,y,z)` position. Two logical traversals may share one room template and local coordinates yet resolve exit portals differently.
2. Establish where arrival route context is recorded, when it becomes fixed, and how repeated door traversals / U-turns behave.
3. Determine whether a corridor may be visible through an open doorway before the player crosses, and how geometry is rendered there without inconsistent sightlines.
4. Specify door pose and object-state persistence per logical room vs. per route-context instance.
5. Define route/portal connectivity tests, guarantees against soft-locks, and a minimal proof-of-concept disconnected from the main campus before first in-game deployment.

## Proposed proof of concept, only after later approval

One simple room with two identical approaches in a test fixture. Enter after clockwise traversal: Exit B leads to a normal classroom corridor. Enter after counterclockwise traversal: Exit B leads to an upper-looking gallery. The room looks identical and exits occupy identical local positions. Walk each circuit multiple times, reverse direction, retreat through the entrance, pause/retry, and test seamless appearance, orientation and deterministic state. No need for recursive infinite staircases in the first experiment.

## Relationship to physical hazards

Physical obstacles and recoverable jumps belong to an earlier, separately approved traversal milestone. They preserve ordinary physical geometry; route-dependent impossible topology is a different later mechanic. Avoid conflating the two.
