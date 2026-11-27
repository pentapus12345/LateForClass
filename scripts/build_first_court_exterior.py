"""Build the First Court exterior skins on the approved footprints."""

from math import cos, pi, sin
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from build_collegiate_bay import finish_tile
from build_courtyard import pointed_head
from build_first_court_joints import finish, sampled_stone
from build_scholars_passage import passage_box
from build_vaulted_bays import Mesh, OUTPUT


class Facade:
    """Map a facade's horizontal, depth and height coordinates onto its range."""

    def __init__(self, x, y, z, rotation, meshes):
        angle = rotation * pi / 180
        self.cos, self.sin = round(cos(angle)), round(sin(angle))
        self.x, self.y, self.z = x, y, z
        self.meshes = meshes

    def point(self, point):
        u, d, h = point
        return (self.x + u * self.cos - d * self.sin,
                -self.z + u * self.sin + d * self.cos, self.y + h)

    def box(self, material, low, high, period=2.45):
        a, b = self.point(low), self.point(high)
        self.meshes[material].box(tuple(map(min, zip(a, b))), tuple(map(max, zip(a, b))), period)

    def quad(self, material, points, axes=(0, 2), period=2.45):
        self.meshes[material].quad([self.point(p) for p in points],
                                  [(p[axes[0]] / period, p[axes[1]] / period) for p in points])

    def field(self, material, left, right, bottom, top, depth=-0.22):
        self.quad(material, [(left, depth, bottom), (right, depth, bottom),
                             (right, depth, top), (left, depth, top)])


def head(left, right, spring, rise):
    if rise:
        return pointed_head(left, right, spring, rise)
    return [(left, spring), (right, spring)]


def opening(face, center, base, width, height, rise, kind, depth, top):
    """Fill the wall above a real reveal, then add its sill, hood and inset."""
    left, right = center - width / 2, center + width / 2
    spring = base + height - rise
    samples = head(left, right, spring, rise)
    inset = depth + (0.38 if kind == 'louvre' else 0.31)
    surround = 0.09 if kind != 'gate' else 0.14
    for a, b in [(left - surround, left), (right, right + surround)]:
        face.box('dressings', (a, depth - 0.08, base), (b, depth + 0.008, spring))
    for (x, y), (u, v) in zip(samples, samples[1:]):
        face.quad('ashlar', [(x, depth, y), (u, depth, v), (u, depth, top), (x, depth, top)])
        face.quad('dressings', [(x, inset, y), (u, inset, v), (u, depth, v), (x, depth, y)], (0, 1))
        face.quad('dressings', [(x, depth - 0.08, y), (u, depth - 0.08, v),
                                (u, depth - 0.08, v + surround), (x, depth - 0.08, y + surround)])
        face.quad('dressings', [(x, depth - 0.08, y + surround), (u, depth - 0.08, v + surround),
                                (u, depth, v + surround), (x, depth, y + surround)], (0, 1))
        face.quad(kind, [(x, inset, base), (u, inset, base), (u, inset, v), (x, inset, y)])
    face.quad('dressings', [(left, depth, base), (left, inset, base),
                            (left, inset, spring), (left, depth, spring)], (1, 2))
    face.quad('dressings', [(right, inset, base), (right, depth, base),
                            (right, depth, spring), (right, inset, spring)], (1, 2))
    face.box('dressings', (left - 0.10, depth - 0.15, base - 0.115), (right + 0.10, inset, base))
    if kind == 'louvre':
        for y in np.arange(base + 0.16, spring - 0.02, 0.23):
            face.quad('oak', [(left, inset - 0.09, y), (right, inset - 0.09, y),
                              (right, inset - 0.014, y + 0.09), (left, inset - 0.014, y + 0.09)])
    elif kind == 'gate':
        for offset in np.arange(-0.72, 0.76, 0.18):
            face.box('oak', (center + offset - 0.012, inset - 0.012, base),
                     (center + offset + 0.012, inset + 0.012, spring - 0.025))
        face.box('oak', (left + 0.025, inset - 0.028, base + 0.42), (right - 0.025, inset, base + 0.52))
    else:
        # The leaded divisions sit well inside the opening. One face per
        # division keeps the distant glazing much lighter than solid boxes.
        lights = 3 if width > 1.2 else 2
        for i in range(1, lights):
            u = left + width * i / lights
            face.field('dressings', u - 0.026, u + 0.026, base, spring, inset - 0.075)
        for y in (base + height * 0.43, base + height * 0.68):
            face.field('dressings', left, right, y, y + 0.032, inset - 0.066)
    return left, right


def storey(face, left, right, bottom, top, windows, depth=-0.22):
    current = left
    for center, base, width, height, rise, kind in windows:
        start, end = opening(face, center, base, width, height, rise, kind, depth, top)
        face.field('ashlar', current, start, bottom, top, depth)
        face.field('ashlar', start, end, bottom, base, depth)
        current = end
    face.field('ashlar', current, right, bottom, top, depth)


def course(face, left, right, height, depth, scale=1):
    for low, high, front in [(0, 0.07, -0.07), (0.07, 0.14, -0.13), (0.14, 0.19, -0.09)]:
        face.box('dressings', (left, depth + front * scale, height + low * scale),
                 (right, depth + 0.05, height + high * scale))


def roof(face, left, right, eave, ridge, back, hip=1.1, gable_end=False):
    """One closed slate roof per run, with plane-matched end slopes."""
    front, peak = -0.43, (back - 0.43) / 2
    a, b = (left, front, eave), (right, front, eave)
    c, d = (right, back, eave), (left, back, eave)
    p, q = (left + hip, peak, ridge), (right if gable_end else right - hip, peak, ridge)
    face.quad('slate', [a, b, q, p], period=1.65)
    face.quad('slate', [c, d, p, q], period=1.65)
    face.quad('slate', [d, a, p, p], (1, 2), period=1.65)
    face.quad('ashlar' if gable_end else 'slate', [b, c, q, q], (1, 2), period=1.65)
    face.box('slate', (p[0], peak - 0.09, ridge - 0.045), (q[0], peak + 0.09, ridge + 0.035))
    face.box('dressings', (left, front, eave - 0.11), (right, front + 0.24, eave))


def gabled_gate(face, center, eave):
    left, right = center - 1.48, center + 1.48
    face.quad('ashlar', [(left, -0.39, eave - 0.22), (right, -0.39, eave - 0.22),
                         (center, -0.39, eave + 1.48), (center, -0.39, eave + 1.48)])
    for u, v in [(left, center), (center, right)]:
        def height(x):
            return eave + 1.51 - abs(x - center) * 1.7 / 1.48

        face.quad('dressings', [(u, -0.48, height(u)), (v, -0.48, height(v)),
                                (v, 0.82, height(v)), (u, 0.82, height(u))], (0, 1))
        face.quad('dressings', [(u, -0.48, height(u) - 0.085), (v, -0.48, height(v) - 0.085),
                                (v, -0.48, height(v)), (u, -0.48, height(u))])


def range_front(face, centers, style, gate=None):
    left, right = centers[0] - 2, centers[-1] + 2
    eave = {'lancet': 5.85, 'mullioned': 5.58, 'hall': 6.47}[style]
    lower, upper = [], []
    for center in centers:
        if center == gate:
            lower.append((center, 0.21, 1.75, 2.74, 0.53, 'gate'))
            upper.append((center, 3.66, 1.55, 1.49, 0.34, 'glass'))
        elif style == 'hall':
            lower.extend((center + offset, 0.85, 0.73, 1.19, 0, 'glass') for offset in (-0.97, 0.97))
            upper.append((center, 2.80, 2.05, 2.80, 0.48, 'glass'))
        elif style == 'mullioned':
            lower.append((center, 0.98, 1.77, 1.38, 0, 'glass'))
            upper.append((center, 3.28, 1.80, 1.49, 0, 'glass'))
        else:
            for offset in (-0.98, 0.98):
                lower.append((center + offset, 0.84, 0.84, 1.49, 0.29, 'glass'))
                upper.append((center + offset, 3.33, 0.88, 1.61, 0.37, 'glass'))
    split = 3.12 if gate is not None else 2.68
    storey(face, left, right, 0, split, lower)
    storey(face, left, right, split, eave, upper)
    face.box('ashlar', (left, 0.46, 0), (right, 0.65, eave - 0.018))
    for x, edge in [(left, left + 0.14), (right, right - 0.14)]:
        face.box('ashlar', (min(x, edge), -0.219, 0), (max(x, edge), 0.46, eave - 0.02))
    for x in (u + 2 for u in centers[:-1]):
        face.box('ashlar', (x - 0.13, -0.35, 0.12), (x + 0.13, -0.218, eave - 0.17))
    course(face, left, right, 0.09, -0.22, 0.82)
    for height in (2.61, eave - 0.24):
        if gate is not None and height == 2.61:
            for a, b in [(left, gate - 1.025), (gate + 1.025, right)]:
                course(face, a, b, height, -0.22, 0.7)
        else:
            course(face, left, right, height, -0.22, 0.7)
    # The gabled end abuts the north hall range, hiding the far stair roof
    # through the south porch at jump height.
    roof(face, left, right, eave, eave + (1.86 if style == 'hall' else 1.48), 2.55, gable_end=gate is not None)
    if gate is not None:
        gabled_gate(face, gate, eave)
        face.box('ashlar', (gate - 2.65, 0.90, eave + 0.55), (gate - 2.03, 1.48, eave + 2.05))
        face.box('dressings', (gate - 2.70, 0.85, eave + 1.99), (gate - 1.98, 1.53, eave + 2.12))


def tower(meshes):
    for rotation, x, z in [(0, 0, 2), (90, 2, 0), (180, 0, -2), (270, -2, 0)]:
        # Local outward normals point +Z, +X, -Z, -X respectively.
        face = Facade(x, 0, z, rotation, meshes)
        storey(face, -2.22, 2.22, -0.28, 5.3, [])
        storey(face, -2.22, 2.22, 5.3, 10.58, [(0, 6.09, 0.89, 2.79, 0.48, 'glass')])
        storey(face, -2.22, 2.22, 10.58, 13.91,
               [(u, 11.22, 0.82, 2.19, 0.43, 'louvre') for u in (-0.71, 0.71)])
        face.box('ashlar', (-1.75, -0.25, 14.15), (1.75, 0.23, 14.65))
        for center in (-1.65, -0.55, 0.55, 1.65):
            face.box('dressings', (center - 0.27, -0.31, 14.59), (center + 0.27, 0.30, 15.12))
        for h in np.arange(0.5, 13.72, 0.6):
            width = 0.16 if round(h / 0.6) % 2 else 0.34
            for low, high in [(-2.22, -2.22 + width), (2.22 - width, 2.22)]:
                face.box('dressings', (low, -0.246, h), (high, -0.213, h + 0.57))
    # Full square courses share their corners without overlapping face caps.
    for y, scale in [(0.12, 1.6), (5.12, 0.76), (10.58, 1.18), (13.86, 1.58)]:
        for a, b, projection in [(0, 0.07, 0.07), (0.07, 0.14, 0.13), (0.14, 0.19, 0.09)]:
            edge = 2.22 + projection * scale
            passage_box(meshes['dressings'], (-edge, y + a * scale, -edge),
                        (edge, y + b * scale, edge), 2.45)
    for x in (-2.0, 2.0):
        for z in (-2.0, 2.0):
            for a, b, width in [(13.89, 14.96, 0.65), (14.96, 15.39, 0.40)]:
                passage_box(meshes['dressings'], (x - width / 2, a, z - width / 2),
                            (x + width / 2, b, z + width / 2), 1)
            corner = [(x - 0.23, -z - 0.23), (x + 0.23, -z - 0.23),
                      (x + 0.23, -z + 0.23), (x - 0.23, -z + 0.23)]
            for a, b in zip(corner, corner[1:] + corner[:1]):
                meshes['dressings'].quad([(*a, 15.38), (*b, 15.38), (x, -z, 16.02), (x, -z, 16.02)],
                                         [(0, 0), (1, 0), (0.5, 1), (0.5, 1)])
    passage_box(meshes['slate'], (-1.91, 14.21, -1.91), (1.91, 14.30, 1.91), 2)


def cloister(meshes):
    stone, dressings = meshes['arcade stone'], meshes['dressings']
    passage_box(stone, (4.75, 0, 4.0), (5.12, 1.42, 32.0), 2.4)
    passage_box(dressings, (4.679, 1.42, 4.0), (5.191, 1.51, 32.0), 1.65)
    for z in range(4, 33, 4):
        passage_box(stone, (4.600, 0, z - 0.23), (5.260, 2.55, z + 0.23), 2.4)
        passage_box(dressings, (4.479, 2.55, z - 0.34), (5.351, 2.86, z + 0.34), 1.65)
    # Flat end wall supports the vault transition and carries the original sign.
    Facade(0, 0, 36, 180, meshes).field('arcade stone', -9.975, -0.005, 0, 4.405, -0.189)


def court_ground(meshes):
    # The flags continue to the feet of the existing ranges. Keep a wider
    # northern walk so the tower has a paved approach on both sides.
    passage_box(meshes['arcade stone'], (5.12, -0.275, 2.96), (25.08, -0.195, 31.12), 2.5)
    passage_box(meshes['lawn'], (7.35, -0.198, 5.31), (22.81, -0.121, 25.82), 3.72)
    edging = meshes['dressings']
    for near, far in [(5.23, 5.31), (25.82, 25.90)]:
        passage_box(edging, (7.27, -0.193, near), (22.89, -0.101, far), 1.1)
    for left, right in [(7.27, 7.35), (22.81, 22.89)]:
        passage_box(edging, (left, -0.193, 5.31), (right, -0.101, 25.82), 1.1)


def lookout(meshes):
    ashlar, dressings = meshes['ashlar'], meshes['dressings']
    # Seat the roof below the existing ledger at the east wall of Room 25.
    roof(Facade(30.13, 0, 42, 90, meshes), -3.895, 3.895, 4.26, 6.12, 7.88, hip=1.46)
    passage_box(dressings, (30.2, 4.487, 37.97), (33.85, 4.61, 38.28), 1.7)
    passage_box(ashlar, (30.187, -0.13, 38.191), (30.251, 0.24, 45.99), 2.45)
    passage_box(ashlar, (30.253, -0.13, 38.19), (33.848, 0.24, 38.251), 2.45)
    for a, b in [(38.0, 38.278), (42.36, 42.75)]:
        passage_box(ashlar, (33.813, 2.40, a), (33.852, 6.35, b), 2.45)


def finishes(temporary):
    row, col = np.indices((192, 256)) / np.array([192, 256])[:, None, None]
    rng = np.random.default_rng(20)
    block_row = (row * 6).astype(int)
    brick_x = col * 4 + 0.5 * (block_row % 2)
    u, v = brick_x % 1, (row * 6) % 1
    edge = np.minimum(np.minimum(u, 1 - u), np.minimum(v, 1 - v))
    freckle = 0.021 * np.sin(2 * pi * (20 * col + 14 * row)) + rng.normal(0, 0.023, row.shape)
    courses = rng.uniform(0.92, 1.065, (6, 5))[block_row, brick_x.astype(int)]
    ashlar = courses + freckle + 0.035 * np.sin(2 * pi * (col * 3 + row * 2))
    ashlar = np.where(edge < 0.022, 0.70 + freckle, ashlar)

    slate_x = col * 7 + 0.5 * ((row * 8).astype(int) % 2)
    slate = 0.91 + rng.normal(0, 0.035, row.shape) + 0.07 * np.cos(2 * pi * slate_x)
    slate -= np.where(((row * 8) % 1 < 0.13) | (slate_x % 1 < 0.04), 0.20, 0)
    lawn = 0.94 + 0.055 * np.cos(8 * pi * col) + rng.normal(0, 0.028, row.shape)
    return {
        'ashlar': finish_tile('Weathered honey limestone', Path(temporary) / 'ashlar.jpg', (0.76, 0.70, 0.61), ashlar),
        'slate': finish_tile('Staggered Welsh slate', Path(temporary) / 'slate.jpg', (0.36, 0.40, 0.42), slate),
        'lawn': finish_tile('Mown First Court lawn', Path(temporary) / 'lawn.jpg', (0.40, 0.47, 0.28), lawn[::2, ::2]),
        'arcade stone': sampled_stone(temporary),
        'dressings': finish('b2a18a', 'Cut ashlar dressings'),
        'glass': finish('293837', 'Leaded window recess'),
        'louvre': finish('332c25', 'Dark belfry interior'),
        'oak': finish('635442', 'Silvered oak'),
        'gate': finish('534432', 'Old oak gate')
    }


def build(temporary):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    materials = finishes(temporary)

    def export_group(name, build_group):
        meshes = {label: Mesh() for label in materials}
        build_group(meshes)
        root = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(root)
        for label, mesh in meshes.items():
            if mesh.faces:
                material = materials[label]
                # Solid colours do not need texture coordinates in the runtime bundle.
                use_uv = any(node.type == 'TEX_IMAGE' for node in material.node_tree.nodes)
                mesh.make_object(f'{name} {label}', material, use_uv=use_uv)
        for item in bpy.context.collection.objects:
            if item.type == 'MESH' and item.parent is None:
                item.parent = root

    def court_ranges(meshes):
        range_front(Facade(25, -0.18, 17, -90, meshes), [-12, -8, -4, 0, 4, 8, 12], 'lancet', gate=0)
        range_front(Facade(15, -0.18, 31, 180, meshes), [-8, -4, 0, 4, 8], 'hall')
        range_front(Facade(15, -0.18, 3, 0, meshes), [-8, -4, 0, 4, 8], 'mullioned')
        court_ground(meshes)

    export_group('CourtRanges', court_ranges)
    export_group('CourtTower', tower)
    export_group('CloisterFacing', cloister)
    export_group('ArrivalYard', lambda meshes: range_front(Facade(-40, 0, -3, 90, meshes), [-4, 0, 4], 'mullioned'))
    export_group('LookoutFacing', lookout)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / 'first_court_exterior.glb'), export_format='GLB')


if __name__ == '__main__':
    with TemporaryDirectory() as directory:
        build(directory)
