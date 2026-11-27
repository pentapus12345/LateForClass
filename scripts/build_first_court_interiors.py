"""Build First Court's small custom fittings, surfaces and decorative prints."""

import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from build_vaulted_bays import Mesh, OUTPUT
from build_collegiate_bay import material_with_image
from build_first_court_joints import finish
from build_scholars_passage import (
    FIRST_COURT_MANIFEST, PORTAL_CASING_WIDTH, finish_source, oak_ties, oak_wall_plates, panelled_walls,
    passage_box, platform_edge, portal_wall, reuse_wall_material, runner_material, runner_strip, scholars_materials,
    scholars_panelling, wall_faces,
)


def image_material(temporary, name, colors):
    height, width, _ = colors.shape
    pixels = np.ones((height, width, 4), dtype=np.float32)
    pixels[..., :3] = np.clip(colors, 0, 1)
    image = bpy.data.images.new(name, width=width, height=height, alpha=False)
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = str(Path(temporary) / (name + '.jpg'))
    image.file_format = 'JPEG'
    image.save(quality=84)
    return material_with_image(name, image.filepath_raw)


def woven_rug(temporary):
    y, x = np.indices((128, 112))
    u = np.minimum(x, 111 - x)
    v = np.minimum(y, 127 - y)
    edge = np.minimum(u, v)
    colors = np.broadcast_to([0.22, 0.25, 0.215], (128, 112, 3)).copy()
    colors[edge < 15] = [0.145, 0.103, 0.09]
    colors[(edge == 4) | (edge == 11) | (edge == 14)] = [0.39, 0.297, 0.18]
    diamond = np.abs(x - 55.5) / 32 + np.abs(y - 63.5) / 43
    colors[(diamond > 0.78) & (diamond < 1.0)] = [0.33, 0.27, 0.17]
    colors[diamond < 0.34] = [0.27, 0.245, 0.16]
    yarn = np.random.default_rng(15).normal(0, 0.014, x.shape) + 0.012 * (-1.0) ** (x + y)
    return image_material(temporary, 'Worn sage and russet wool', colors + yarn[..., None])


def quadrangle_print(temporary):
    # An original line study of an arcade. The paper tint keeps it legible
    # at game distance without importing a photograph.
    y, x = np.indices((144, 192))
    tone = np.random.default_rng(20).normal(0.81, 0.016, x.shape)
    tone[(((x == 12) | (x == 179)) & (y >= 16) & (y < 129)) |
         (((y == 16) | (y == 128)) & (x >= 12) & (x <= 179))] = 0.36
    tone[(x > 25) & (x < 166) & (y >= 92) & (y <= 96)] = 0.28
    tone[(x > 23) & (x < 169) & ((y == 61) | (y == 45) | (y == 39))] = 0.28
    for center in (43, 70, 97, 124, 151):
        age = np.abs(x - center)
        pointed = 78 + (12 - age) * 0.82
        opening = (age < 12) & (y >= 46) & (y < pointed)
        tone[opening] = 0.50
        tone[opening & ((age > 9) | (y > pointed - 2) | (x == center))] = 0.24
        tone[(age < 5) & (y > 100) & (y < 112)] = 0.26
    tone[(x > 33) & (x < 159) & (y < 38) & (y > 26) & ((x + y * 2) % 9 == 0)] = 0.47
    return image_material(temporary, 'Ink study of a cloister', tone[..., None] * [1, 0.93, 0.79])


def reading_room(oak, dark, frame, gilt, paper, cloth):
    wall = -19.795
    # Separate the print, bevel and original wall surface in depth.
    paper.quad([(wall, -34.70, 1.56), (wall, -32.74, 1.56), (wall, -32.74, 2.61), (wall, -34.70, 2.61)],
               [(0, 0), (1, 0), (1, 1), (0, 1)])
    for inset, mesh in [(0, frame), (0.045, gilt)]:
        thickness = 0.045 if not inset else 0.013
        left, right, bottom, top = 32.67 + inset, 34.77 - inset, 1.49 + inset, 2.68 - inset
        for a, b, low, high in [(left, right, bottom, bottom + thickness), (left, right, top - thickness, top),
                                (left, left + thickness, bottom + thickness, top - thickness),
                                (right - thickness, right, bottom + thickness, top - thickness)]:
            passage_box(mesh, (wall - 0.010, low, a), (wall + 0.027, high, b), 0.75)

    cloth.quad([(-19.51, -30.56, 0.008), (-16.31, -30.56, 0.008),
                (-16.31, -34.7, 0.008), (-19.51, -34.7, 0.008)][::-1],
               [(0, 0), (1, 0), (1, 1), (0, 1)][::-1])
    # The shared fitted table uses a solid collider around the visible footprint.
    passage_box(oak, (-0.78, 0.725, -0.395), (0.78, 0.785, 0.395), 0.86)
    passage_box(dark, (-0.73, 0.59, -0.33), (0.73, 0.731, 0.33), 0.86)
    for x in (-0.665, 0.665):
        for z in (-0.285, 0.285):
            passage_box(oak, (x - 0.047, 0, z - 0.047), (x + 0.047, 0.62, z + 0.047), 0.74)


def lodge(oak, dark, brass, paper):
    # Fit the counter and bench within their original collision footprints.
    passage_box(oak, (-27, 0.92, -0.65), (-23.70, 1, 0.30), 0.95)
    passage_box(dark, (-26.95, 0.065, -0.585), (-23.75, 0.934, 0.27), 0.84)
    for x in (-26.71, -25.76, -24.81):
        passage_box(oak, (x, 0.15, -0.625), (x + 0.8, 0.86, -0.583), 0.72)
        passage_box(dark, (x + 0.07, 0.208, -0.637), (x + 0.73, 0.805, -0.624), 0.65)
    passage_box(oak, (-27.49, 0.385, -6.59), (-24.81, 0.45, -5.96), 0.92)
    for x in (-27.28, -26.17, -25.08):
        passage_box(dark, (x - 0.09, 0, -6.47), (x + 0.09, 0.39, -6.07), 0.72)
    passage_box(dark, (-27.43, 0.42, -6.59), (-24.87, 0.68, -6.48), 0.90)

    # Staff cubbies over the counter. Open compartments show the back and their dividers.
    for y in (1.22, 1.62, 2.02):
        passage_box(oak, (-26.85, y, 0.43), (-24.25, y + 0.041, 0.823), 0.85)
    for x in np.linspace(-26.85, -24.30, 6):
        passage_box(oak, (x, 1.239, 0.437), (x + 0.052, 2.058, 0.82), 0.85)
    passage_box(dark, (-26.83, 1.24, 0.806), (-24.28, 2.04, 0.828), 0.86)
    for x, y in [(-26.68, 1.263), (-25.67, 1.663), (-24.61, 1.263)]:
        passage_box(paper, (x, y, 0.49), (x + 0.27, y + 0.034, 0.76), 0.6)
        passage_box(paper, (x + 0.03, y + 0.035, 0.515), (x + 0.21, y + 0.051, 0.74), 0.6)
    passage_box(dark, (-25.29, 1.004, -0.41), (-24.86, 1.036, -0.08), 0.67)
    passage_box(paper, (-25.25, 1.032, -0.392), (-24.895, 1.048, -0.098), 0.59)
    passage_box(brass, (-24.42, 1.004, -0.40), (-24.30, 1.047, -0.33), 0.5)


def cloakroom(oak, green, grey):
    # Practical shelf above the existing peg rail and two hanging work aprons.
    passage_box(oak, (-4.316, 1.89, 20.78), (-4.03, 1.945, 25.16), 0.93)
    for mesh, z, hem in [(green, 22.47, 0.56), (grey, 24.63, 0.72)]:
        # Fold the hanging cloth over two shallow ridges to catch the light.
        edges = [(z - 0.22, -4.14), (z - 0.10, -4.005), (z + 0.04, -4.055), (z + 0.23, -4.15)]
        for (za, xa), (zb, xb) in zip(edges, edges[1:]):
            mesh.quad([(xa, -za, hem), (xb, -zb, hem), (-4.034, -(z + (zb - z) * 0.28), 1.57),
                       (-4.034, -(z + (za - z) * 0.28), 1.57)][::-1],
                      [(0, 0), (1, 0), (1, 1), (0, 1)][::-1])


def chalk_line(mesh, start, end, width=0.006):
    a, b = np.array(start), np.array(end)
    delta = b - a
    cross = np.array([-delta[1], delta[0]]) * (width / (2 * np.linalg.norm(delta)))
    outline = [a - cross, b - cross, b + cross, a + cross]
    # The reused board tilts back. Follow its plane with a 2 mm offset in
    # local model units so the writing stays clear at the two placement scales.
    mesh.quad([(-x, 0.3695 - 0.21255 * y, y) for x, y in outline],
              [(0, 0), (1, 0), (1, 1), (0, 1)])


def chalk_letter(mesh, letter, x, y, size):
    strokes = {
        'A': [[(0, 0), (0.3, 1), (0.6, 0)], [(0.11, 0.38), (0.49, 0.38)]],
        'B': [[(0, 0), (0, 1), (0.45, 1), (0.57, 0.85), (0.49, 0.63), (0, 0.52),
               (0.48, 0.52), (0.62, 0.34), (0.54, 0.09), (0.43, 0), (0, 0)]],
        'C': [[(0.59, 0.86), (0.43, 1), (0.16, 0.93), (0.02, 0.62),
               (0.02, 0.32), (0.16, 0.06), (0.44, 0.01), (0.60, 0.16)]],
        'I': [[(0.08, 0), (0.52, 0)], [(0.30, 0), (0.30, 1)], [(0.08, 1), (0.52, 1)]],
        'V': [[(0, 1), (0.27, 0), (0.60, 1)]]
    }
    for stroke in strokes[letter]:
        points = [(x + u * size, y + v * size) for u, v in stroke]
        for start, end in zip(points, points[1:]):
            chalk_line(mesh, start, end, size * 0.075)


def build(temporary):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    plaster = reuse_wall_material('Aged lime plaster', 'Warm interior limewash', temporary, (0.78, 0.73, 0.64), 0.32)
    oak = reuse_wall_material('Panelled oak', 'Fitted oak', temporary, (0.39, 0.208, 0.091), 0.27)
    dark = reuse_wall_material('Panelled oak', 'Recessed oak', temporary, (0.26, 0.13, 0.057), 0.27)
    brass = finish('a28758', 'Aged brass')
    sheets = finish('c6b38b', 'Unbleached paper')
    green = finish('67745a', 'Olive work cloth')
    grey = finish('796565', 'Dull plum work cloth')
    chalk = finish('c1c3aa', 'Worn chalk strokes')

    def group(name, parts):
        root = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(root)
        for label, mesh, material in parts:
            use_uv = any(node.type == 'TEX_IMAGE' for node in material.node_tree.nodes)
            mesh.make_object(label, material, use_uv=use_uv)
        for obj in bpy.context.collection.objects:
            if obj.type == 'MESH' and obj.parent is None:
                obj.parent = root

    manifest = json.loads(FIRST_COURT_MANIFEST.read_text())
    profiles = manifest['doorProfiles']
    gatehouse = finish_source(manifest['areas'], 'gatehouse', key='id')['definition']
    east_range = finish_source(manifest['areas'], 'east-range', key='id')['definition']
    cloister = finish_source(manifest['areas'], 'west-cloister', key='id')['definition']
    casing = PORTAL_CASING_WIDTH

    def room_finish(name, paths, top, wall_material=plaster, height=1, extra_plaster=(), portal=None):
        wall, panel, trim = Mesh(), Mesh(), Mesh()
        for path in paths:
            panelled_walls(wall, panel, trim, path, top, height)
        for path, bottom, ceiling in extra_plaster:
            wall_faces(wall, path, bottom, ceiling)
        if portal:
            area, head, side, ceiling = portal
            portal_wall(wall, area, profiles, head, side, ceiling)
        group(name, [('Limewash', wall, wall_material), ('Recessed panels', panel, dark), ('Oak mouldings', trim, oak)])

    # Both sides of the hall wrap onto the gables. The oak stops at the three portals.
    room_finish('ReceptionFinish', [
        [(-21.82, -3.9 - casing), (-21.82, -15.82), (-6.18, -15.82), (-6.18, 1)],
        [(-20.8, 3.82), (-21.82, 3.82), (-21.82, -2.1 + casing)],
        [(-6.18, 3), (-6.18, 3.82), (-18.8, 3.82)],
    ], 4.55, portal=(gatehouse, 'Porter’s door arched head', 1, 4.55), extra_plaster=[
        # Continue the same finish above the side soffits into the vault.
        ([(-21.82, -15.82), (-6.18, -15.82)], 4.55, 9),
        ([(-6.18, 3.82), (-21.82, 3.82)], 4.55, 9),
        ([(-18.8, 3.82), (-20.8, 3.82)], 3.2, 4.55),
    ])

    room_finish('LodgeFinish', [
        [(-22.18, -2.1 + casing), (-22.18, 0.82), (-28.82, 0.82), (-28.82, -6.82),
         (-22.18, -6.82), (-22.18, -3.9 - casing)],
    ], 0.944, height=0.88, portal=(gatehouse, 'Porter’s door arched head', -1, 3.8), extra_plaster=[
        # A lower dado fits below the sill. Leave the opening and its reveals in stone.
        ([(-22.18, -2.1 + casing), (-22.18, 0.82), (-28.82, 0.82), (-28.82, -1.2)], 0.944, 3.8),
        ([(-28.82, -4.8), (-28.82, -6.82), (-22.18, -6.82), (-22.18, -3.9 - casing)], 0.944, 3.8),
    ])

    room_finish('SchoolroomFinish', [
        [(-18.12, 15.1 - casing), (-18.12, 12.18), (-11.48, 12.18), (-11.48, 19.82),
         (-18.12, 19.82), (-18.12, 16.9 + casing)],
    ], 4, portal=(gatehouse, 'Gatehouse schoolroom door arched head', 1, 4))
    room_finish('ReadingRoomFinish', [
        [(-14.68, 32.9 + casing), (-14.68, 35.32), (-19.82, 35.32), (-19.82, 28.68),
         (-14.68, 28.68), (-14.68, 31.1 - casing)],
    ], 4, portal=(gatehouse, 'Reading room door arched head', -1, 4))

    # The vestibule belongs to the passage until its low opening into the taller range.
    wall, panel, trim, runner = Mesh(), Mesh(), Mesh(), Mesh()
    passage_plaster, passage_field, passage_trim = scholars_materials(temporary)
    range_platforms = east_range['platforms']
    south = platform_edge(finish_source(range_platforms, 'Vestibule south turn bay 1'), 'z', 1)
    north = platform_edge(finish_source(range_platforms, 'Vestibule north side bay 1'), 'z', -1)
    west = platform_edge(finish_source(range_platforms, 'Vestibule west reveal bay 1'), 'x', 1)
    east = platform_edge(finish_source(range_platforms, 'Vestibule east side bay 1'), 'x', -1)
    portal = platform_edge(finish_source(range_platforms, 'Teaching range west wall lintel 1'), 'z', 1)
    # Stop at the finished face of the shared stone threshold.
    threshold = 10.18
    paths = [[(threshold, south), (west, south), (west, portal)],
             [(east, portal), (east, north), (threshold, north)]]
    scholars_panelling(wall, panel, trim, paths, 4)
    perimeter = paths[0] + paths[1] + [paths[0][0]]
    oak_wall_plates(trim, perimeter, 4)
    oak_ties(trim, 'x', south, north, 4, (13.45, 16.52))
    runner_strip(runner, 'x', 42, 11.12, 16.97)
    group('ScholarsVestibule', [('Passage limewash', wall, passage_plaster), ('Passage panels', panel, passage_field),
                               ('Passage mouldings', trim, passage_trim), ('Vestibule runner', runner, runner_material(temporary))])

    range_wall, range_panel, range_trim = Mesh(), Mesh(), Mesh()
    exit_head = 'Library Court passage head'
    exit_center = finish_source(east_range['environmentObjects'], exit_head)['z']
    exit_half_width = profiles['pointedOak']['width'] / 2 + casing
    exit_south, exit_north = exit_center - exit_half_width, exit_center + exit_half_width
    for path in [
        [(10.18, 32.18), (41.82, 32.18), (41.82, exit_south)],
        [(41.82, exit_north), (41.82, 37.82), (40.4 + casing, 37.82)],
        [(38.6 - casing, 37.82), (37.08, 37.82)],
        [(33.92, 37.82), (26.9 + casing, 37.82)],
        [(25.1 - casing, 37.82), (19.52, 37.82)],
        [(16.48, 37.82), (10.18, 37.82), (10.18, 35)],
    ]:
        panelled_walls(range_wall, range_panel, range_trim, path, 4.5)
    for head in ['Mathematics door arched head', 'Map store masonry head']:
        portal_wall(range_wall, east_range, profiles, head, -1, 4.5)
    portal_wall(range_wall, east_range, profiles, exit_head, -1, 4.5)
    portal_wall(range_wall, east_range, profiles, exit_head, 1, 3.55)
    wall_faces(range_wall, [(10.18, 35), (10.18, 33)], 3.45, 4.5)
    oak_wall_plates(range_trim, [(10.18, 32.18), (41.82, 32.18), (41.82, 37.82), (37, 37.82),
                                 (37, 38), (34, 38), (34, 37.82), (10.18, 37.82), (10.18, 32.18)], 4.5)
    oak_ties(range_trim, 'x', 32.18, 37.82, 4.5, (13.5, 19.5, 25.5, 31.5, 37.5))
    group('EastRangeFinish', [('Range limewash', range_wall, plaster), ('Range panels', range_panel, dark),
                              ('Range mouldings and ceiling', range_trim, oak)])

    maths_plaster = reuse_wall_material('Aged lime plaster', 'Pale sage limewash', temporary, (0.71, 0.735, 0.64), 0.24)
    room_finish('MathematicsFinish', [
        [(25.1 - casing, 38.18), (22.18, 38.18), (22.18, 45.82), (29.82, 45.82),
         (29.82, 38.18), (26.9 + casing, 38.18)],
    ], 4.1, maths_plaster, portal=(east_range, 'Mathematics door arched head', 1, 4.1))

    stair = Mesh()
    wall_faces(stair, [(36.82, 38.0), (36.82, 42.57), (34.06, 42.57)], 0, 7.6)
    group('LookoutFinish', [('Stairwell limewash', stair, plaster)])

    cloak_walls = Mesh()
    # The service room keeps washable plaster down to its stone plinth.
    wall_faces(cloak_walls, [(-0.18, 23.9 + casing), (-0.18, 25.82), (-4.32, 25.82),
                            (-4.32, 20.18), (-0.18, 20.18), (-0.18, 22.1 - casing)], 0.145, 4)
    portal_wall(cloak_walls, cloister, profiles, 'Cloakroom door arched head', -1, 4)
    group('CloakroomFinish', [('Service limewash', cloak_walls, plaster)])

    copywork, geometry = Mesh(), Mesh()
    for index, letter in enumerate('ABC'):
        chalk_letter(copywork, letter, -0.29 + index * 0.23, 1.02, 0.23)
        chalk_letter(copywork, letter, -0.27 + index * 0.21, 0.75, 0.15)
    for y in (0.70, 0.96):
        chalk_line(copywork, (-0.31, y), (0.32, y + 0.012), 0.004)
    corners = [(-0.29, 0.64), (0.27, 0.66), (-0.05, 1.10), (-0.29, 0.64)]
    for start, end in zip(corners, corners[1:]):
        chalk_line(geometry, start, end)
    for letter, x, y in [('I', -0.08, 1.27), ('V', 0.02, 1.27), ('A', -0.083, 1.13),
                         ('B', -0.35, 0.53), ('C', 0.25, 0.55)]:
        chalk_letter(geometry, letter, x, y, 0.075)
    group('CopyworkChalk', [('Schoolroom copy exercise', copywork, chalk)])
    group('GeometryChalk', [('Mathematics triangle exercise', geometry, chalk)])

    counter, joinery, metal, paper = Mesh(), Mesh(), Mesh(), Mesh()
    lodge(counter, joinery, metal, paper)
    group('LodgeFittings', [('Enquiry counter and waiting seat', counter, oak), ('Counter panels and pigeonholes', joinery, dark),
                            ('Counter bell', metal, brass), ('Lodge ledgers and post', paper, sheets)])

    table, legs, frame, bead, print_mesh, rug = (Mesh() for _ in range(6))
    reading_room(table, legs, frame, bead, print_mesh, rug)
    # The table's geometry is local. Its collision comes from the ordinary GLB fit.
    group('ReadingTable', [('Reading table oak', table, oak), ('Reading table frame', legs, dark)])
    # The frame is authored alongside the paper, with the older oak and gilt palette.
    group('ReadingFittings', [('Reading room frame', frame, dark), ('Reading room gilt bead', bead, brass),
                              ('The cloister study', print_mesh, quadrangle_print(temporary)),
                              ('Reading room rug', rug, woven_rug(temporary))])

    shelf, apron, spare = Mesh(), Mesh(), Mesh()
    cloakroom(shelf, apron, spare)
    group('CloakroomFittings', [('Peg shelf', shelf, oak), ('Olive apron', apron, green), ('Plum apron', spare, grey)])

    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / 'first_court_interiors.glb'), export_format='GLB')


if __name__ == '__main__':
    with TemporaryDirectory() as directory:
        build(directory)
