# First Court — visual quality specification and defect review

**Status:** Stage V1 is provisionally accepted. Stage V2 is implemented and awaits product-owner review. Stage V3 and V4 remain proposed.

**Scope:** The existing seven-room First Court, without layout changes, additional rooms, inventory, changes to the Mathematics timetable, or changes to the approved area-streaming architecture.

**References:** [Visual target sheet](first-court-visual-references.md) · [Current screenshots](references/first-court-visual-review/review-contact-sheet.jpg) · [Established historic-school reference](historic-school-reference.md) · [Historic slice](historic-slice.md) · [First Court blockout](first-court-blockout.md) · [Product vision](../VISION.md).

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

The known classroom furnishing and exterior composition issues, including the tower’s simple silhouette, remain for their proposed stages. The architectural sample awaits owner review.
