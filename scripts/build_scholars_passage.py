"""Build the fitted Scholars' Passage finishes with Blender's offline Python."""

import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from build_vaulted_bays import Mesh, OUTPUT
from architectural_finishes import (
    FIRST_COURT_MANIFEST, PORTAL_CASING_WIDTH, finish_source, oak_ties, oak_wall_plates, passage_box,
    platform_edge, portal_wall, runner_material, runner_strip, scholars_materials, scholars_panelling,
)


def passage_wall_face(before, after, inward):
    """Keep the ceiling plate on one line across the doorway."""
    face = platform_edge(before, 'x', inward)
    if not np.isclose(face, platform_edge(after, 'x', inward), rtol=0, atol=1e-9):
        raise ValueError(f"Finish faces do not align across the opening between {before['name']!r} and {after['name']!r}")
    return face


def build(temporary):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    plaster, wood, trim, runner = Mesh(), Mesh(), Mesh(), Mesh()
    manifest = json.loads(FIRST_COURT_MANIFEST.read_text())
    gatehouse = finish_source(manifest['areas'], 'gatehouse', key='id')['definition']
    walls = gatehouse['platforms']
    west_before = finish_source(walls, 'West school wall bay 1')
    west_after = finish_source(walls, 'West school wall bay 2')
    east_before = finish_source(walls, 'East school wall bay 1')
    east_after = finish_source(walls, 'East school wall bay 2')
    reading_before = finish_source(walls, 'Library wall bay 1')
    reading_after = finish_source(walls, 'Library wall bay 2')
    reception_end = platform_edge(finish_source(walls, 'Reception gable lintel 1'), 'z', 1)
    west_face = passage_wall_face(west_before, west_after, 1)
    east_face = passage_wall_face(east_before, east_after, -1)
    east_turn_end = platform_edge(east_after, 'z', 1)
    reading_face = passage_wall_face(reading_before, reading_after, 1)
    paths = [
        # West wall past the bursary, then around the outside of the first turn.
        [(west_face, platform_edge(west_before, 'z', 1) - PORTAL_CASING_WIDTH), (west_face, reception_end)],
        [(reading_face, platform_edge(reading_before, 'z', 1) - PORTAL_CASING_WIDTH), (reading_face, 23.32),
         (west_face, 23.32), (west_face, platform_edge(west_after, 'z', -1) + PORTAL_CASING_WIDTH)],
        # East wall past the Schoolroom, around the short return and the north turn.
        [(east_face, reception_end), (east_face, platform_edge(east_before, 'z', 1) - PORTAL_CASING_WIDTH)],
        [(east_face, platform_edge(east_after, 'z', -1) + PORTAL_CASING_WIDTH), (east_face, east_turn_end),
         (east_after['x'], east_turn_end), (east_after['x'], 20.68),
         (-11.68, 20.68), (-11.68, 40.68), (9.82, 40.68)],
        [(9.82, 43.32), (reading_face, 43.32), (reading_face, platform_edge(reading_after, 'z', -1) + PORTAL_CASING_WIDTH)],
    ]
    scholars_panelling(plaster, wood, trim, paths, 4)

    for head, side in [('Bursar masonry head', 1), ('Gatehouse schoolroom door arched head', -1),
                       ('Reading room door arched head', 1)]:
        portal_wall(plaster, gatehouse, manifest['doorProfiles'], head, side, 4)

    # Run the plates around the turns and seat a tie at each leg of the approach.
    perimeter = [
        (west_face, reception_end), (east_face, reception_end), (east_face, east_turn_end),
        (east_after['x'], east_turn_end), (east_after['x'], 20.68),
        (-11.68, 20.68), (-11.68, 40.68), (9.82, 40.68), (9.82, 43.32),
        (reading_face, 43.32), (reading_face, 23.32), (west_face, 23.32), (west_face, reception_end),
    ]
    oak_wall_plates(trim, perimeter, 4)
    oak_ties(trim, 'z', west_face, east_face, 4, (8.2, 12.55, 16.9))
    oak_ties(trim, 'x', 20.68, 23.32, 4, (-17, -14.57))
    oak_ties(trim, 'z', -14.32, -11.68, 4, (23.63, 27.68, 32.25, 36.5))
    oak_ties(trim, 'x', 40.68, 43.32, 4, (-10, -6, -2, 2, 6))

    passage_box(trim, (-21.13, 1.106, 15.67), (-21.002, 1.142, 16.93), 0.67)
    for z in (15.80, 16.80):
        passage_box(trim, (-21.13, 1.063, z - 0.019), (-21.044, 1.107, z + 0.019), 0.67)

    # Straight lengths of the same runner leave bare boards at both turns and the stone sill.
    runner_strip(runner, 'z', -19.8, 5.18, 19.68)
    runner_strip(runner, 'x', 22, -18.93, -14.12)
    runner_strip(runner, 'z', -13, 24.48, 39.96)
    runner_strip(runner, 'x', 42, -11.42, 8.87)
    for mesh, material in zip((plaster, wood, trim), scholars_materials(temporary)):
        mesh.make_object(material.name, material)
    runner.make_object('Worn Scholars Passage runner', runner_material(temporary))
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / 'scholars_passage.glb'), export_format='GLB',
                              export_image_format='AUTO', export_yup=True)


if __name__ == '__main__':
    with TemporaryDirectory() as directory:
        build(directory)
