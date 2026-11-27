# First Court — visual quality specification and defect review

**Status:** Stage V1 is provisionally accepted. The product owner accepted Stage V2 and marked Stage V3 complete. Stage V4 and the subsequent architectural finish pass await product-owner review.

**Scope:** The existing seven-room First Court, without layout changes, additional rooms, inventory, changes to the Mathematics timetable, or changes to the approved area-streaming architecture.

**References:** [Visual target sheet](first-court-visual-references.md) · [Original defect photos](references/first-court-visual-review/review-contact-sheet.jpg) · [Finish consistency screenshots](#12-architectural-finish-consistency-pass) · [Stage V4 screenshots](#11-stage-v4-courtyard-tower-and-final-review) · [Established historic-school reference](historic-school-reference.md) · [Historic slice](historic-slice.md) · [First Court blockout](first-court-blockout.md) · [Product vision](../VISION.md).

## 1. Creative objective

First Court has a pleasing sense of volume and a working timed navigation challenge, but much of the lower building feels like an undecorated procedural shell. The stone vaults are considerably richer than the flat, pale walls, and many rooms lack objects or signs of everyday use. Correcting individual geometry errors will not, by itself, make the school feel interesting.

**Target:** A believable, centuries-old English college / boarding school, warm, institutional and lived-in. Strong stone architecture should coexist with lime plaster, *dark oak wainscoting*, framed portraits, worn rugs/runners in selected interiors, books, noticeboards, practical teaching furniture, lanterns, lamps and school paraphernalia. The school should be inviting enough that the player wishes to stop, even though the timed class makes them hurry.

**Important distinction:** Use the linked reference photographs for **materials, craftsmanship, proportion, warmth, composition and level of detail**, not as literal plans or a mandate to recreate entire historic interiors. Avoid a fantasy castle, dungeon, theme park, spotless palace, or identical oak-panelled corridor everywhere. Reuse the already-approved historic visual language and existing optimized assets.

## 2. Visual grammar

- **Masonry:** Warm grey/buff aged stone with plausible scale, proper piers, reveals, arch crowns, imposts, springing points and vault terminations. Avoid detailed masonry pieces floating in front of unconnected solid boxes.
- **Walls:** A hierarchy: monumental stone at the cloister; limewashed plaster **over substantial dark-oak wainscoting** in inhabited rooms and Scholars' Passage; modest oak or stone trim elsewhere. Walls should end and meet one another intentionally.
- **Floors:** Keep the principal hall and open cloister flagstones. Use worn dark oak in teaching/reading rooms; add an aged, subdued runner to selected enclosed passages and a rug to an intimate reading/receiving space, not every route. Rugs should be flat, collision-neutral and not flicker with the floor.
- **Portraits/history:** At least one recognizable framed portrait (reuse the established portrait/frame treatment), plus a small number of believable notices, honours, historical names or a college plan. Details suggest institutional life; do not introduce actual unsolvable puzzles in this pass.
- **Objects:** Use the existing **optimized runtime GLBs** for school furniture wherever a suitable asset exists. No low-poly prototype desks/chairs in the two principal teaching rooms. Fit scale and rotation; avoid impractical aisle obstruction.
- **Lighting:** Natural daylight from credible openings, warmer pools at inhabited furniture / displays and readable directional signs. Contrast between austere, sunny cloister and sheltered, warmly furnished interiors; no invisible key lights that make shadows physically inconsistent.
- **Exterior:** Recognizable windows, parapets, rooflines and a more convincing tower silhouette/stone detailing. Retain one coherent tower in the same world position as seen from the cloister and landing; do not model the entire unplayable campus in detail.
- **Performance:** Optimize as the current school already does: reuse runtime models, existing texture/geometry/material catalogs, shared templates, authored light ownership and lightweight scene dressing. Record incremental startup bytes, decoded assets and frame times; do not silently expand approved performance limits.

## 3. Place-by-place intent

| Place | Identity and desired details | What to preserve |
|---|---|---|
| **Grand entrance hall / reception (A)** | Monumental vaulted public room **with human-scale lower walls**: woodwork or panelled bays, historic portrait, college noticeboard, an entrance table or bench, sympathetic sign mountings, perhaps a rug in a sheltered reception zone. Make the gallery look constructed and finished, not like beige scaffolding under a spectacular ceiling. | Grand height; fork to Cloister and Scholars' Passage; legible direction clues; spawn clearance. |
| **Scholars' Passage (A) — FIRST STYLE SAMPLE** | The representative visual slice: plaster above dark oak wainscoting, a worn patterned runner, one substantial portrait, modest framed notice, appropriate lantern/sconce and a little well-placed furniture. Richer, quieter and more intimate than the exposed cloister. It should feel like the passage leading to a functioning old schoolroom, not a hotel corridor. | Existing width, jog, Room 13/14/15 entrances, direction clues, AC passage and streaming sightlines. |
| **Room 14 — Gatehouse Schoolroom (A)** | Actual optimized desk/chair/teacher's desk/chalkboard where available; plausible arrangement, books and notices, light on teaching wall, clear walking aisle. | Room 14 entry and arrival bounds, functional door, alternate class test. |
| **Room 15 — Reading Room (A)** | Warm, quiet, inviting: bookcase, reading table/seat, old carpet or rug, framed picture, a lamp or window light; some books should look used, not uniformly stacked. | Accessible door; existing footprint and colliders. |
| **Porter's Lodge, Room 12 (A)** | Working counter, waiting place, pigeonholes/notices, paperwork, coat hooks or key hooks as visual storytelling only (no key system). Framed view onto arrival yard. | Accessible counter, yard view and circulation. |
| **West Cloister (B)** | More restrained: integrated ribs and springing points, properly resolved vault bays, stone/parapet and memorial plaque/bench. Courtyard daylight remains dominant. No carpet in the outdoor stone arcade. | Courtyard visibility, AB/BC crossings, tower landmark, unloaded-area visual continuity. |
| **Cloakroom, Room 24 (B)** | Coat pegs/hooks and wooden bench, perhaps a few stored items. Simple, functional and convincingly used. | Door and passage clearance. |
| **East Range (C)** | Practical academic wing with selected oak panels / notices, working room plaques, less monumental finishes than reception; built-in trim and dressed wall terminations. | Mathematics room and stair access; both incoming approaches; route recognition. |
| **Room 25 — Mathematics (C)** | Proper imported teaching furniture, chalkboard, classroom supplies, secondary notice/map, coherent lighting. Not necessarily lavish, but unmistakably a teaching room. | Scheduled arrival, Room 25 signage and doorway. |
| **Tower / courtyard / stair lookout (shared views)** | Improve composition and architectural specificity: window surrounds, stone courses, roof edges, believable tower crown/openings, visible overlap between distant buildings. Keep a readable landmark rather than competing with play. | Same physical tower from two viewpoints; no holes or scenery pop during area unload; no additional traversable exterior this milestone. |

## 4. Defect register — screenshots and diagnosis

These are **visual observations**, not code-level root-cause claims. Inspect actual mesh placement/material/culling before choosing a fix. In particular, a gap can be missing authored geometry rather than a streaming problem, and a mottled trim can be UV/texture mapping rather than true z-fighting.

| ID | Screenshot | Observation | Priority | Verification / acceptable correction |
|---|---|---|---|---|
| **FC-V01** | [Entrance trim](references/first-court-visual-review/01-entrance-trim.jpg) | Brown horizontal trim and textured upper masonry blend / overlap irregularly; lower walls much too bare. | **P1** | Identify coplanar faces vs finish UVs / intersections; eliminate shimmer from walking and stationary viewpoints. Finish lower wall coherently. |
| **FC-V02** | [Scholars' Passage](references/first-court-visual-review/02-scholar-passage.jpg) | Flat ceiling, bare walls, awkward door surround and abruptly different surface finishes. | **P2** | Make corridor feel intentionally built and inhabited; remove unintended penetrations/trim artifacts, preserve clearances. |
| **FC-V03** | [Vault](references/first-court-visual-review/03-vault-ceiling.jpg) | Detailed overhead vault appears disconnected from large undecorated hall walls and gallery supports. | **P1/P2** | Resolve physical attachment and transition first; then architectural detail. |
| **FC-V04** | [Tower view](references/first-court-visual-review/04-courtyard-tower.jpg) | Exterior tower, roofline and parapet look like simple geometric blocks. | **P2** | Improve skyline and facade composition with economical reusable detail; preserve landmark alignment. |
| **FC-V05** | [Exposed exterior shell](references/first-court-visual-review/05-exposed-shell.jpg) | Close external view exposes blunt wall geometry / wall backside, breaking the building illusion. | **P1** | From reachable viewpoint, complete visible silhouette and window/reveal details; verify scenery remains present while areas unload. |
| **FC-V06** | [Classroom](references/first-court-visual-review/06-classroom-furniture.jpg) | At least one procedural block desk remains among sparse furniture; classroom has very little function or warmth. | **P2** | Replace suitable procedural placeholders with existing runtime GLBs; meaningful layout with clear arrival path. |
| **FC-V07** | [Vault sky gap 1](references/first-court-visual-review/07-cloister-vault-gap.jpg) | Triangular sky gap at end of pointed cloister vault; rib/arch termination does not appear resolved. | **P1** | Determine whether deliberate aperture; otherwise use correctly supported architectural closing or transition. No arbitrary filled flat cap without regard for sightlines. |
| **FC-V08** | [Vault sky gap 2](references/first-court-visual-review/08-cloister-end-gap.jpg) | Similar exposed vault end near East Range and awkward high masonry / plain wall transition. | **P1** | Restore coherent end bay and support from all normal eye-height/jumping viewpoints. |

**P1**: Geometric correctness and architectural continuity; fix before declaring visual stage complete. **P2**: Style / dressing; complete in selected area first, then extend once approved. **P3**: Further discretionary richness; defer rather than create unlimited scope.

## 5. Implementation stages and explicit owner review gates

### Stage V1 — Representative style sample, **Scholars' Passage only**

Build one **small, polished subsection** of Scholars' Passage that the player traverses during the existing timed school. Include:

1. Fit oak wainscoting to the existing wall geometry; plaster above, with deliberate bases, corner returns, arch/door stops and panels not obscuring signs.
2. Add one subdued aged runner without z-fighting or collider changes.
3. Reuse the existing portrait/frame approach and one small historic noticeboard or wall detail.
4. Improve wall/door/ceiling joins and believable light treatment within this subsection.
5. Preserve Room 13–15 signage and access, route width, area boundary and streaming triggers.
6. Capture **before/after images at identical camera poses** at normal eye height, plus one close-up of panel/corner/door detail. Test from both approach directions, with V collision overlay and with area C loaded/unloaded.

**Stop here for product-owner visual approval.** Do **not** decorate all of First Court automatically. Stage V1 is an art-direction proof, not completion of all defects or the milestone.

### Stage V2 — Architectural correctness (after V1 review or earlier only for blocking defects)

Repair FC-V01, V03, V05, V07 and V08 by identifying actual causes, correcting geometry ownership, mesh overlap / material depths and vault supports. Check both streaming states; don't conceal problems using a large background plane or break visible scenery. Use paired comparison shots of all five locations.

### Stage V3 — Furnish and establish distinct identities

Extend approved V1 materials in **different proportions** appropriate to reception, reading room, lodge, East Range and two classrooms. Replace remaining visible block furniture with the existing optimized runtime models when a credible equivalent exists. If no suitable asset exists, list it rather than inventing a heavy new model library. Give each occupied space a modest but deliberate set of details and keep classrooms navigable.

### Stage V4 — Exterior composition and final verification

Improve the lightweight tower/court and surrounding high-level details, verify the two-view landmark, ensure no unload/pop artifacts, then repeat timed and explore-mode walkthroughs and Chrome/Node regressions. Report cold startup and frame / memory deltas against the **latest approved streaming baseline**, including separately acknowledged small existing overages. Do not begin new school wings or milestone 21.

Stages V2–V4 require separate product-owner approval after V1. Refine staging if the approved V1 trial reveals new architectural constraints.

## 6. Acceptance criteria

### Stage V1 approval

- At least one 10–20 m-ish sequence of Scholars' Passage (or its existing shorter representative bay) feels intentionally finished and consistent with the [target sheet](first-court-visual-references.md): convincing oak wainscoting, warm plaster, one runner, portrait, institutional detail, appropriate light.
- All decorative elements fit the actual built architecture: **no planar surface flicker, ragged trimming, floating mouldings or blocked signs/doors** from ordinary walk and jump viewpoints.
- The passage remains traversable from both directions with unchanged first-person physics/collisions, class clock, room signs and area streaming; carpets and wall decorations are nonblocking.
- Evidence includes paired first-person before/after captures and targeted automated browser checks, with the exact file paths and screenshots supplied for review.
- The sample still resembles an old *working school*, not an ornate hotel, dungeon or museum hallway. User judgment is decisive; an asset checklist alone is insufficient.

### Final First Court visual-stage acceptance (not part of V1 authorization)

- FC-V01–V08 either fixed with visual evidence or explicitly waived/deferred by the owner; no visible incomplete vault edge/shell view along ordinary routes.
- No low-fidelity procedural placeholder classroom furniture where an existing suitable optimized imported asset can replace it.
- Reception, passage, cloister, reading room, lodge, two classrooms, East Range and landmark views have **distinct purposes and visual identities**, not identical dressing everywhere.
- Existing seven-room gameplay, 60× clock, both timed routes, development exploration, door state, seamless area streaming, cache/lighting cleanup and original prototypes continue to pass regressions.
- Before/after evidence demonstrates visual improvement at the same camera poses; performance figures and any new budget exceptions are reported for approval, not silently accepted.

## 7. Constraints / ownership

- `VISION.md` is authoritative for game feel; `docs/historic-school-reference.md` and `docs/historic-slice.md` establish already-reviewed materials and proportions. This document refines **First Court** without superseding the school architecture or streaming design.
- Preserve public room numbers `12–15`, `24–26` and stable internal IDs. Do not alter physical connections AB, BC or AC or change Mathematics / Room 25 scheduling.
- Use runtime GLBs, existing image/texture assets and reusable modules whenever suitable; do not place unoptimized source GLBs in the browser asset catalog.
- Make no speculative inventory, key system, free-exploration progression, new classes or new wings.
- Do not edit `AGENTS.md` to relax test, authorization or commit rules. Never commit or push without explicit permission.

## 8. Stage V1 sample for visual review

The sample covers the straight passage from the reception opening, past Rooms 13 and 14, to the first turn toward Room 15. It adds regraded versions of the existing collegiate plaster and oak textures, recessed panels, stepped cap rails and skirtings, fitted jambs and a corner return. The arches and original collision boxes retain their positions. The original dado and rail meshes shared exposed end planes with the plaster wall boxes. Their solid-view opacity is zero inside the sample, so the fitted facing can cover those ends while V still shows the original collision outlines.

The existing John Locke portrait and iron lanterns sit opposite or above the route. The schoolroom notice and narrow oak ledge keep the aisle open. A muted wool runner sits 7 mm above the boards and contributes no collider. Two shallow ceiling ties support the straight passage lanterns. Rebuild the art with Blender's offline Python using `scripts/build_scholars_passage.py`. The game loads the resulting runtime GLB through the existing model cache.

### Matched first-person views

All pairs use the same player position, eye height, orientation and 1440 × 900 Chrome viewport. The forward pose is at X −19.88, Z 6.35. The reverse pose is at X −19.80, Z 19.40.

| View | Before | Stage V1 |
| --- | --- | --- |
| Toward East Range | [Before](references/first-court-v1/toward-east-range-before.jpg) | [After](references/first-court-v1/toward-east-range-after.jpg) |
| Toward reception | [Before](references/first-court-v1/toward-reception-before.jpg) | [After](references/first-court-v1/toward-reception-after.jpg) |
| Room 14 panel and jamb close-up | [Before](references/first-court-v1/schoolroom-join-before.jpg) | [After](references/first-court-v1/schoolroom-join-after.jpg) |
| Inside corner and lantern | [Before](references/first-court-v1/turn-before.jpg) | [After](references/first-court-v1/turn-after.jpg) |

[V collision outlines from the forward pose](references/first-court-v1/collision-outline.jpg)

### Verification

All 120 Node and 93 Chrome regressions passed. Desktop Chrome arrived at Room 25 at 08:30 via the cloister and at 08:35 via Scholars’ Passage after entering Room 14. The untimed walkthrough completed the loop in both directions and returned to the lodge with V enabled on the reverse trip. The authored collision bounds, seven room identities and existing signs, timetable, apertures, and streaming regions match the streaming baseline. The art test verifies direct sightlines to plaques 13–15, open and closed doorway collision, the runner's floor clearance and support, and the original V outlines. Fixed-pose WebGL comparisons of East Range loaded and unloaded passed in both travel directions and at jump eye height at the turn.

### Performance against the streaming baseline

Measured on Chrome 158, Apple M5 Pro with ANGLE Metal, at 1920 × 1080 and DPR 1. Three cache-disabled starts used 25 Mbit/s and 40 ms latency. The reference cloister routes ran unthrottled. A fourth unthrottled timed route walked through the sample. [Streaming benchmark](milestone-20-new-school.md#measured-performance)

| Metric | Streaming baseline | Stage V1 |
| --- | ---: | ---: |
| Startup resource bodies | 8,412,905–8,413,240 B | 8,584,042 B in all three reference samples |
| Median time to Start | 3.090 s | 3.130 s |
| GLB bodies at startup | 7,506,936 B | 7,675,896 B |
| First Court manifest | 64,485 B | 66,327 B |
| Peak estimated decoded assets in A+B+C | 68.12 MiB | 69.65 MiB |
| Reference-route p95 frame intervals | 9.1 / 9.1 / 9.1 ms | 9.2 / 9.1 / 9.0 ms |
| Largest frame within one second of an activation | 41.5 ms | 41.7 ms |
| Loading holds on the three reference routes | 0 | 0 |

The sample adds 170,802 B of like-for-like startup resources. The fitted GLB contributes 126,888 B, the reused portrait and lantern models 42,072 B, and the manifest 1,842 B. The legacy entry uses the same shared JavaScript, index and asset bodies as the streaming baseline. The timed sample route reached Room 25 at 08:34 with a 9.1 ms p95, zero holds, and a 33.3 ms maximum frame near activation. East Range activated in 5.7–8.1 ms on the completed routes. The first visit issued no additional GLB requests after Start.

First Court is 195,434 B over its existing 8 MiB startup gate at the reference maximum. Time to ready, frame intervals, activation times and decoded storage met their existing targets. The startup gate remains open. Later visual stages and the passage's visual approval remain separate review decisions.

## 9. Stage V2 architectural geometry review

| Defect | Cause and correction |
| --- | --- |
| Scholars’ Passage bright corner line | The east wall, return and cross-passage skins ended on different planes, exposing millimetre-wide strips of the lighter wall behind them. Four connected finish faces now share their edges through the return. The wall, lighting and collision dimensions are unchanged. |
| FC-V01 and FC-V03, reception trim and vault | The side soffit faces and vault masonry occupied the same X planes. The soffit faces now sit 35 mm behind the masonry, with localized stone seats at the existing supports. Both gables follow the existing vault profile above their original 9 m tops. The Scholars’ Passage opening stays under the original lintel. |
| FC-V07 and FC-V08, south and north cloister vault ends | The pointed vault webs stopped at the porch or transition slab, whose top sat below the crown. Fitted masonry closes each upper opening to the vault profile, and the north soffit step has a masonry face. The spine-side ribs seat into the existing wall. The courtyard-facing arcade remains open. |
| FC-V05, shell below the lookout | The view exposed the bare reverse faces of the teaching wing and a missing patch of ground between its wall and the stair. The existing exterior faces now have masonry returns down to a shallow paved bed inside the recess. The window opening, glazing, tower position and upper sightline stay in place. |
| Door surrounds and other local trim | The lodge, reading room, cloakroom, Mathematics and map store heads now meet stone reveals. Oak trim ends stop short of the underlying exposed wall ends, and intersecting cap rails use slightly different top heights. The original wall and trim boxes still supply the same collision and V outlines. |

The fitted geometry reuses the project's existing masonry texture. It ships in one shared GLB with an independently owned render group for each area. The passage corner stays in the existing Scholars’ Passage model. The renderer and physics code are unchanged.

### Matched first-person views

Both captures in each pair use the same player position, eye height, look target and 1440 × 900 Chrome viewport.

| View | Before | Stage V2 |
| --- | --- | --- |
| Scholars’ Passage corner | [Before](references/first-court-v2/scholars-corner-before.jpg) | [After](references/first-court-v2/scholars-corner-after.jpg) |
| Reception soffit and trim | [Before](references/first-court-v2/reception-trim-before.jpg) | [After](references/first-court-v2/reception-trim-after.jpg) |
| Reception vault and high gable | [Before](references/first-court-v2/reception-vault-before.jpg) | [After](references/first-court-v2/reception-vault-after.jpg) |
| South cloister vault end | [Before](references/first-court-v2/cloister-south-before.jpg) | [After](references/first-court-v2/cloister-south-after.jpg) |
| North cloister vault end and soffit step | [Before](references/first-court-v2/cloister-north-before.jpg) | [After](references/first-court-v2/cloister-north-after.jpg) |
| Lookout recess | [Before](references/first-court-v2/lookout-shell-before.jpg) | [After](references/first-court-v2/lookout-shell-after.jpg) |
| Lookout toward the tower | [Before](references/first-court-v2/lookout-tower-before.jpg) | [After](references/first-court-v2/lookout-tower-after.jpg) |
| Reading Room jamb | [Before](references/first-court-v2/reading-jamb-before.jpg) | [After](references/first-court-v2/reading-jamb-after.jpg) |
| Mathematics Room jamb | [Before](references/first-court-v2/east-range-jamb-before.jpg) | [After](references/first-court-v2/east-range-jamb-after.jpg) |

[V collision outlines from the corner pose](references/first-court-v2/collision-outline.jpg)

### Verification and remaining work

All 121 Node and 94 Chrome tests passed. The new ray tests hit both plaster faces beside the former strip, the fitted vault ends and the surface below the lookout. Chrome also compared loaded and unloaded East Range at the cloister ends, and the tower sightline regression passed from both overlooks. An area-colour WebGL sweep found zero visible absent-area pixels across 1,887 sampled standing and jumping viewpoints. Desktop walkthroughs reached Room 25 at 08:30 via the cloister and 08:35 via Scholars’ Passage after entering Room 14. Untimed play completed the loop in both directions, including the reverse with collision outlines. Comparing the manifests verified identical collision bounds, room and door definitions, aperture and streaming regions, and timetable.

One cold Chrome reference start at 1920 × 1080, DPR 1, 25 Mbit/s and 40 ms recorded 8,695,772 B and 3.188 s to Start. Compared with the V1 reference maximum, V2 adds 111,730 B and stands 307,164 B above the existing 8 MiB gate. The unthrottled route ran at 9.1 ms p95, with a 41.7 ms largest frame near activation and zero streaming holds. Chrome released pointer lock twice at the start of that capture, so the driver resumed and frame statistics cover active play. Decoded storage peaked at an estimated 70.06 MiB in the three-area overlap, up from V1's 69.65 MiB. Shared JavaScript and the legacy level assets carry zero V2 byte delta.

The product owner accepted the architectural corrections and approved the furnishing stage below. Exterior composition, including the tower’s simple silhouette, remains within Stage V4.

## 10. Stage V3 furnishings and room identities

| Place | Furnishings and finishes |
| --- | --- |
| Room 14, Gatehouse Schoolroom | Shared teacher’s desk and standing slate beside the existing rows of student desks and chairs. Large chalk copywork, a recitation notice and amber light mark the teaching wall. |
| Room 15, Reading Room | Two bookcases with books at different heights, a reading table with two upholstered chairs, a sage and russet rug, a framed cloister study and a warm lantern. The table and chairs sit to one side of the entrance. |
| Room 12, Porter’s Lodge | Oak enquiries counter with pigeonholes, post, a ledger and a bell. The bench and waiting notice sit beside the existing yard window. |
| Reception and East Range | Reception has broad fitted oak bays beneath the vault, the existing framed portrait style and a term noticeboard. East Range has short stretches of oak and a lesson noticeboard in the plastered bay between the classroom and stair. |
| Room 24 and West Cloister | A work lantern, shelf and two aprons sit over the cloakroom pegs. The stone arcade has a small foundation plaque. |
| Room 25, Mathematics | Matching teaching furniture keeps the central aisle clear. A triangle exercise on the slate, a geometry assignment and a pale sage teaching wall distinguish it from Room 14. |

The room plans, wall and floor collision, original passage widths, door definitions and room arrival regions match V2. The lodge counter and bench retain their collision footprints. Replaced and newly placed room furniture uses fitted bounds. Wall dressings, notices and the rug contribute no collision. Each fitting and light belongs to its area through the existing model catalog and lighting lifecycle.

Build the fitted groups with `blender -b --python-exit-code 1 --python scripts/build_first_court_interiors.py`. The 211,440 B GLB uses the established limewash and oak materials. The six smaller furniture GLBs in `assets/models/runtime/first-court/` are reproducible from the same-named models in `assets/models/runtime/` with `scripts/optimize_glb.py` and macOS `sips`. Use `--max-edge 512` for the student desk and display shelves, 256 for the teacher’s desk, chalkboard and green chair, and 128 for the book set. These variants are specific to First Court.

### Matched first-person views

Each V2 and V3 pair uses the same player position, eye height, look target, door state and 1440 × 900 Chrome viewport.

| View | Before | Stage V3 |
| --- | --- | --- |
| Room 14, Gatehouse Schoolroom | [Before](references/first-court-v3/room-14-before.jpg) | [After](references/first-court-v3/room-14-after.jpg) |
| Room 15, Reading Room | [Before](references/first-court-v3/room-15-before.jpg) | [After](references/first-court-v3/room-15-after.jpg) |
| Room 25, Mathematics | [Before](references/first-court-v3/room-25-before.jpg) | [After](references/first-court-v3/room-25-after.jpg) |
| Reception hall | [Before](references/first-court-v3/reception-before.jpg) | [After](references/first-court-v3/reception-after.jpg) |
| Porter’s counter | [Before](references/first-court-v3/lodge-before.jpg) | [After](references/first-court-v3/lodge-after.jpg) |
| Lodge waiting area and yard window | [Before](references/first-court-v3/lodge-waiting-before.jpg) | [After](references/first-court-v3/lodge-waiting-after.jpg) |
| East Range corridor | [Before](references/first-court-v3/east-range-before.jpg) | [After](references/first-court-v3/east-range-after.jpg) |
| East Range notice and stair | [Before](references/first-court-v3/east-range-notice-before.jpg) | [After](references/first-court-v3/east-range-notice-after.jpg) |
| Room 24, Cloakroom | [Before](references/first-court-v3/cloakroom-before.jpg) | [After](references/first-court-v3/cloakroom-after.jpg) |
| West Cloister | [Before](references/first-court-v3/cloister-before.jpg) | [After](references/first-court-v3/cloister-after.jpg) |

[Room 14 with V collision outlines](references/first-court-v3/collision-outline.jpg)

### Verification

All 122 Node and 95 Chrome regression tests passed. The furnishing test checks that the two teaching rooms share desk and board geometry, the reading books fit their cases, the rug sits clear of the floor, room IDs resolve inside their existing arrivals and the classroom aisles remain clear. Chrome compared the furnished gatehouse interiors with East Range loaded and unloaded. A separate WebGL sweep found zero absent-area pixels across 1,877 standing and jump-height poses. Existing streaming regressions passed, including ten alternating loops with reversals, stable retained resources, restored door swings, and slow-load recovery and retry.

The desktop timed walks arrived in Room 25 at 08:30 via the cloister and at 08:35 via Scholars’ Passage, including a wrong turn into Room 14. Untimed play visited all five accessible rooms and returned to the lodge on the reverse loop with V enabled. The two staff doors stayed restricted. The driver resumed after Chrome released Pointer Lock during the walks.

### Performance against V2

Measured in desktop Chrome 158 on the Apple M5 Pro with ANGLE Metal at 1920 × 1080, DPR 1. Three starts used a disabled cache, 25 Mbit/s and 40 ms latency. The timed cloister routes were unthrottled after Start. The driver resumed on external Pointer Lock pauses and frame timings cover active play.

| Metric | V2 reference | V3 reference |
| --- | ---: | ---: |
| First Court startup resource bodies | 8,695,772 B | 7,596,007–7,596,342 B |
| Median time to Start | 3.188 s on one start | 2.844 s |
| GLB bodies at startup | 7,786,336 B | 6,679,404 B |
| Manifest | 67,617 B | 75,119 B |
| Shared JavaScript and levels index | 100,161 B and 41,041 B | 100,161 B and 41,041 B |
| Full first visit resource bodies | 8,695,772 B | 7,596,007–7,596,342 B |
| Estimated peak decoded assets | 70.06 MiB | 57.89 MiB |
| Route p50 frame intervals | 8.3 ms | 8.3 / 8.3 / 8.3 ms |
| Route p95 frame intervals | 9.1 ms | 9.1 / 9.1 / 9.1 ms |
| Maximum frame within ±1 s of East Range activation | 41.7 ms | 33.3 / 33.4 / 25.8 ms |
| Maximum frame within ±1 s of Gatehouse reactivation | 9.4 ms | 9.4 / 9.4 / 9.3 ms |
| East Range request to first activation | 8.4 ms | 7.0 / 5.2 / 2.5 ms |
| Gatehouse request to reactivation | 10.2 ms | 4.6 / 9.1 / 9.3 ms |
| Streaming holds | 0 | 0 / 0 / 0 |

The worst V3 startup was 1,099,430 B smaller than V2 and 792,266 B below the 8 MiB gate. First Court’s smaller student desk and shelving textures saved 2,723,452 B. The four additional furniture variants and fitted interiors added 1,616,520 B. The manifest added 7,502 B. The first visit issued no additional GLB requests after Start.

The fourth benchmark, via Scholars’ Passage, reached Room 25 at 08:34. Its p50 and p95 were 8.3 ms and 9.2 ms, its largest frame near an activation was 33.4 ms, and it recorded zero holds. East Range and the cloister activated in 6.1 and 7.3 ms respectively.

The decoded estimate counts 2,197,470 geometry-buffer bytes and 58,504,748 bytes of mipmapped texture data in shared templates and live placements. At the sampled three-area overlap, Chrome reported 384 uploaded geometries and 98 uploaded textures, with zero shadow maps. The stable retained counts after ten alternating loops were verified by the regression suite.

The product owner marked V3 complete. The legacy prototype’s previously measured 2,688 B startup overage remained open at this stage. The legacy entry and its runtime resources have no V3 byte delta.

## 11. Stage V4 courtyard, tower and final review

The belfry has stepped limestone courses, alternating quoins, twin recessed louvred openings on all four faces, and a crenellated crown with four pointed pinnacles. It stands on the existing tower axis at X 17.7, Z 28.5 and remains owned by West Cloister. From the stair lookout, the crown rises above the lower teaching-room slate roof.

The existing ranges have three window rhythms. The east range surrounds a gabled oak gate and small dated plaque with paired lancets. The north range has taller transomed hall windows, and the low south and arrival ranges have flat-headed mullioned windows. The panes sit behind masonry reveals. Continuous slate courses and closed roof ends replace repeated overlapping roof sections. Pale flags and a clipped lawn bring the court to the foot of the ranges, with a wider path beside the tower.

The textured stone piers meet the arcade caps at the original springing height. The coping follows the original barrier. At the north passage, the end wall uses the existing vault stone. The roof over Room 25 and the stonework beneath the lookout terminate against the existing walls and reveals. One edge of the distant stair roof was briefly visible through the south porch at jump height during the first V4 sweep. A full gable at the far court junction closes that gap. The original layout, colliders, apertures, navigation signs, door definitions, streaming regions and timetable match V3.

The exterior uses one First Court runtime GLB with area-owned variants, the existing vault stone texture and compact ashlar, slate and lawn textures. Rebuild it with `blender -b --python-exit-code 1 --python scripts/build_first_court_exterior.py`.

### Matched first-person views

Each pair uses the same camera position, eye height, look target and 1440 × 900 viewport in Chrome. The two tower views use the original cloister and stair lookout positions.

| View | V3 | V4 |
| --- | --- | --- |
| Tower from the cloister | [Before](references/first-court-v4/cloister-tower-before.jpg) | [After](references/first-court-v4/cloister-tower-after.jpg) |
| Tower from the lookout | [Before](references/first-court-v4/lookout-tower-before.jpg) | [After](references/first-court-v4/lookout-tower-after.jpg) |
| East range and gate across the court | [Before](references/first-court-v4/cloister-court-before.jpg) | [After](references/first-court-v4/cloister-court-after.jpg) |
| Lawn and flagstones at jump height | [Before](references/first-court-v4/cloister-lawn-before.jpg) | [After](references/first-court-v4/cloister-lawn-after.jpg) |
| Lookout recess | [Before](references/first-court-v4/lookout-recess-before.jpg) | [After](references/first-court-v4/lookout-recess-after.jpg) |
| North cloister and range approach | [Before](references/first-court-v4/cloister-north-before.jpg) | [After](references/first-court-v4/cloister-north-after.jpg) |
| Porter’s Lodge and yard | [Before](references/first-court-v4/lodge-yard-before.jpg) | [After](references/first-court-v4/lodge-yard-after.jpg) |

The completed route moves from the tall public reception to warm oak in Scholars’ Passage, austere stone and daylight in the cloister, and the practical teaching bays and furnishings of East Range. [Reception](references/first-court-v4/reception-after.jpg) · [Scholars’ Passage](references/first-court-v4/scholars-passage-after.jpg) · [East Range](references/first-court-v4/east-range-after.jpg) · [Reading Room](references/first-court-v4/reading-room-after.jpg) · [Room 14](references/first-court-v4/schoolroom-after.jpg) · [Room 25](references/first-court-v4/mathematics-after.jpg) · [Parapet and tower in V collision view](references/first-court-v4/collision-outline.jpg)

### Visual defect register

| Defect | Review evidence |
| --- | --- |
| FC-V01, FC-V03 | V2 corrected reception soffit overlap and vault support, and V3 fitted the lower oak bays. [Reception joins](#9-stage-v2-architectural-geometry-review) |
| FC-V02 | V1 fitted Scholars’ Passage and V2 removed the bright corner seam. [Passage views](#8-stage-v1-sample-for-visual-review) |
| FC-V04 | V4 established the shared belfry landmark, pane reveals, masonry and distinct roof profiles. Both views appear above. |
| FC-V05 | V2 closed the exposed recess below the lookout. V4 fitted the visible roof, coping and plinths to the existing walls. See the lookout recess pair above. |
| FC-V06 | V3 replaced the classroom placeholders with optimized desks and standing chalkboards. [Furnished rooms](#10-stage-v3-furnishings-and-room-identities) |
| FC-V07, FC-V08 | V2 closed both vault ends and connected the ribs and north soffit. V4 continued matching stone through the porch. [Vault ends](#9-stage-v2-architectural-geometry-review) |

The distant roofs and recessed glazing remain stylized. At the lookout the existing walls screen the lower court, leaving the belfry framed above the roofs. No remaining seam, overlap or missing shell surface was found from the tested routes.

### Verification

All 123 Node and 96 Chrome regression tests passed. Rays from both viewpoints hit the same cloister-owned belfry, and a new test measures the recess on all four faces. Chrome rendered six matched views at 960 × 540 with adjacent areas loaded and unloaded. All six were pixel-identical. The expanded shared render test covers the south-porch jump and the belfry approach. The WebGL sweep found zero absent-area pixels across 1,877 standing and jump-height poses.

In desktop Chrome the cloister route reached Room 25 at 08:30. The Scholars’ Passage route entered Room 14, then reached Room 25 at 08:35. The untimed walk visited all five accessible rooms, inspected both restricted doors, climbed the lookout and returned to the lodge along the reverse loop in V view. Restart restored the spawn, A+B and closed doors. A separate browser check delayed and rejected an area load. Retry and Resume preserved the clock and position. Browser timeout and retry used an 08:59 test start against the existing 09:00 deadline. The Node tests also exercised the full 45-second allowance and the precedence of a deadline over a hold.

### First Court benchmark

Desktop Chrome 158 on Apple M5 Pro with ANGLE Metal, 1920 × 1080 at DPR 1. Three cache-disabled starts used 25 Mbit/s and 40 ms latency, followed by the timed cloister route unthrottled. The driver resumed after external Pointer Lock pauses and frame statistics cover active play. Resource bytes count encoded response bodies, using the streaming-stage method.

| Metric | V3 reference | V4 reference | Existing target |
| --- | ---: | ---: | ---: |
| Startup resources | 7,596,007–7,596,342 B | 8,317,446–8,317,781 B | ≤ 8 MiB |
| Median Start enabled | 2.844 s | 3.110 s | ≤ 7 s |
| GLB bodies at startup | 6,679,404 B | 7,401,928 B | — |
| First Court manifest | 75,119 B | 74,034 B | — |
| Shared JavaScript / levels index | 100,161 / 41,041 B | 100,161 / 41,041 B | — |
| Full first visit | 7,596,007–7,596,342 B | 8,317,446–8,317,781 B | ≤ 16 MiB |
| Estimated peak decoded assets | 57.89 MiB | 59.87 MiB | ≤ 256 MiB |
| Route p50 frame intervals | 8.3 / 8.3 / 8.3 ms | 8.3 / 8.3 / 8.3 ms | — |
| Route p95 frame intervals | 9.1 / 9.1 / 9.1 ms | 9.1 / 9.1 / 9.2 ms | ≤ 16.7 ms |
| Maximum frame within ±1 s of East Range activation | 33.3 / 33.4 / 25.8 ms | 41.7 / 33.3 / 33.3 ms | ≤ 50 ms |
| Maximum frame within ±1 s of Gatehouse reactivation | 9.4 / 9.4 / 9.3 ms | 9.4 / 9.2 / 9.4 ms | ≤ 50 ms |
| East Range request to activation | 7.0 / 5.2 / 2.5 ms | 5.8 / 5.0 / 4.8 ms | Cold ≤ 2 s |
| Gatehouse request to reactivation | 4.6 / 9.1 / 9.3 ms | 9.5 / 9.1 / 8.1 ms | Warm ≤ 150 ms |
| Streaming holds | 0 / 0 / 0 | 0 / 0 / 0 | 0 |

V4 adds 721,439 B to the V3 reference maximum. The 803,704 B exterior GLB replaces the 81,180 B First Court courtyard asset, and the manifest shrank by 1,085 B. The worst V4 start is 70,827 B under 8 MiB and 95,459 B below the original streaming-stage maximum. After Start the first visit made zero additional GLB requests. A fourth route through Scholars’ Passage arrived at 08:34 with p95 9.1 ms and zero holds. East Range and the cloister activated in 5.9 ms and 6.2 ms, with nearby maximum frames of 9.3 ms and 33.5 ms.

At the three-area overlap the estimate counts 2,874,306 geometry-buffer bytes and 59,907,848 bytes of mipmapped textures across live instances and shared templates. Chrome reported 398 uploaded geometries and 101 textures with zero fixtures or shadow maps. In a separate ten-loop alternating run, the settled A+B pose retained 19 templates, 970 objects, 690 live geometries, 92 textures, 374 colliders and 58,448,090 decoded bytes throughout. Uploaded geometry and textures alternated between 295–327 and 89–92 with no growth. The 30 warm activations took 1.1–3.1 ms and had zero holds.

The browser’s post-GC JavaScript heap ranged from 7.94 to 9.11 MB across those ten loops, measured separately from the retained assets.

### Legacy prototype and acceptance

Three fresh six-classroom prototype starts again measured 16,779,904 B, or 2,688 B over the 16 MiB limit. That matches the streaming-stage measurement and is 11,304 B above milestone 19.5. The 5.951 s median ready time, 9.0 / 9.2 / 9.1 ms route p95 and 238.14 MiB decoded estimate meet their limits. All three timed walks visited Rooms 003 and 101 before completing in Room 102. The default hallway and Physics Playground passed their desktop movement checks. [Milestone 19.5 benchmark](connected-school-architecture.md#browser-comparison)

First Court meets the measured technical gates and is ready for visual approval. The legacy byte exception and an unfamiliar player’s first timed attempt remain open for milestone acceptance. [Acceptance review](milestone-20-new-school.md#9-final-milestone-20-review)

## 12. Architectural finish consistency pass

The first fitted oak stopped at the initial Scholars’ turn. Farther along, flat dado boxes took over, and classroom and East Range finishes covered only selected walls. The finish pass uses the same oak profile and material families through each zone. Stone door and passage reveals mark the changes between zones.

| Zone | Finish scheme |
| --- | --- |
| Reception | Continuous oak and limewash around the side aisles and gables. The panelling stops at the lodge and passage openings. Flagstones, side soffits and the tall stone vault define the public hall. |
| Scholars’ Passage, Reading Room leg and north cross passage | The sample’s 1.065 m oak cap, recessed panels, stepped skirting and warm limewash continue through the two turns. Mitred profiles follow wall returns, and dedicated oak jambs end the dado at Rooms 13–15. Continuous ceiling plates carry transverse ties. Straight lengths of the same runner leave exposed boards at the turns and stone portals. |
| Scholars’ vestibule and East Range | The vestibule carries the passage oak, limewash, runner and ceiling assembly through the area boundary. Its low stone opening leads to the taller East Range hall, with cream limewash, darker oak, bare boards and a wider tie-beam assembly. Stone jambs finish the entrance to the lookout stair. |
| West Cloister and porches | Existing weathered stone ties the arcade, spine, porch walls, soffits and doorway reveals together. Flagstones continue under the vault and porches. |
| Five accessible rooms | The lodge has a lower oak dado below its window. Rooms 14 and 15 carry warm limewash and oak around their perimeters. Mathematics uses pale sage limewash and the same oak profile. The Reading Room keeps its existing rug, and the cloakroom uses washable limewash and a low stone plinth over flags. |
| Lookout stair and landing | Limewash continues up the stairwell, with weathered stone at the entrance, sill and window reveals. |

The rebuilt meshes reuse the First Court runtime bundles and continue to hide in collision view. The manifest retains the same structural dimensions, collision placements, doors, room data, schedule and streaming regions. The exports omit unused texture coordinates on solid-colour meshes to reduce download and geometry storage.

### Matched first-person views

The 29 pairs use desktop Chrome at 1440 × 900, with identical camera positions, look targets and open door states in both images. The fixed views cover the beginning, middle, end and junctions of each route leg, plus the five accessible room interiors and the lookout landing. [Scholars’ turn in collision view](references/first-court-finishes/collision-outline.jpg)

| Route | View | Before | After |
| --- | --- | --- | --- |
| Reception | Entry | [Before](references/first-court-finishes/reception-entry-before.jpg) | [After](references/first-court-finishes/reception-entry-after.jpg) |
|  | Middle aisle | [Before](references/first-court-finishes/reception-middle-before.jpg) | [After](references/first-court-finishes/reception-middle-after.jpg) |
|  | Fork | [Before](references/first-court-finishes/reception-fork-before.jpg) | [After](references/first-court-finishes/reception-fork-after.jpg) |
|  | Scholars threshold | [Before](references/first-court-finishes/scholars-reception-threshold-before.jpg) | [After](references/first-court-finishes/scholars-reception-threshold-after.jpg) |
| Scholars’ Passage | Start | [Before](references/first-court-finishes/scholars-start-before.jpg) | [After](references/first-court-finishes/scholars-start-after.jpg) |
|  | Room 14 threshold | [Before](references/first-court-finishes/scholars-schoolroom-before.jpg) | [After](references/first-court-finishes/scholars-schoolroom-after.jpg) |
|  | First turn | [Before](references/first-court-finishes/scholars-first-turn-before.jpg) | [After](references/first-court-finishes/scholars-first-turn-after.jpg) |
|  | Return toward Room 15 | [Before](references/first-court-finishes/scholars-return-before.jpg) | [After](references/first-court-finishes/scholars-return-after.jpg) |
|  | Reading Room leg | [Before](references/first-court-finishes/scholars-reading-before.jpg) | [After](references/first-court-finishes/scholars-reading-after.jpg) |
|  | Turn to north cross passage | [Before](references/first-court-finishes/scholars-north-turn-before.jpg) | [After](references/first-court-finishes/scholars-north-turn-after.jpg) |
| North cross passage | Middle | [Before](references/first-court-finishes/cross-passage-before.jpg) | [After](references/first-court-finishes/cross-passage-after.jpg) |
|  | Stone threshold into East Range | [Before](references/first-court-finishes/cross-threshold-before.jpg) | [After](references/first-court-finishes/cross-threshold-after.jpg) |
|  | End, looking back | [Before](references/first-court-finishes/cross-passage-end-before.jpg) | [After](references/first-court-finishes/cross-passage-end-after.jpg) |
|  | Vestibule into East Range hall | [Before](references/first-court-finishes/east-vestibule-before.jpg) | [After](references/first-court-finishes/east-vestibule-after.jpg) |
| West Cloister | South porch | [Before](references/first-court-finishes/cloister-south-porch-before.jpg) | [After](references/first-court-finishes/cloister-south-porch-after.jpg) |
|  | Vault start | [Before](references/first-court-finishes/cloister-start-before.jpg) | [After](references/first-court-finishes/cloister-start-after.jpg) |
|  | Middle and Room 24 | [Before](references/first-court-finishes/cloister-middle-before.jpg) | [After](references/first-court-finishes/cloister-middle-after.jpg) |
|  | Vault end and north porch | [Before](references/first-court-finishes/cloister-end-before.jpg) | [After](references/first-court-finishes/cloister-end-after.jpg) |
|  | East Range threshold | [Before](references/first-court-finishes/cloister-east-threshold-before.jpg) | [After](references/first-court-finishes/cloister-east-threshold-after.jpg) |
| East Range | Start from cloister | [Before](references/first-court-finishes/east-start-before.jpg) | [After](references/first-court-finishes/east-start-after.jpg) |
|  | Middle and Room 25 | [Before](references/first-court-finishes/east-middle-before.jpg) | [After](references/first-court-finishes/east-middle-after.jpg) |
|  | End by the map store | [Before](references/first-court-finishes/east-end-before.jpg) | [After](references/first-court-finishes/east-end-after.jpg) |
|  | Stair entrance | [Before](references/first-court-finishes/east-stair-before.jpg) | [After](references/first-court-finishes/east-stair-after.jpg) |
|  | Lookout landing | [Before](references/first-court-finishes/lookout-landing-before.jpg) | [After](references/first-court-finishes/lookout-landing-after.jpg) |
| Rooms | Porter’s lodge | [Before](references/first-court-finishes/lodge-before.jpg) | [After](references/first-court-finishes/lodge-after.jpg) |
|  | Room 14 Schoolroom | [Before](references/first-court-finishes/schoolroom-before.jpg) | [After](references/first-court-finishes/schoolroom-after.jpg) |
|  | Room 15 Reading Room | [Before](references/first-court-finishes/reading-room-before.jpg) | [After](references/first-court-finishes/reading-room-after.jpg) |
|  | Room 24 Cloakroom | [Before](references/first-court-finishes/cloakroom-before.jpg) | [After](references/first-court-finishes/cloakroom-after.jpg) |
|  | Room 25 Mathematics | [Before](references/first-court-finishes/mathematics-before.jpg) | [After](references/first-court-finishes/mathematics-after.jpg) |

### Verification

All 123 Node and 96 shared Chrome tests passed. Finish regressions verify oak cap height, limewash, runners and ceiling ties on the passage legs, along with visible plaques, collision overlays and fitted masonry at the openings. Chrome compared 15 views with neighbouring areas loaded and unloaded. The standing and jump-height WebGL sweep found zero visible pixels from absent areas across 1,877 poses.

With pointer lock in desktop Chrome, the timed Cloister route reached Room 25 at 08:30. The Scholars’ Passage route visited Room 14 first and reached Room 25 at 08:35. The untimed walk entered all five accessible rooms, checked both restricted doors, climbed to the lookout, returned in collision view and restarted at the original spawn with the doors closed.

The benchmark used Chrome 158 on Apple M5 Pro at 1920 × 1080, DPR 1, with cache-disabled starts at 25 Mbit/s and 40 ms latency. Three Cloister routes and one Scholars’ Passage route ran unthrottled after startup.

| Metric | Finish pass | Existing target |
| --- | ---: | ---: |
| Startup and full first-visit resources | 8,372,370–8,372,705 B | Startup ≤ 8 MiB, first visit ≤ 16 MiB |
| Median Start enabled | 3.095 s | ≤ 7 s |
| Peak estimated decoded assets | 60.24 MiB | ≤ 256 MiB |
| Active route p95 frame interval | 8.4 ms | ≤ 16.7 ms |
| Maximum frame within ±1 s of any activation | 41.7 ms | ≤ 50 ms |
| Longest request to area activation | 9.0 ms | Cold ≤ 2 s, warm ≤ 150 ms |
| Streaming holds | 0 | 0 |

Peak startup transfer was 15,903 B below 8 MiB. Each first visit loaded its GLBs at startup. The finish pass awaits visual review as part of milestone 20. [Milestone acceptance record](milestone-20-new-school.md#9-final-milestone-20-review)

### Offline finish preset

The product owner approved this pilot as the foundation for future school expansion.

The Scholars’ Passage and East Range vestibule builders share one preset for the limewash and oak palette, cap height, and runner width and pattern spacing. The builders refer to named wall platforms and lintels in the First Court manifest. The passage also uses the existing masonry head placements and door profile for the oak reveals. When editing the layout, keep the two wall bays across each opening aligned so they can carry one continuous ceiling plate. Author the bespoke turns, stone threshold stops, tie positions and runner lengths in the builders.

Rebuild from the repository root with Blender’s offline Python.

```sh
blender --background --python-exit-code 1 --python scripts/build_scholars_passage.py
blender --background --python-exit-code 1 --python scripts/build_first_court_interiors.py
```

Both GLBs rebuilt byte-for-byte against the finish-pass exports. A temporary manifest check moved wall faces, widened and moved the Bursar opening, and raised its arch spring. The corresponding panel runs and jambs followed those edits. Missing and duplicate references and misaligned passage bays raised build errors. All 123 Node and 96 Chrome tests passed.
