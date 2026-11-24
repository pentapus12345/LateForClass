"""Build the mullioned window and the compact quadrangle seen from upstairs."""

from math import pi
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_collegiate_bay import finish_tile
from build_vaulted_bays import Mesh, OUTPUT, door_material, export, profile_solid


def pointed_head(left, right, base, rise, segments=6):
    return [(left + (right - left) * index / segments,
             base + rise * (1 - abs(2 * index / segments - 1)) ** 0.67)
            for index in range(segments + 1)]


def arch_trim(mesh, samples, front, back, thickness):
    for (x, y), (X, Y) in zip(samples, samples[1:]):
        for points in [[(x, front, y), (X, front, Y), (X, front, Y + thickness), (x, front, y + thickness)],
                       [(x, back, y), (X, back, Y), (X, front, Y), (x, front, y)],
                       [(x, front, y + thickness), (X, front, Y + thickness),
                        (X, back, Y + thickness), (x, back, y + thickness)]]:
            mesh.quad(points, [(0, 0), (1, 0), (1, 1), (0, 1)])


def mullioned_window():
    stone = door_material('Cut oolitic limestone', (0.52, 0.47, 0.38), 0.84)
    frame = Mesh()
    frame.box((-0.63, -0.16, 0), (0.63, 0.16, 0.085), 1)
    frame.box((-0.61, -0.105, 2.022), (0.61, 0.105, 2.1), 1)
    for left, right in [(-0.61, -0.513), (-0.043, 0.043), (0.513, 0.61)]:
        frame.box((left, -0.104, 0.085), (right, 0.104, 2.025), 1)
    frame.box((-0.54, -0.065, 1.025), (0.54, 0.065, 1.06), 1)
    for left, right in [(-0.513, -0.043), (0.043, 0.513)]:
        profile_solid(frame, pointed_head(left, right, 1.65, 0.34), 0.15, 2.024)
    frame.make_object('Sill, tracery, transom, and mullions', stone)


def facade_variant(name, materials, gateway=False):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    wall, moldings, panes, roof = Mesh(), Mesh(), Mesh(), Mesh()
    wall.box((-2, -0.22, 0), (2, 0.24, 5.95), 3)
    styles = [(1.02, 1.48, False), (3.52, 1.52, False)]
    if gateway:
        styles[0] = (0.12, 2.73, True)
    for base, height, is_entry in styles:
        centers = [0] if is_entry else [-0.98, 0.98]
        for center in centers:
            half = 0.79 if is_entry else 0.43
            left, right = center - half, center + half
            rise = 0.48 if is_entry else 0.37
            spring = base + height - rise
            samples = pointed_head(left, right, spring, rise)
            for (x, y), (X, Y) in zip(samples, samples[1:]):
                panes.quad([(x, -0.223, base), (X, -0.223, base), (X, -0.223, Y), (x, -0.223, y)],
                           [(0, 0), (1, 0), (1, 1), (0, 1)])
            for low, high in [(left - 0.10, left + 0.03), (right - 0.03, right + 0.10)]:
                moldings.box((low, -0.32, base - 0.032), (high, -0.21, spring), 1)
            arch_trim(moldings, samples, -0.32, -0.21, 0.112)
            moldings.box((left - 0.13, -0.34, base - 0.085), (right + 0.13, -0.21, base), 1)
            if not is_entry:
                moldings.box((center - 0.026, -0.275, base), (center + 0.026, -0.22, spring + rise - 0.019), 1)
                moldings.box((left, -0.28, base + 0.46), (right, -0.22, base + 0.501), 1)
    for z, height in [(0.09, 0.22), (3.14, 0.09), (5.68, 0.14), (5.9, 0.10)]:
        moldings.box((-2, -0.346, z), (2, -0.21, z + height), 1)
    for low, high in [(-2, -1.85), (1.85, 2)]:
        moldings.box((low, -0.25, 0.18), (high, -0.21, 5.7), 1)
    for points in [[(-2.04, -0.45, 6), (2.04, -0.45, 6), (2.04, 0.8, 7.55), (-2.04, 0.8, 7.55)],
                   [(-2.04, 0.8, 7.55), (2.04, 0.8, 7.55), (2.04, 1.57, 6.46), (-2.04, 1.57, 6.46)]]:
        roof.quad(points, [(x / 1.2, z / 1.2) for x, _, z in points])
    roof.box((-2.04, -0.47, 5.98), (2.04, -0.41, 6.052), 1)
    if gateway:
        roof.box((0.78, 0.46, 6.78), (1.46, 1.0, 8.36), 1)
        roof.box((0.71, 0.39, 8.32), (1.53, 1.07, 8.51), 1)
    for mesh, label, material in zip((wall, moldings, panes, roof), ('Ashlar walls', 'Limestone dressings',
                                    'Recessed windows and gate', 'Slate roof'), materials):
        mesh.make_object(label, material)
    for item in bpy.context.scene.objects:
        if item.type == 'MESH' and item.parent is None:
            item.parent = root


def courtyard_range(temporary):
    row, col = np.indices((128, 128)) / 128
    mortar = np.minimum((row * 7) % 1, (col * 4 + 0.5 * ((row * 7).astype(int) % 2)) % 1)
    weathering = 0.98 + 0.11 * np.sin(2 * pi * (3 * row + col))
    ashlar = np.where(mortar < 0.036, 0.76, 1) * weathering
    stone = finish_tile('Warm exterior ashlar', Path(temporary) / 'ashlar.jpg', (0.80, 0.74, 0.64), ashlar)
    slate_courses = np.where((row * 8) % 1 < 0.14, 0.68, 1) + 0.04 * np.sin(pi * 12 * col)
    slate = finish_tile('Graduated slate courses', Path(temporary) / 'slate.jpg', (0.42, 0.47, 0.51), slate_courses)
    materials = [stone, door_material('Dressed window surrounds', (0.72, 0.62, 0.48), 0.84),
                 door_material('Dark window recesses', (0.078, 0.114, 0.129), 0.56), slate]
    facade_variant('RangeBay', materials)
    facade_variant('Gateway', materials, gateway=True)


def courtyard_ground(temporary):
    y, x = np.indices((128, 128)) / 128
    rng = np.random.default_rng(19)
    grain = 1 + 0.055 * np.sin(4 * pi * (x + y)) + rng.normal(0, 0.042, x.shape)
    joints = np.minimum((y * 3) % 1, (x * 4 + 0.5 * ((y * 3).astype(int) % 2)) % 1)
    paving = finish_tile('Pale courtyard paving', Path(temporary) / 'paving.jpg', (0.68, 0.64, 0.54),
                         grain * np.where(joints < 0.048, 0.67, 1))
    grass_tone = 1 + 0.022 * np.sin(2 * pi * (2 * x + y)) + rng.normal(0, 0.033, x.shape)
    grass = finish_tile('Mown quadrangle grass', Path(temporary) / 'grass.jpg', (0.39, 0.49, 0.26), grass_tone)
    pavers = Mesh()
    pavers.box((0, -12, 0), (17.5, 12, 0.24), 2.3)
    pavers.make_object('Continuous paved quadrangle perimeter', paving)
    turf = Mesh()
    turf.box((6.15, -8.25, 0.23), (15.13, 8.25, 0.275), 2.0)
    turf.make_object('Rectangular central lawn', grass)

    shade = 1.04 - 0.16 * y
    blue = finish_tile('Courtyard sky', Path(temporary) / 'sky.jpg', (0.60, 0.76, 0.87), shade)
    nodes = blue.node_tree.nodes
    image = next(node for node in nodes if node.type == 'TEX_IMAGE')
    shader = nodes.get('Principled BSDF')
    blue.node_tree.links.new(image.outputs['Color'], shader.inputs['Emission Color'])
    shader.inputs['Emission Strength'].default_value = 1.0
    blue.node_tree.links.remove(shader.inputs['Base Color'].links[0])
    shader.inputs['Base Color'].default_value = (0, 0, 0, 1)
    background = Mesh()
    for a, b in [((19.5, 19), (19.5, -19)), ((19.5, -19), (0, -19)), ((0, 19), (19.5, 19))]:
        background.quad([(*a, 0), (*b, 0), (*b, 40), (*a, 40)], [(0, 0), (1, 0), (1, 1), (0, 1)])
    background.make_object('Courtyard sky backdrop', blue)


if __name__ == '__main__':
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory() as temporary:
        export('glazed_window_frame', mullioned_window, tangents=False)
        export('courtyard_range', lambda: courtyard_range(temporary), tangents=False)
        export('quadrangle_ground', lambda: courtyard_ground(temporary), tangents=False)
