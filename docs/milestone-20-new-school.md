# Milestone 20 proposal — First Court

**Status — streaming implemented and ready for review.** The product owner approved the seven-room geography after playing both the timed challenge and developer exploration. The implementation follows that layout and uses the same tower at both overlooks. First Court remains the fourth development environment, with the timed challenge as its ordinary entry. [Playable blockout](first-court-blockout.md) · [Product vision](../VISION.md) · [Streaming evidence](#8-streaming-stage-implementation-and-evidence)

## 1. Long-term campus idea — flexible, not a locked master map

Imagine a centuries-old institution expanded in layers. An early gatehouse and stone court gained a grand reception hall; academic ranges, covered walks, libraries and dining facilities were added in different eras. Building levels and axes don't always align conveniently. You can often see more school than you can currently reach. Eventually, the institution has believable connections among kitchens, dining rooms, deliveries, maintenance tunnels, bathrooms/showers, sports grounds, offices and old departments. Further along, familiar links occasionally shift and still stranger wings emerge.

```text
Conceptual relationships only — NOT surveyed coordinates or committed build order

            Older library / archives       Upper teaching galleries
                  |                              |
    Dining hall -- north cloister -- First Court -- academic ranges -- labs
        |                 |             |               |
  servery/kitchen    WEST CLOISTER   EAST RANGE       later courts
        |                 |             |               |
    deliveries       ENTRANCE HALL   garden route    sports / changing
        |                 |                             |
   maintenance       gatehouse / arrival court    showers / playing field
```

Future facilities and routes remain **ideas**. Their placement, actual entrances and geometry must be approved in later milestones. The first implementation must reserve plausible expansion directions without committing to fixed long-distance coordinates or creating a chain of inaccessible, obviously artificial blocked doors. The eventual school should have loops, shortcuts, meaningful junctions and areas with different purposes, not be modeled exclusively as a route to a scheduled class.

## 2. First Court floor plan and room schedule

Seven numbered doors give the two approaches different purposes. Pupils heading past the porter and bursar reach the old schoolroom and reading room. Pupils taking the covered walk can leave their coats before reaching the teaching range. The later enclosed passage lets people move between those parts of the school in bad weather. Both routes lead to Mathematics.

```text
North ↑                                             Ground floor, schematic

                A · Scholars’ Passage
               ┌───────────────────── AC ───┐        25 Maths   Lookout   26
               │                            │           │         │       │
15 Reading ────┤                  ┌── BC ───┴───────────┴─────────┴───────┘
               │                  │                 C · East Range
          ┌────┘     24 Cloakroom ┤
          │                       │ B · West Cloister     Tower
          ├── 14 Schoolroom       │                       First Court
13 Bursar ┤                       │                       (enclosed lawn)
          │                       │
12 Lodge ─Hall ───────── AB ──────┘
          ↑ Start
```

The lines show foot routes and room entrances. **AB** is the existing hall–porch threshold at (−6, 2), **BC** the north porch–East Range threshold at (10, 34), and **AC** the proposed enclosed crossing at (10, 42). Coordinates are approximate (X, Z) in metres, with ground at Y = 0. The public hall exit to Scholars’ Passage lies near (−19.8, 4), clear of the gallery pier. Keep the passage roughly 3 m wide, jog east to X −13 at Z 22, then turn east at Z 42. Beyond AC, turn south at X 18 and enter East Range at (18, 38), between the cloister entry and Mathematics. This fits behind the north porch and west of the existing classroom. The lawn remains visible through the arcade. Preserve the stair view over the roofs to the same tower.

Retain the existing survey anchors: the 16 × 20 m entrance hall at X −22…−6, Z −16…4; the west arcade at X 0…5, Z 4…32; and East Range at X 10…42, Z 32…38. Mathematics occupies X 22…30, Z 38…46. The eight-step lookout rises 1.44 m near X 35.5. AB and BC each have 2 m of clear width, with A owning the AB opening and B owning BC. Use the same clear width and at least 3 m of headroom at AC. Check the new rooflines at standing and jumping height from both overlooks before detailing the rooms.

| Plaque | Room and area | Approximate door (X, Z) | Access and purpose |
| --- | --- | --- | --- |
| 12 | Porter’s Lodge · A | (−22, −3), existing | Open. Keep the waiting bench, counter and view into the arrival yard. |
| 13 | Bursar’s Office · A | (−21.3, 10), west side of Scholars’ Passage | Closed office door with a posted appointments notice. Reserve a shallow office footprint behind it. |
| 14 | Gatehouse Schoolroom · A | (−18.3, 16), east side | Open, furnished classroom. Allow about 7 × 8 m for a small group around existing desks, student chairs and a chalkboard. Alternate scheduled destination for testing. |
| 15 | Reading Room · A | (−14.5, 32), west of the passage after the bend | Open. A compact room with an existing shelf and table gives the quieter passage a reason to exist. |
| 24 | Cloakroom · B | (0, 23), through the solid west wall of the cloister | Open. A shallow room with a bench faces the courtyard arcade across the walk. Keep its footprint west of the wall and clear of Scholars’ Passage. |
| 25 | Mathematics Room · C | (26, 38), existing | Open, furnished classroom. Keep the arched door and arrival bounds. Face the student desks and chairs towards the teaching board. |
| 26 | Map Store · C | (39.5, 38), past the lookout stair | Closed departmental store with a “Staff only” plate. Its reserved footprint lies east of the stair bay. |

Five rooms are enterable, including both classrooms. The two closed rooms use a fixed door face and ordinary solid collision with a legible notice. Only working doors offer the E interaction. Reuse the current architecture, panels, plaques and catalog furniture. The proposal calls for two furnished teaching rooms, two simple reusable interiors and the existing lodge. The new doors fit along the loop without extending it.

## 3. Public numbers, directions and the opening class

**The local numbering rule.** Numbers increase along each historic approach away from the hall. Walk past reception into Scholars’ Passage and the sequence is 12, 13, 14, 15. Walk the cloister into East Range and the sequence is 24, 25, 26. The second sequence crosses a loading boundary. All seven doors are on the ground floor. The digits encode neither a compass direction nor a floor. A player who has noticed the cloakroom plaque at 24 has a useful clue that 25 is nearby. It is not necessary for a first-time player to deduce the entire numbering scheme immediately. On the return walk, descending numbers lead back towards reception. Gaps leave room for later campus design.

**Identity and presentation.** Keep each room’s stable internal `id` and add a separate string `number` to its definition. For example, the existing Mathematics ID `ER-G-01` maps to public number `"25"`. The schedule’s `roomId`, door association and arrival comparison still use the ID. Resolve the number once from the school’s room registry, even while the area is unloaded. The timetable, room plaque, objective, start instructions and success or late messages all use the public number. The existing prototypes may display their present IDs as numbers. Within First Court require unique numbers, and permit a schedule to target only an enterable classroom. A test that changes just the Mathematics number should change every public reference while preserving arrival at the same room.

**An urgent but legible first visit.** The intended emotion is mild panic followed by orientation and relief, while enticing side spaces remain tantalizingly unexplored. Do not turn the opening into a relaxed tour or a cryptic numbering puzzle; those belong to later classes. The first timetable reads **Mathematics · Room 25 · 09:00**. At reception the two openings are labelled “Scholars’ Passage” and “West Cloister”; a small “Rooms 24–26” fingerboard points toward the latter. The fork gives a newcomer one actionable clue without a floor plan. At the cloakroom, seeing 24 confirms the route. At the north porch, the East Range sign carries the name onward. The tower and the change from flagstones to oak give the turn a physical landmark.

A player who takes Scholars’ Passage instead can open 14 and see an actual teaching room. The schedule stays active. Beyond 15, a sign at the enclosed turn reads “East Range · Rooms 25–26”. Following it brings the player into the same corridor from a different direction. At the stair, finding 26 means they have walked past Mathematics. The return decision is also meaningful: the covered passage leads directly toward the reading room; the cloister leads to the cloakroom and the tower view.

Keep the **default and player-facing entry timed** at `?level=4`, starting at 08:15 with the 60× clock as soon as control begins. Its 45 active seconds are provisional and should be tuned from unfamiliar-player observation, not optimized solely for a rehearsed shortest route. The explicit **developer/playtest-only** entry `?level=4&mode=explore` uses the same doors, stairs and geometry without a deadline or victory on entry; do not promote it as the default player experience. Use a test schedule for Room 14 to exercise the opposite choice. In either timed configuration the whole player must enter the scheduled classroom through its open door before class begins.

Later timed classes can allow substantially more time to investigate an obsolete hall name, a cryptic numbering rule, a contradictory notice or a counterintuitive route. Difficulty should evolve from quick wayfinding to route knowledge to genuine deduction, not merely longer runs. The opening class is solvable from the ordinary plaques and signs in this plan.

**Layout review evidence (completed for approval; repeat targeted tests after streaming).** Walk the full loop both ways, visit all five open rooms, and verify the two closed doors behave as signed. Test timed arrival via each arm, a wrong-room entry followed by recovery, the exact deadline, retry, and the alternate timetable. Check that all seven plaques agree with the room definitions and that the lodge, offices and store cannot complete a class. Capture the fork from normal eye height, the turn after 15, the approach past 24, the East Range junction and both tower views. Give an unfamiliar player the **timed entry first, without first revealing the map or providing a tour**. Record whether the opening feels urgent, the clue they used, whether a wrong turn could be corrected, their arrival time or timeout location, and at least one place they wanted to investigate but felt too rushed to enter. In untimed mode ask them to return to the lodge by a different route. Use those observations to review signs and the allowance before accepting the layout.

## 4. Streaming, adjacency and state — keep the accepted 19.5 architecture

Build on the existing `World` / `Level` / `SchoolDefinition` / `ModelCache` / `LightingManager` division. Each area remains a `Level` instance; no new area-construction engine. Use three authored links, **AB, BC and AC**, with world-space apertures and data-driven approach / keep / hold regions. Derive reciprocal neighbors from one link record. A player remains in a single continuous physical Y-up world. World owns residency and delegates cross-area spatial queries; GameSession owns the clock and outcomes.

| Position or event | Residency rule |
| --- | --- |
| Start or reset in A | Prepare and activate **A+B** before enabling the play button, as B's south porch is visible from the hall. C's detailed models load on approach. Explore mode uses the same rule. |
| Approaching AC through Scholars’ Passage | Request C by the bend after the schoolroom, before the cross-passage becomes visible. Returning from C, request A on approach to the north entry before its enclosed turn. A owns the AC reveal and threshold. C begins its slab flush at the seam. |
| Moving north through B | Request C when the player enters an early approach region (original estimate Z ≥ 13). Target activation before the concealed north turn and hold boundary (original upper bound Z ≈ 27); adjust triggers against actual geometry and worst-case traversal time. B stays active. |
| Leaving A behind | Use the union of occupied and visible passage and room footprints on both arms of the loop. After the player passes an authored far keep region and a short hysteresis delay, retire A only if it is out of direct sight and out of collision relevance. The player's current area, annex occupancy and any adjacent visible objects must prevent premature retirement. A, B and C may temporarily coexist. |
| Returning toward A | Request A early in B (original estimate Z ≤ 23) and complete activation by the southern concealed hold region (around Z ≈ 9). Retain B while C is retired on return once safely out of sight and reach. |
| Hesitation, reversal or duplicate requests | Cancel pending retirement when returning toward a seam; deduplicate same-area and same-URL fetches; honor latest requested residency generation so a stale completion cannot reattach retired content. Reversing at a seam should not cause flashing, a floor gap or repeated downloads. |
| Entering the annex or using C stairs | No area switch; these are local to A and C respectively. They must still be included in accurate visibility, collision, lighting and occupancy decisions. |

**Sightline and geometry validation is a design gate, not an implementation detail.** Cast rays from the full walkable path at standing and jumping eye height, including through the arcade toward the courtyard and distant buildings. Any geometry visible while an area is absent must belong to the still-active area or to shared persistent scenery. Architectural turns should conceal changes naturally. Move prefetch earlier or enlarge an opaque return if needed; don't permit unloaded-area holes to appear in windows or from the stair. Preserve one school-wide ambient fill and independently owned area lighting. Compare identical camera poses before and after an adjacent area unloads to detect shadow or light popping. Verify from both the cloister and landing that the tower is one piece of scenery at one world position. Keep B resident while its tower is visible from C.

**Failure / pause policy:** Check deadline before advancing the frame, then verify readiness before allowing movement across a hold line. If the next area isn't available, keep the current complete scene, clear held movement and pause active challenge time immediately; show a short loading state. A resume gesture reacquires pointer lock. On failure, remain safely in the current area with a recoverable **Retry passage** action that retries the dependency without resetting the run. An already-expired deadline retains precedence. Explore mode also holds safely but has no deadline. No artificial teleport or visible handover in normal operation; under tested reference conditions target **zero loading holds**.

**State / retry:** Stable area, room and door IDs are registered before meshes load. Preserve door open state **including swing direction** across area unload/reload. Retain shared model templates for the selected world's lifetime, then dispose in correct order at teardown. A timed challenge retry resets session, original spawn and initial doors / area set; explore mode restart restores its start without introducing a simulated school-day. Do not let area activation reset Player's camera, motion or GameSession.

## 5. Data, assets and source changes

**Separate new school file:** Add ID 4 to the level picker/index with a `schoolFile` reference, but keep original IDs 1–3, URLs and content unchanged. Proposed manifest `assets/schools/first-court.json` contains `initialAreaId`, startup set, area definitions, connections, global lighting, player spawn/look target, schedule/clock trial configuration and catalog. Resolve paths consistently with the existing catalog base. Prevalidate connectivity and room identities without loading all geometry.

| Expected file | Planned change |
| --- | --- |
| `assets/levels.json`, `assets/schools/first-court.json` | New picker entry and separate school manifest; existing definitions untouched. A contains reception and Scholars’ Passage, B the cloakroom and cloister, and C the teaching range and lookout. The same manifest backs explore and timed modes. |
| `js/SchoolDefinition.js`, possibly new `js/ConnectedSchool.js` | Preserve adapter for original levels. Validate school, area IDs, unique room IDs, connection apertures and graph reachability; derive reciprocal adjacency. Add minimal residency-policy evaluation, no second world representation. |
| `js/Game.js`, `js/World.js` | Load new school manifest, maintain authored startup area set, observe movement for prefetch / activation / retirement, preserve cancellation generation, handle safe holds and retry. Leave GameSession clock ownership intact. |
| `js/Level.js`, `js/GameUI.js`, `js/GameSession.js`, `index.html` | Resolve plaque and UI labels from room metadata. Keep timing and ID comparisons in the existing session. |
| `tests/movement/*`, new connected-school tests | Verify manifest validation, traversal, both modes, optional detours, streaming, resource lifetime and all legacy regressions in Node and actual Chrome. |
| `README.md`, `tests/README.md`, `ROADMAP.md`, `CHANGELOG.md`, implementation review | Document final approved floor plan, controls, modes, new school entry, benchmarks and results **after** implementation and acceptance. |

**Reuse before creation:** Approved architecture GLBs and historic finishes (`vaultBay`, `stairPortalCap`, `collegiateBayWall`, `flagstoneThreshold`, `wornOak`, `courtyardRange`, `pointedOakDoor`, `masonryRoomArch`, etc.), plus existing signage, lighting and furniture systems. Preserve catalog orientation corrections, especially the student chair. Use older school art as an ingredient, not an excuse to duplicate its rectangular prototype layout. The optional annex should reuse existing desk/console, noticeboard, shelf or portrait assets; its purpose must be legible without commissioning new character art. Court scenery should use lightweight facades and silhouettes; **don't make a detailed model of every visible distant building**.

New geometry should be limited to fitted structural modules, authored openings, safe railings, the optional side annex, and already-approved corridor/room objects. Keep signed directions and readable room plaques integrated into the school aesthetics. Final detailed paintings, NPCs, sound and advanced lighting are future work unless an existing asset makes a simple addition trivial.

## 6. Implementation sequence and approval gates

1. **Approve design and spatial anchors.** Product owner confirms the first-court concept, main footprints, optional annex and C stair, high-level visual identities, sign conventions and both play modes. The wider campus stays indicative. No code edits before this gate.
2. **New school manifest and blockout — implemented; layout approved for streaming.** The existing all-resident blockout now includes Scholars’ Passage, the AC crossing and the seven-room schedule. The product owner has played timed and untimed modes and accepted the basic spatial layout, while identifying visual issues for triage. Walk the path and both optional detours in debug and solid view. Verify exact seams, full-width crossings, jump/head clearance, room detection and that there is no unwinnable path. Capture screenshots from entrance, optional annex junction, courtyard and upper stair **before** decorative finishing. Review whether the space feels explorable and large; revise the geometry if not.
3. **Streaming and failure handling — implemented, pending review.** The three authored links drive prefetch, residency and safe holds. Retry preserves the clock and door swings survive area reloads. See the measured results in section 8.
4. **Historic art, signs and playable modes.** Dress the three areas with existing kit. Validate functional optional room and stair, readable plaques, institutional purpose, exterior sightlines and no scenery popping. Enable untimed exploration and timed Room 25 class trial from the same school data. Give at least one unfamiliar player the timed entry first, without an untimed tour. Record when they notice the destination and clock, their first turn, and the time remaining or where they time out. Afterwards ask which place they wished they had time to investigate and whether the signs gave them a fair chance. Use the untimed entry for the subsequent sightline and landmark check.
5. **Compatibility, benchmarks and review.** Run all original Node/Chrome regressions plus new tests, inspect first-person screenshots, track cold and warm loading, round-trip memory, same-view lighting changes and failures. Document factual results and make a specific accept/revise recommendation. Do not begin milestone 21 automatically.

### Acceptance criteria — world and gameplay

- The original three development environments remain unchanged, with existing controls, 60× clock, Room 102 challenge, room identities, materials, visual output and tests preserved.
- A new fourth school is selectable; it uses **three independently loadable physical areas** and does not inherit the prototype's geometry.
- Both directions around the A–B–C–A loop and immediate reverse traversal is physically continuous at walking speed and while jumping / reversing: no teleport, camera reset, missing floor, double wall, invisible threshold or incorrect collider.
- The entrance hall presents **at least two accessible directions**, without presenting either as an unavoidable dead end: the cloister towards 24 and Scholars’ Passage past 13–15. Each reaches 25. The lodge remains a separate visit. C's half-flight and landing are walkable and optional, with a view of the same courtyard tower seen from the cloister. Verify recognition in paired first-person views.
- At least **two first-person views** (entrance / cloister / landing) convincingly communicate a school much larger than the playable slice, through galleries, surrounding facades, rooftop / tower silhouettes, windows or other architecturally plausible continuation. Scenery is not visibly incomplete when an adjacent area unloads.
- The world is recognizably an **old, functioning academic institution**, not only a castle or empty architectural model; signs, reception or notices and teaching-room furnishings communicate purpose.
- The courtyard is clearly visible through the cloister and is non-traversable in this milestone, with safe parapet/rail collision.
- **Developer exploration mode (not the default player experience):** no active class deadline, loss or arrival-triggered victory; all three areas, both optional investigations, normal interactions and restart are available.
- **Timed opening (primary player experience):** the picker and bare First Court URL launch directly into the class trial. From the first moments of play, the player faces a deadline and must navigate using ordinary signage; the first class must not require cryptic historical research or prior map familiarity. The timetable, current school time and destination are visible as soon as control begins. The timetable displays Room 25 and the schedule targets its stable ID, existing 60× rules and strict deadline apply, incorrect rooms/door-only proximity do not win, arriving before deadline wins, reaching it first loses, and retry resets the challenge without corrupting area state. Preserve a configured, reviewable time allowance, not a hard-coded 45-second rule.
- Room IDs, building numbering, door and arrival associations are stable independently of area residency; the scheduled destination remains logically reachable.

### Acceptance criteria — architecture, performance and tests

- Area residency uses existing World/Level architecture and authored connection data, not area-name conditionals. All three boundaries permit backtracking, pause, restart, loading failure recovery, and independent unload/reload with preserved door swing.
- A and B preload at start. C prepares before it becomes visible/reachable; there are **no visible scene gaps or normal-run loading holds** on the agreed reference walk. A+B+C may coexist briefly as required for sightlines.
- Test ten complete A–B–C–A loops, alternating direction, plus reversals in exploration mode (without a winning class interrupting the run); after warm-up, repeated settled A+B viewpoints must show no growth in template count, live geometry, collider registrations, fixtures, shadows or estimated retained bytes.
- Validate one request and parse per shared GLB URL per world lifetime, safe partial failure and retries, and correct teardown disposal including non-color textures. Record cumulative retained cache, live-area objects, shadow maps and browser performance separately.
- Verify safe failure before a hold: a pending fetch must not consume the timed run unfairly; failure does not reset the clock or lock the player permanently. A late result that occurred before a hold remains final.
- Legacy Node and Chrome tests all pass; add tests for manifest schema, duplicate/unknown room and area IDs, connection reachability, blocked physical seams, optional room door/collision, stair clearance, mode separation, area lifecycle, retry, and measured resource cleanup.
- Browser walkthroughs test timed success, timeout, wrong-room behavior, exploration without win/loss, both detours, porch/court sightlines, jumping and immediate reversal at all three seams, pointer-lock resume, V debug, and visual continuity before/after area unload.
- Compare the unchanged prototype against milestone-19.5 benchmarks. Record changes in startup resources including shared JavaScript and the index entry; do not silently relax its limits.

### Proposed benchmark gates (measured only after implementation)

Use desktop Chrome at 1920×1080, DPR 1 on the established M5 Pro / ANGLE Metal reference or document a hardware change. Cold startup: three runs with cache disabled, 25 Mbit/s and 40 ms latency; timed routes unthrottled as in milestone 19.5. Report p50/p95 frame intervals and max frame near each activation.

| Metric | Proposed gate / measurement |
| --- | --- |
| Legacy prototype | Preserve existing 16 MiB startup, 7 s median ready, 16.7 ms per-run p95, and 256 MiB decoded asset targets *or explicitly seek approval for a quantified unavoidable shared-code delta*. Milestone 19.5 startup had only 8,616 bytes of headroom. |
| New school startup | Initial A+B cold resources ≤ 8 MiB; median ready ≤ 7 s under reference profile, with separate disclosure of shared code, school manifest and initial models. |
| New school full first visit | Successful unique resource bodies A→B→C ≤ 16 MiB as an initial target; cold C request-to-activation ≤ 2.0 s on reference profile, warm activation ≤ 150 ms. Re-evaluate prefetch trigger against worst-case full-speed arrival plus visual sightlines. |
| Streaming smoothness | No visible gaps or holds on three standard cold approaches; per-run p95 ≤ 16.7 ms and no frame > 50 ms within one second of seam activation. Verify the optional annex and stair do not introduce unloaded-area views. |
| Cumulative asset usage | Peak unique decoded geometry buffers + mipmapped textures across **all cached templates and live/in-flight areas** ≤ 256 MiB as a *proposed* target. Count duplicates only once; report separate shadows, GPU renderer counts and heap. Retained memory after ten round trips is stable after warm-up. |
| Spatial correctness | Level seam height difference ≤ 1 mm, zero uncommanded yaw/pitch changes; cross all three portals at multiple lateral positions and while jumping; invalid graph / collision mismatches fail tests. |

If these gates are unattainable with added exploration spaces, report the reason and propose a targeted asset, loading or budget adjustment; **do not compromise the explorable layout solely to hit a legacy byte target** or silently enlarge limits. Do not introduce cache eviction, incremental construction, a physics engine or a renderer upgrade unless supported by measurements and separately approved.

## 7. Recorded decision and scope of authorization

**Product-owner review, 24 November 2026:** The product owner played both the timed First Court and developer exploration build. The timed navigation experience was satisfying; the limited size was accepted for milestone 20 as the first section of an expandable school. The basic seven-room layout, numbered destinations, two-arm loop and existing sightlines are **approved for streaming**. The fully realized school should eventually allow players to stray far from a destination and lose because of time, not because the accessible world runs out; this is a future expansion principle, not a mandate to add more rooms here.

**Authorized now:** Implement section 4's three-area residency, prefetch/unload/reload, error recovery, clock fairness, cross-area physics and visual continuity, and the documented streaming performance and regression checks. Keep the present geometry, timetable, room numbers and default timed experience intact. Investigate any reported visual glitch that might indicate a structural gap, missing surface, collider mismatch, sightline or unload boundary defect before treating the layout as safe for streaming. Do not redesign the school or begin unrelated visual polishing in this stage.

**Recorded visual follow-up (for the later historic-art stage, not a blocker to starting streaming unless structural):** The player noticed occasional visual glitches, procedural/factory furniture that looks out of place next to the optimized imported GLB furniture, and insufficient environmental detail. Capture exact reproductions/screenshots when available. Prefer the optimized imported models and more convincing, reused architectural and institutional details in the later pass, while retaining performance budgets.

**Remaining approvals:** After streaming implementation, review seamless movement and scene appearance in both directions, resource stability, correct clock and retry behavior, and any structural glitches. Then review the art pass and overall milestone acceptance separately. No further campus expansion or milestone 21 work is approved by this decision.

## 8. Streaming stage implementation and evidence

World starts A+B and checks each area's `required` rectangles before advancing Player. Rectangles use `[minX, maxX, minZ, maxZ]` in metres. Their union covers occupied floors and rooms, relevant colliders and views into adjoining areas. The movement check includes the player's radius and the maximum horizontal travel in the upcoming frame. Each connection defines one prefetch rectangle on each side. A 2 m margin around required rectangles also prefetches scenery dependencies such as the cloister seen from the lookout. The last demand keeps an area resident for another 500 ms so a quick turn does not rebuild it. The manifest adapter validates the region bounds, startup set, seam coverage and connected room graph.

- B requests C by Z 8. A requests C by the Scholars’ Passage bend at Z 23. On the cloister side the C hold starts before Z 22. On the enclosed side it starts before Z 39.5. At 6 m/s these give roughly 2.3 s and 2.75 s before applying the player and frame margins. C already shares every required GLB template with A+B. Its first activation prepares and builds a Level on demand with the cached templates.
- The gatehouse stays required through the south turn and jump-height views along the cloister. The cloister can retire inside Scholars’ Passage and stays resident in East Range for the lookout and tower. A WebGL owner-color sweep of 1,887 standing and jump-height poses found no pixels from an area outside its required region and test margin after the keep region was extended. Six fixed-camera pairs covering the entrance, south porch, tower, cloakroom approach, lookout and enclosed passage matched pixel for pixel at 960 × 540. Shared point lights whose reach crosses boundaries now stay registered with the school. The lodge and classroom keep local lighting registrations. The layout, tower placement and all three slabs use the approved coordinates.
- A residency request deduplicates model preparation and stops a completion from attaching after its demand was retired. Unload releases the Level and its collision, fixtures and shadow maps. World retains its signed door swings and shared GLB templates. LightingManager detaches and reuses the same light IDs because Three.js r128 retains a uniform record for each ID until the renderer is disposed. When movement would reach missing scenery or colliders, Game checks the deadline, holds the complete current view, clears movement and pauses GameSession. **Retry passage** retries that dependency. **Resume** reacquires pointer lock and continues the same clock. A challenge retry restores A+B, spawn, time and the original closed doors.

### Walkthrough and regressions

The Node and Chrome suites cover all seams at three offsets, standing and jumping reversals, closed doors and headroom, both tower views, the optional rooms and lookout, stable room identities, failure recovery, stale requests, teardown and ten complete streaming loops alternating direction. The two-area fixture also verifies shadow and fixture release and disposal of non-color textures. The Chrome walkthroughs reached Room 25 via the cloister at 08:30 and via Scholars’ Passage at 08:35 after briefly entering Room 14. The exploration walkthrough visited all five enterable rooms, inspected both staff doors, climbed the lookout and completed the reverse loop in V view without a class result. The recovery check injected a delayed rejection at the cloister approach and used the real Retry passage and Resume actions, preserving the position and clock. [Test instructions](../tests/README.md)

All 119 Node and 92 Chrome regressions passed. Chrome also checked a shortened timed First Court fixture through 09:00 and retried with pointer lock. Node checked the exact deadline with the shipped 45-second allowance, including precedence over a passage hold.

### Measured performance

Chrome 158 with ANGLE Metal on Apple M5 Pro at 1920 × 1080 and DPR 1. The table uses three cache-disabled starts per school at 25 Mbit/s and 40 ms, with the throttle removed for timing the routes. The same three First Court approaches were also run with throttling left on. Both series had zero holds and reached Room 25 at 08:30. Resource bytes use encoded response bodies from Resource Timing, as in milestone 19.5. [Milestone 19.5 baseline](connected-school-architecture.md#browser-comparison)

| Metric | First Court | Six-classroom prototype |
| --- | ---: | ---: |
| Startup resources | 8,412,905–8,413,240 B | 16,779,904 B |
| Median Start enabled | 3.090 s | 5.938 s |
| GLBs at startup | 7,506,936 B | 15,938,420 B |
| First Court manifest | 64,485 B | No request |
| Full first-visit unique resources | 8,412,905–8,413,240 B | — |
| Unthrottled route p50 | 8.3 / 8.3 / 8.3 ms | 8.3 / 8.3 / 8.3 ms |
| Unthrottled route p95 | 9.1 / 9.1 / 9.1 ms | 9.2 / 9.1 / 9.2 ms |
| First C request to activation | 8.9 / 6.2 / 6.1 ms | — |
| Maximum frame within ±1 s of C activation | 41.5 / 33.4 / 33.2 ms | — |
| Maximum frame within ±1 s of A reactivation | 9.4 / 9.4 / 9.3 ms | — |
| Peak estimated decoded assets | 68.12 MiB in A+B+C | 238.14 MiB |

With network throttling in place through arrival, First Court's p95 was 9.0, 9.1 and 9.1 ms. C activation took 3.5, 6.5 and 6.4 ms, and the largest frame within one second of any activation was 33.4 ms. The first visit made zero additional GLB requests after Start. The 40-loop resource run recorded 120 activations from 1.0 to 6.1 ms with zero holds.

At the three-area overlap, the decoded estimate counts 1,077,032 geometry-buffer bytes and 70,352,612 bytes of mipmapped textures, deduplicated across templates and live placements. The scene held 1,153 objects, 829 live geometries and 503 colliders. The renderer reported 321 uploaded geometries and 45 textures at that pose. At the settled A+B pose, all ten loops retained 10 templates, 892 scene objects, 625 live geometries, 38 live textures and 376 colliders. Estimated decoded storage stayed at 65.26 MiB. First Court used zero fixtures and shadow maps. Uploaded counts alternated with the route and stayed at 210–246 geometries and 35–37 textures. The 40-loop follow-up confirmed the same area counts and 13 shader programs.

Post-GC JavaScript heap was 7.03 MB at loop 10 and 7.33 MB at loop 40. Snapshots confirmed stable counts for Levels, walls, meshes, lights and sign textures. Reusing light IDs eliminated the former per-reload increase in Three.js light uniforms. The remaining heap increase includes V8 compiled code, internal array storage and Chrome performance records. Overall heap has a measured increase separate from the stable area resources.

### Open benchmark gates

- First Court exceeded its proposed 8 MiB startup gate by 24,297–24,632 B. Its full first visit, startup time, activation times, frame intervals and decoded assets met their targets. The A+B GLBs already contain all templates needed by C, so deferring C's instances saves live objects without reducing model transfer. Recovering 25 KB from the shared First Court runtime assets or their delivery would close the byte gap.
- The prototype exceeded the existing 16 MiB gate by 2,688 B. Compared with milestone 19.5, the measured total rose 11,304 B. Shared JavaScript grew from 88,954 to 100,161 B, including 6,201 B from this streaming stage. The shared levels index rose from 40,944 to 41,041 B with the First Court entry, and the HTML entry rose from 10,894 to 10,926 B. Both index documents are unchanged by this stage. Prototype GLB bytes are identical. Its time-to-ready, p95 and decoded assets still meet the baseline gates. Product-owner approval is requested for the measured 2,688 B overage. Deferring the manifest validation code on prototype entries is a targeted alternative if the byte gate remains strict.
