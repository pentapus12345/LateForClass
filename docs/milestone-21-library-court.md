# Milestone 21 — Library Court and the North Teaching Range

**Status:** Design approved. Stage 1 is playable and awaiting product-owner review. The Latin deadline and streaming regions are provisional. The as-built plan, play links and measured results follow the design record.

I propose adding **one mostly ground-floor district east and north of First Court**, entered through the end of East Range just beyond the Map Store. An older college library occupies the west side of a small enclosed court. A later teaching range closes its north side. A covered book passage runs around the other two sides, so someone carrying volumes between the library, classrooms and binding room can stay under cover.

That history gives the layout a reason to exist and gives the player a choice. On the first journey, the library is the easiest landmark to follow. On the return, the book passage is a useful way back to East Range. The proposed scope is **three new streaming areas, eight numbered rooms, three schedulable classrooms, one selectable new timed class, and an optional physically accessible library gallery**. The gallery belongs to Room 33; it is not a ninth numbered room or a new streaming area. All three existing First Court areas remain part of the same school. This follows the planning gate in the updated [roadmap](../ROADMAP.md#21-expand-the-connected-school--library-court-and-the-north-teaching-range) and [product vision](../VISION.md).

## Floor plan

North is up, east is right, and coordinates are approximate world metres `(X, Z)` with the walking surface at `Y = 0`. Lines show walkable routes. The court itself is visible through windows and the covered walk. Its lawn has no public entrance in this proposal; the optional *interior* library gallery provides the first physically accessible exploratory diversion. Dashed future routes are reservations, **not** current passages or doors.

```
                                  NORTH ↑
                       [future extension, not built]
                                    ⋮
                             North Schools lobby
                             42 Latin │ 43 Greek
                                      │
               41 History             T (63,72)
                    │                 │
      (48,72) NW ───┴─────────────────┴────────────── NE (78,72)
               │                                       │
    33 Old     ├── projecting library window            │ 44 Map Room
    Library    │   reachable interior upper gallery     ├── public collection
    + stair    │          LIBRARY COURT                 │
               │           enclosed lawn                │
    32         ├──                                      ├── 45 Binding Room
    Catalogue  │                                       │
      (48,50) SW ───── covered book passage ───────── SE (78,50)
               │             (future south route reserved, not built)
    31 Book    ├── issue counter and returns
    Office     │
               │ entrance northward
               └───── stone arch (42,35)
                                  │
                              First Court
        West Cloister ────── East Range ── beyond Rooms 25 and 26
                 ╲             ╱
                  Reception — Scholars’ Passage
```


The last two lines show the existing approaches schematically. **The proposed opening is in the solid `East Range end` wall at `(42,35)`**, straight ahead for someone walking east down the hall. Room 26 stays on the north wall at `(39.5,38)`, with its staff door and store volume intact. The new passage runs about 6 m east before turning north. It clears the store and keeps a player at Room 25 from seeing a whole new district down the corridor. This single aperture, its fitted finish and the directions needed to find it are the only proposed *functional* changes inside First Court. Cutting the existing solid end wall must preserve its remaining structural jambs/lintel, collision ownership and the fitted offline visual finish. The current finish builders include explicitly authored East Range wall paths: update or verify those together with the source wall and regenerate the affected GLB rather than leaving the old solid wall visually or physically across the new opening. Both original routes to Mathematics, the stair and its tower view retain their roles. [First Court school definition](../assets/schools/first-court.json) · [Existing layout](milestone-20-new-school.md)

The new loop measures about **30 × 22 m between passage centrelines**, or 104 m around. Allow roughly **48 × 55 m** for the district including rooms, entrance and north lobby. The library gallery and north range are about 3 m wide, the book passage about 2.6 m. The lobby widens to about 4 m so a player can turn, read both plaques and open either door. Ground-level circulation makes signs, route choice and recognition carry the difficulty.

## Rooms and public numbers

First Court already numbers rooms along historic approaches. A walk past the lodge leads through 12–15, while the cloister and East Range share 24–26 across an area boundary. Library Court extends that convention. **31–33 ascend from the Book Office toward the Old Library. 41–45 follow the teaching range from its library end, taking in the paired language rooms before turning down the east side.** Someone entering by the book passage encounters 45 first and can infer which way leads toward 42. The decades name local runs of rooms. All eight public room entrances are on the same ground floor; Room 33 alone has an optional internal upper gallery. [First Court numbering decision](milestone-20-new-school.md)

| Plaque | Room               | Approx. interior | Access and purpose                                                                                                           |
| ------ | ------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 31     | Book Office        | 5 × 4 m          | Enterable public returns bay at the entrance. The counter gives the fork an immediately recognizable purpose.                |
| 32     | Catalogue Room     | 5 × 6 m          | Enterable reference room off the west gallery. A plausible first wrong turn for someone who follows “Library” too literally. |
| 33     | Old Library        | 8 × 10 m         | Enterable reading room and a short, **public stair to a small internal upper gallery**. A glimpse of the gallery and projecting window invites a detour; it offers a fresh view of the court but no mandatory clue or shortcut.                    |
| 41     | History Schoolroom | 7 × 8 m          | Schedulable classroom near the west end of the north range. Its plaque confirms the change to the 40s.                       |
| 42     | Latin Schoolroom   | 7 × 8 m          | Schedulable classroom on the west side of the north lobby. First expanded destination.                                       |
| 43     | Greek Schoolroom   | 7 × 8 m          | Schedulable classroom opposite Latin. Both entrances are visible from the lobby.                                             |
| 44     | Map Room           | 6 × 7 m          | Enterable teaching collection off the east walk. Distinct from the small staff Map Store in First Court.                     |
| 45     | Binding Room       | 5 × 6 m          | Staff workshop with a signed closed door. The public passage continues past it in both directions.                           |

Each room gets a school-wide stable ID and a separate public number. For example, the Latin schedule would target `north-latin`, with `42` resolved for the timetable and plaque. Its working door and arrival bounds belong to the same area. That preserves the existing ability to identify a destination before its meshes are resident. [School registry](../js/SchoolDefinition.js) · [Connected-school spatial contract](connected-school-architecture.md)

## Accessible discovery: the Old Library gallery

**Purpose:** The player should want to visit somewhere that is **not on the route to Latin**. Room 33 therefore includes a genuinely traversable, optional interior gallery. From the west walk, its open doorway or internal glazing reveals tall shelves, a small stair and a higher balustrade. Once inside, the player can climb one ordinary stair flight to an upper reading/viewing gallery and return by the same stairs. A view from the higher window links the Old Library to the court-facing window seen on the east walk.

- The gallery is **inside Room 33** and belongs to the Library Gallery streaming area. It has no separate public room number, no locked door, no key, no prize and no scheduled objective in milestone 21.
- The upper walking surface should sit at a plausible height (initial target approximately 2.2–2.6 m), with proper floor, stair, headroom, balustrade and collision. Exact placement requires a dimensioned blockout; use the existing `Player` stair/vertical collision system.
- Its entrance, route and upward view must actually be visible to a walking player. A decorative mezzanine that cannot be reached does **not** meet this requirement.
- The detour should consume meaningful seconds and tempt the player without being necessary for the short Latin trial. It should not disguise the correct direction or require a development-only teleport.
- Keep it development-quality, using existing furniture and historic materials. If the interior geometry cannot fit credibly within the proposed 8 × 10 m footprint, adjust the footprint and courtyard setback **at the planning/blockout gate**, rather than silently shrinking the room or dropping the experience.

The next district may contain other incidental curiosities, but this is the only exploratory showpiece required now. Further furnishings in **Scholars’ Passage** remain deferred visual debt under milestone 20; this expansion must not turn into another open-ended corridor-decoration project.

## The first expanded class

**Latin · Room 42 · 10:00.** Start at the established reception position at **09:05**, giving **55 seconds of active play at 60×**. Offer Mathematics and Latin as independently selectable, **data-defined challenges on the same campus**—not as duplicate `level=4` school manifests or disconnected levels. Mathematics keeps its 08:15 start, 09:00 deadline and Room 25 destination. Starting both journeys at reception lets knowledge earned in the first class pay off in the second.

**Small required software change:** Today `Game.init` reads one `manifest.challenge`, and `schoolFromManifest` validates that one scheduled destination. For this trial, define a small named challenge collection or equivalent configuration with **Mathematics as the unchanged default** and **Latin as an explicit opt-in** (for example, `?level=4&challenge=latin`). Resolve the selected challenge *before* session creation and validate its destination against the unchanged school-wide room registry. Invalid names must fail safely or choose a clearly documented default. Keep `?level=4` for the established Mathematics opening and `?level=4&mode=explore` for developer exploration; no automatic class progression, saved state or separate world copy. Scope and tests for this selector belong to milestone 21's playable-blockout stage.

| Decision               | What the player can see and infer                                                                                                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reception**          | Add *Library Court via East Range* to the existing direction board. Someone who remembers the cloister and tower can use them immediately. Someone who chooses Scholars’ Passage can still follow its East Range sign and recover without retracing the whole passage.                                           |
| **Past Mathematics**   | A fingerboard at the lookout stair reads *Library Court · Rooms 31–45* and points past 26. The new arch is visible beyond the Map Store. The familiar stair is a tempting diversion with a recognizable way back down.                                                                                           |
| **At the Book Office** | Straight ahead, *Old Library · North Schools 41–43*. Right, *Book Passage · 44–45*. The first is the shorter route to Latin. The second leads to real rooms and rejoins the teaching range. At 44, a return-facing sign points onward to *North Schools 41–43*.                                                  |
| **In the north range** | At the middle junction, a board over the recessed lobby reads *Language Schools · 42–43*, legible from either approach. Straight ahead continues around the court. Turning into the lobby reveals *42 Latin* and *43 Greek*. Only physically entering 42 through its open door before 10:00 completes the class. |

The proposed centrelines, not yet proven in a playable blockout, put the cloister–library route at roughly **170–180 m from spawn to the Latin threshold**. Taking the east side of Library Court adds about **30 m**, or five seconds at the configured 6 m/s. That gives a movement-only lower bound of roughly **29–30 seconds direct or 34–35 seconds around the east side**. The rest of the proposed 55 seconds pays for reading at several junctions, turning, opening the door and correcting a modest mistake. A player can afford to enter History, recognize 41 and move on. Someone who walks past the language lobby can keep going all the way back to First Court and lose the class on time. [Movement configuration](../assets/gameConfig.js) · [Existing timed-route evidence](first-court-blockout.md)

**55 seconds is a blockout hypothesis, not a locked difficulty target.** An unfamiliar player should attempt Latin timed first, without seeing this plan or using explore mode. Record the clue used at the Book Office, whether the language lobby was visible from their approach, the wrong turn and recovery, and time remaining or timeout location. If they miss the lobby because the board is invisible from the east, correct the sightline first. If they read the route correctly, make one short recovery and still routinely arrive late, revise the allowance. An unfamiliar player must not be expected to discover or use the optional library gallery to finish the class; it is a temptation, not a dependency.

## Architectural identity and reuse

| Area                     | Character and landmark                                                                                                                                                                                                                                 | Finish reuse                                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Library Gallery**      | A former private library range adapted for school use. A low stone entrance opens onto the issue counter, then a taller oak-lined gallery leads to the projecting reading-room window. The Old Library contains a **reachable internal upper gallery** and a real stair, visible enough to invite a detour. The same upper window is recognizable across the court on the return walk. | Use the approved limewash, recessed oak field and 1.065 m cap. Carry the profile continuously through the gallery and return it into the door reveals. A runner belongs on the dry gallery boards and ends at the stone thresholds. Reuse shelves, books, reading tables and chairs. |
| **North Teaching Range** | A later, more regular range. Broad plaster bays and repeated timber ties give the corridor a clear rhythm. The paired Latin and Greek doors share a deeper transverse opening that makes the lobby recognizable from either direction.                 | Reuse masonry heads, oak doors, brass plaques, boards, desks and chairs from the catalog. Fit the ties to whole bays. Put the strongest detail at the lobby junction and keep classroom dressing economical.                                                                         |
| **Book Passage**         | A workaday covered walk linking the teaching collection and bindery. Flagstones, plain limewashed masonry and repeated court-facing openings distinguish it from both the oak gallery and First Court’s vaulted cloister.                              | Reuse stone, threshold and lantern assets. Keep the damp-side paving bare. The return view of the library window supplies orientation without another tower or an additional landmark model.                                                                                         |

The expansion gives the approved finish pilot a concrete test. The Library Gallery needs the same wall-face lookup, oak profile and opening fit as Scholars’ Passage, over different wall runs. **At dressing time, a small neutral offline module is justified if the first gallery bay would otherwise duplicate those functions or its builder would need to import the Scholars’ Passage builder solely to obtain them.** Move only the demonstrated shared preset and helpers. Keep the library window junction, runner lengths, stone stops and tie spacing explicitly authored. Verify the extraction by rebuilding the two pilot GLBs byte-identically and by moving a new gallery opening in a temporary definition. The walkable blockout needs no extraction. [Approved finish pilot](first-court-visual-spec.md#offline-finish-preset) · [Current preset and builders](../scripts/build_scholars_passage.py)

## Area boundaries, streaming and performance

The three-area split gives each pair **one shared aperture**, which the current manifest adapter supports. The library owns the entrance, west walk, court-facing library window and rooms 31–33. North Teaching owns the north walk, lobby and rooms 41–43. Book Passage owns the south and east walks, court ground and rooms 44–45. [Connection validation](../js/SchoolDefinition.js)

| Shared threshold                 | Approx. centre | Owner of aperture, reveal and threshold                                                                                  |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| East Range ↔ Library Gallery     | `(42,35)`      | East Range, including the cut through its end-wall panelling. Library Gallery begins with a flush slab on the east face. |
| Library Gallery ↔ North Teaching | `(48,68)`      | Library Gallery, at the stone return just before the northwest turn.                                                     |
| Library Gallery ↔ Book Passage   | `(54,50)`      | Library Gallery, at the sheltered opening east of the issue counter.                                                     |
| Book Passage ↔ North Teaching    | `(78,68)`      | Book Passage, at the last covered bay before the northeast turn.                                                         |

Keep **the existing manifest's initial active-area selection unchanged** for the original Mathematics challenge; do not unconditionally preload the new district at startup. Approach East Range as today, then request the library before the end arch comes into view. The three new areas may need to coexist at the court. In particular, the projecting library window must remain visible from the east walk, and the court ground must already be present when first seen from the library. Required regions must cover those views in both directions, including jumps and rapid reversals. The number of active areas and the exact prefetch distances should follow the approved walkable blockout. World already supports overlapping required regions and delayed retirement. Cached templates survive area unloading, so a low active-area count alone establishes little about memory. [World residency](../js/World.js) · [Asset lifetime decision](connected-school-architecture.md)

For the blockout and integration reviews, carry forward these **provisional performance targets** on the established 1080p Chrome profile:

| Measure              | Proposed target                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cold startup         | ≤8 MiB and median Start enabled ≤7 s at 25 Mbit/s, 40 ms latency. The finish-pass high sample left only **15,903 B** of startup headroom. Measure the expanded manifest separately and defer detailed district data if needed.    |
| First complete visit | ≤16 MiB transferred and ≤256 MiB estimated decoded assets, including unique templates retained after visiting every room.                                                                                                         |
| Traversal            | Route p95 frame interval ≤16.7 ms, maximum frame near activation ≤50 ms, zero visible missing areas or ordinary-play loading holds.                                                                                               |
| Repeat traversal     | Ten loops in alternating directions. Check retained assets after warm-up, lights, both door swings, collision across seams and retry. Inject a delayed or failed load and verify that the hold preserves position and class time. |

These targets have prior First Court measurements. The proposed district has estimates only. The integration gate should include Node and Chrome regressions for both classes, both routes to Latin, exact-deadline arrival and the original Mathematics journey, plus matched standing and jumping views across the court. [Finish-pass benchmark](first-court-visual-spec.md#12-architectural-finish-consistency-pass)

## Future connectivity, not a chain of wings

One entrance from First Court is sufficient **for this milestone**, because Library Court has a complete internal loop and destinations on both sides. It would be a mistake, however, to assume that every future wing must extend from the far end of the previous one. Reserve three *different kinds* of connections in the plan:

1. **North extension:** the lobby beyond Rooms 42/43 can later lead into a larger North Schools or lecture range. Today it terminates with a normal, finished architectural bay, not a pretend working door.
2. **East extension:** the book passage near the binding room/Map Room can eventually join a service or academic route continuing east. Keep room thresholds and wall ownership compatible with cutting a later opening.
3. **Potential cross-campus return:** leave space south of the book passage (provisionally near the middle of the south walk, around `X ≈ 64, Z ≈ 50`) for a *later, separate route* towards another court or school ground that could connect back to a **different** part of First Court or another existing district. This is a corridor reservation and a future adjacency objective, **not** a guaranteed direct connection at these exact coordinates: survey the intervening buildings, existing First Court walls, room bounds and streaming regions before approving any aperture.

At least one future expansion should connect **two existing districts** to create another traversable loop, not merely append a dead-end branch. Preserve outward-facing scenery, setbacks and plausible wall bays so those choices remain possible. Do not model locked doors or traversable-looking passages that lead into unloaded/unbuilt space. The small Library Court grass court itself remains visible but not publicly enterable in milestone 21; playable grounds belong to a later milestone.

## Review gates and approval decision

1. **Design gate (this file):** approve or revise the geographic layout, eight room identities, optional Library gallery, one new entrance, reserved cross-campus connection options, first Latin trial and proposed area ownership. Coordinates remain approximate until a collision-ready blockout. **No code changes at this gate.**
2. **Playable blockout:** keep the existing First Court intact except for the approved East Range aperture and wayfinding. Implement three simple new areas, the full court loop, working classroom doors, readable plaques, a traversable library stair/gallery and a minimal Latin/Mathematics challenge selector. Verify the player's reachable routes, optional detour, no false dead ends and both independent timed classes. **Owner walks the timed route first, then exploration. Stop for approval before dressing or tuning streaming.**
3. **Streaming integration:** author connection/required/approach regions from measured geometry, verify movement and visibility across all new seams, rapid reversals, loaded/unloaded court views, recovery and actual cache resource costs. **Stop for review.**
4. **Selective architectural finishing:** use the proven offline shared finish preset where appropriate, fit the new physical connections and gallery, furnish decision-point landmarks, and prove corridor-long finish consistency. Do not expand into comprehensive First Court redecoration. **Stop for milestone acceptance.**

**Outstanding validation:** First Court's unfamiliar-player timing test remains open. For Latin, compare measured novice behavior with the proposed 55-second allowance. Test from both sides of the library loop and include deliberate wrong turns; no automated route timing should be described as first-time fairness evidence. Carry forward any explicitly acknowledged legacy startup-budget exception without silently changing the benchmark.

**Design decision:** The product owner approved the three-area blockout, single East Range connection, eight rooms, accessible Old Library gallery and future connection reservations, with a provisional 55-second Latin test.

## Stage 1 walkable blockout

Play [Latin · Room 42](http://localhost:8090/?level=4&challenge=latin) timed first. The session starts at 09:05 and is due at 10:00. [Mathematics · Room 25](http://localhost:8090/?level=4) is the default, and unknown challenge names select that default. [Developer exploration](http://localhost:8090/?level=4&mode=explore) disables the timetable. The links use the local development server on port 8090.

![As-built floor plan with area boundaries, rooms, courtyard loop and optional library gallery](references/library-court-blockout/floor-plan.svg)

The loop is 30 × 22 m along its centrelines. The existing East Range owns the fitted arch at `(42, 35)`. The passage floor starts at the seam, runs to `X = 48`, and turns toward the Book Office junction at `(48, 50)`. Room 33 has an 8 × 10 m footprint, a 12-tread stair and a gallery at `Y = 2.4 m`. The projecting bay and the high court window align across the west walk. The east walk also sees the existing First Court tower over the roofs.

| Seam or reservation | As built |
| --- | --- |
| East Range ↔ Library Gallery | East Range owns the fitted 1.8 m pointed opening. The library owns the floor beyond the join. |
| Library Gallery ↔ North Teaching | West walk at `Z = 68`, south of the northwest turn. |
| Library Gallery ↔ Book Passage | South walk at `X = 54`, east of the Book Office junction. |
| Book Passage ↔ North Teaching | East walk at `Z = 68`, south of the northeast turn. |
| Future connections | Glazed bays terminate the north lobby at `(63, 81.5)`, book passage at `(79.3, 50.35)`, and south walk at `(64, 48.7)`. The courtyard is visible from its perimeter. |

The three district definitions and both challenges share the First Court manifest. The original two areas still start first. During play, the Library Gallery prefetches from the approaches to East Range. The other two district areas overlap along the courtyard for sightlines. West Cloister owns the tower and East Range owns the adjacent roof on that skyline, so both stay resident in the applicable court regions. The blockout uses the existing area lifecycle and ordinary platform, door and sign data. The East Range interiors export was rebuilt to join the existing plaster and oak to the new aperture.

### First-person review

| Location | View |
| --- | --- |
| First Court connection | [East Range arch](references/library-court-blockout/east-range-opening.jpg) |
| First route choice | [Book Office fork](references/library-court-blockout/book-office-fork.jpg) |
| Old Library detour | [Stair glimpsed from the west walk](references/library-court-blockout/library-window-from-walk.jpg) · [Stair and gallery](references/library-court-blockout/library-stair.jpg) · [Upper view across the court](references/library-court-blockout/gallery-view.jpg) |
| Return landmark | [Projecting library window from the east walk](references/library-court-blockout/east-walk-landmark.jpg) |
| Latin approaches | [From the west](references/library-court-blockout/languages-west.jpg) · [From the east](references/library-court-blockout/languages-east.jpg) · [Language lobby](references/library-court-blockout/language-lobby.jpg) |
| Longer route | [Covered Book Passage](references/library-court-blockout/book-passage.jpg) |

### Verification

All **126 Node tests** and **98 shared Chrome tests** passed. [Test instructions](../tests/README.md)

In the desktop Chrome walkthrough, Mathematics arrived at **08:30**. Latin arrived at **09:33** by the west walk and **09:39** by Book Passage after entering the Map Room and recovering. The scripted west route is approximately 172 m from reception to inside Latin. The long route adds roughly 30 m before the detour. The trials used the normal movement, door and clock controls. The times show that both routes are viable. The 55-second allowance still needs an unfamiliar player's timed-first attempt.

The exploration walkthrough entered all seven public rooms in the extension, checked the staff door, climbed and descended the Old Library gallery, returned around the court and through East Range, observed all three district areas retire, and restarted at reception. The shared regression walked ten alternating loops, checked Latin's door swing after retirement, and compared retained templates, scene objects, colliders and light fixtures. The Node boot test covered challenge fallback, the exact Latin deadline and retry. Chrome compared 30 standing- and jump-height renders at selected viewpoints against the full scene. All 30 matched with the blockout's residency rules.

### Measured performance

Chrome 158, ANGLE Metal on Apple M5 Pro, 1920 × 1080 at device pixel ratio 1. Four cache-disabled starts used 25 Mbit/s and 40 ms latency. The browser was unthrottled after Start enabled. Transfer counts encoded resource bodies including the HTML navigation. Decoded estimates count unique geometry buffers and texture images with mip levels across live objects and cached templates.

| Measure | Stage 1 result | Review target |
| --- | ---: | ---: |
| Cold startup transfer | 8,313,955–8,314,290 B | ≤8 MiB |
| Median Start enabled | 3.08 s | ≤7 s |
| First complete visit transfer | 8,313,955 B, all received at startup | ≤16 MiB |
| Largest sampled decoded asset total | 61.76 MiB in the gallery | ≤256 MiB |
| Active traversal p95 frame interval | 9.8–10.1 ms across four runs | ≤16.7 ms |
| Longest frame within 1 s of activation | 41.6 ms | ≤50 ms |
| Longest request to activation | 14.2 ms | Six-area blockout baseline |
| Holds during ordinary play | 0 | 0 |

The manifest contributed 112,981 B. At most five of the six areas were active in the measured routes. The gallery and post-retirement samples both retained 18 cached GLB templates. The detailed visibility and slow-load survey remains the streaming integration review gate.
