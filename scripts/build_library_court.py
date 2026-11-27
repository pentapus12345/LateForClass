"""Build Library Court's fitted, area-owned finish meshes with Blender."""

import json
from math import pi, sin
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from build_vaulted_bays import Mesh, OUTPUT
from build_first_court_interiors import woven_rug
from architectural_finishes import (
    FIRST_COURT_MANIFEST, OAK_CAP, finish_source, oak_ties, oak_wall_plates, panelled_walls,
    passage_box, platform_edge, reuse_wall_material, scholars_materials, wall_faces,
)


def solid_material(name, color, metal=0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = 0.82
    shader.inputs['Metallic'].default_value = metal
    return material


class Finish:
    """Batch visual surfaces by material within the Level that owns them."""

    def __init__(self, definition, materials):
        self.walls = definition['platforms']
        self.materials = materials
        self.meshes = {}

    def mesh(self, finish):
        if finish not in self.meshes:
            self.meshes[finish] = Mesh()
        return self.meshes[finish]

    def wall(self, name):
        return finish_source(self.walls, name)

    def box(self, finish, x0, x1, y0, y1, z0, z1, repeat=1.2):
        passage_box(self.mesh(finish), (x0, y0, z0), (x1, y1, z1), repeat)

    def face(self, name, axis, side, finish, cap=0, limits=None, top=None, plinth=False):
        """Finish the surveyed wall face. For doors and windows, keep their reveals clear."""
        wall = self.wall(name)
        run = 'z' if axis == 'x' else 'x'
        plane = platform_edge(wall, axis, side)
        start, end = (platform_edge(wall, run, edge) for edge in (-1, 1))
        if limits:
            if limits[0] < start - 0.001 or limits[1] > end + 0.001:
                raise ValueError(f'{name}: finish extends beyond the source wall')
            start, end = limits
        bottom = wall['y']
        ceiling = bottom + wall['height'] if top is None else top

        def segment(a, b, low, high, panel=False):
            if b - a < 0.001 or high - low < 0.001:
                return
            path = [(plane, a), (plane, b)] if axis == 'x' else [(a, plane), (b, plane)]
            if (axis == 'x' and side == 1) or (axis == 'z' and side == -1):
                path.reverse()
            if panel:
                panelled_walls(self.mesh(finish), self.mesh('oak'), self.mesh('trim'), path, high, cap / OAK_CAP)
            else:
                wall_faces(self.mesh(finish), path, low, high)
                if plinth and low == 0:
                    wall_faces(self.mesh('cut'), path, 0, min(.84, high), .013, 1.55)
                    if high > .84:
                        wall_faces(self.mesh('quoin'), path, .81, .863, .023)
                if finish == 'chalk' and low == 0:
                    wall_faces(self.mesh('dado'), path, 0, min(.88, high), .013)
                    wall_faces(self.mesh('painted'), path, 0, min(.095, high), .024)
                    if high > .88:
                        wall_faces(self.mesh('painted'), path, .86, .925, .022)

        opening = wall.get('windowOpening')
        if not opening:
            segment(start, end, bottom, ceiling, bool(cap))
            return
        if opening['axis'] != axis:
            raise ValueError(f'{name}: opening does not match its wall')
        center, half = opening['center'], opening['width'] / 2
        left, right = center - half, center + half
        segment(start, min(end, left), bottom, ceiling, bool(cap))
        segment(max(start, right), end, bottom, ceiling, bool(cap))
        sill = opening['bottom']
        segment(max(start, left), min(end, right), bottom, min(ceiling, sill), bool(cap and sill > cap))
        segment(max(start, left), min(end, right), sill + opening['height'], ceiling)

    def opening(self, name, finish, sides=(-1, 1), casing=0.092, depth=0.033, mullions=0):
        """Fit the original reveal and keep all casing outside the opening."""
        wall = self.wall(name)
        aperture = wall['windowOpening']
        axis = aperture['axis']
        run = 'z' if axis == 'x' else 'x'
        center, half = aperture['center'], aperture['width'] / 2
        left, right = center - half, center + half
        low, high = aperture['bottom'], aperture['bottom'] + aperture['height']
        if not (platform_edge(wall, run, -1) <= left < right <= platform_edge(wall, run, 1)
                and wall['y'] <= low < high <= wall['y'] + wall['height']):
            raise ValueError(f'{name}: opening does not fit the source wall')

        def piece(a, b, y0, y1, near, far):
            if axis == 'x':
                self.box(finish, near, far, y0, y1, a, b)
            else:
                self.box(finish, a, b, y0, y1, near, far)

        for side in sides:
            face = platform_edge(wall, axis, side)
            near, far = sorted((face - 0.005 * side, face + depth * side))
            piece(left - casing, left, low, high + casing, near, far)
            piece(right, right + casing, low, high + casing, near, far)
            piece(left, right, high, high + casing, near, far)
            if low > 0:
                piece(left - casing, right + casing, low - casing, low, near, far)

            # Offset the lining 1 mm into the opening to avoid coplanar faces.
            near, far = sorted((wall[axis], face + .006 * side))

            def reveal(vertices, reverse=False):
                uv = [(n, y) for _, y, n in vertices]
                if vertices[0][1] == vertices[-1][1]:
                    uv = [(n, a) for a, _, n in vertices]
                if axis == 'x':
                    points = [(n, -a, y) for a, y, n in vertices]
                else:
                    points = [(a, -n, y) for a, y, n in vertices]
                if reverse != (axis == 'x'):
                    points.reverse()
                    uv.reverse()
                self.mesh(finish).quad(points, uv)

            for edge, reverse in [(left + .001, axis == 'z'), (right - .001, axis == 'x')]:
                reveal([(edge, low, near), (edge, low, far),
                        (edge, high, far), (edge, high, near)], reverse)
            for level, reverse in [(high - .001, False), (low + .001, True)]:
                if level > .002:
                    reveal([(left, level, near), (right, level, near),
                            (right, level, far), (left, level, far)], reverse)
        if mullions:
            plane = wall[axis]
            for index in range(1, mullions + 1):
                member = left + index * aperture['width'] / (mullions + 1)
                piece(member - .028, member + .028, low, high, plane - .055, plane + .055)
            member = low + aperture['height'] * .58
            piece(left, right, member - .031, member + .031, plane - .058, plane + .058)

    def wall_path(self, path, ceiling, finish='plaster', cap=1.065):
        panelled_walls(self.mesh(finish), self.mesh('oak'), self.mesh('trim'), path, ceiling, cap / OAK_CAP)

    def arcade(self, axis, plane, floor, ceiling, piers, radius_height):
        """Seat a shallow voussoir arch between each pair of existing piers."""
        def point(along, y, offset):
            return (along, -(plane + offset), y) if axis == 'z' else (plane + offset, -along, y)

        def course(mesh, points, side):
            vertices = [point(along, y, side) for along, y in points]
            # Both sides are visible, with a separate soffit joining them.
            positive_winding = axis == 'z'
            if (side > 0) != positive_winding:
                vertices.reverse()
                points = points[::-1]
            mesh.quad(vertices, [(a / 1.3, y / 1.3) for a, y in points])

        spring = ceiling - radius_height - .27
        for a, b in zip(piers, piers[1:]):
            left, right = a + .15, b - .15
            profiles = [(left + (right - left) * index / 16, spring + radius_height * sin(pi * index / 16))
                        for index in range(17)]
            for index, ((x0, y0), (x1, y1)) in enumerate(zip(profiles, profiles[1:])):
                band = self.mesh('cut' if (index // 2) % 3 else 'quoin')
                for side in (-.163, .163):
                    course(band, [(x0, y0), (x1, y1), (x1, y1 + .19), (x0, y0 + .19)], side)
                    course(self.mesh('masonry'), [(x0, y0 + .19), (x1, y1 + .19),
                                                   (x1, ceiling), (x0, ceiling)], side)
                soffit = [point(x0, y0, -.163), point(x0, y0, .163),
                          point(x1, y1, .163), point(x1, y1, -.163)]
                band.quad(soffit if axis == 'x' else soffit[::-1],
                          [(x0, 0), (x0, .326), (x1, .326), (x1, 0)])
        for center in piers:
            for a, b, y0, y1 in [(center - .22, center + .22, floor - .035, floor + .105),
                                  (center - .22, center + .22, spring - .11, spring + .02)]:
                if axis == 'z':
                    self.box('cut', a, b, y0, y1, plane - .214, plane + .214)
                else:
                    self.box('cut', plane - .214, plane + .214, y0, y1, a, b)

    def group(self, name):
        group = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(group)
        for finish, mesh in self.meshes.items():
            if not mesh.faces:
                continue
            material = self.materials[finish]
            mesh.make_object(f'{name} {material.name}', material, material.use_nodes and
                             any(node.type == 'TEX_IMAGE' for node in material.node_tree.nodes))
            bpy.data.objects[f'{name} {material.name}'].parent = group


def library(f):
    # The west passage keeps the First Court oak profile, with limewash over it.
    f.wall_path([(42, 33.68), (49.32, 33.68), (49.32, 48.52), (54, 48.52)], 3.55, cap=.93)
    f.wall_path([(46.68, 43), (46.68, 36.68), (42, 36.68)], 3.55, cap=.93)
    for name in ('Book Office passage wall', 'Catalogue Room passage wall', 'West wall 47', 'West wall 57.5',
                 'Library east wall 58.5', 'Library east wall 64.25', 'Old Library doorway'):
        # Adjacent segments own the mitre at the first turn.
        f.face(name, 'x', 1, 'plaster', .93)
    for name in ('West walk low court window', 'West walk court gallery light'):
        f.face(name, 'x', -1, 'plaster', .93)
        f.opening(name, 'cut', mullions=3)
    for name in ('Book Office passage wall', 'Catalogue Room passage wall', 'Old Library doorway'):
        f.opening(name, 'trim')
    f.opening('West wall 47', 'cut')
    f.opening('Old Library south wall', 'cut', sides=(-1,))
    f.opening('Old Library south wall', 'trim', sides=(1,))
    f.opening('Library east wall 64.25', 'trim')
    f.opening('Library projecting window', 'trim', mullions=1)

    # The service run has rough lime render above a continuous stone plinth.
    paths = [
        [(39.05, 58.32), (39.05, 48.3), (46.32, 48.3)],
        [(46.32, 50.2), (40.95, 50.2), (40.95, 58.32)],
    ]
    for path in paths:
        wall_faces(f.mesh('rough'), path, .51, 2.65)
        wall_faces(f.mesh('masonry'), path, 0, .51, .012, 1.55)
        wall_faces(f.mesh('cut'), path, .495, .54, .026, 1.55)
        oak_wall_plates(f.mesh('trim'), path, 2.65)
    oak_ties(f.mesh('trim'), 'x', 48.3, 50.2, 2.65, (42.5, 44.7))
    oak_ties(f.mesh('trim'), 'z', 39.05, 40.95, 2.65, (52.4, 55.7))

    for name, axis, side, limits in [
        ('Old Library west wall', 'x', 1, (58.68, 68.32)),
        ('Old Library north wall', 'z', -1, (38.68, 46.32)),
        ('Old Library south wall', 'z', 1, (38.68, 46.32)),
        ('Library east wall 58.5', 'x', -1, (58.68, 60.75)),
        ('Library east wall 64.25', 'x', -1, (64.25, 68.32)),
        ('Old Library doorway', 'x', -1, None),
    ]:
        # Under the gallery the stair-view sill meets the lower book panelling.
        f.face(name, axis, side, 'plaster', .92, limits)
    for prefix in ('Book Office', 'Catalogue Room'):
        for side, axis, inward in [('west', 'x', 1), ('south', 'z', 1), ('north', 'z', -1), ('passage', 'x', -1)]:
            f.face(f'{prefix} {side} wall', axis, inward, 'plaster', .93)

    # Roof ties, wall plates and short corbels make a single timber assembly.
    oak_wall_plates(f.mesh('trim'), [(38.68, 58.68), (46.32, 58.68), (46.32, 68.32),
                                    (38.68, 68.32), (38.68, 58.68)], 5.8)
    for z in (59.4, 61.75, 64.3, 67.3):
        f.box('trim', 38.77, 46.23, 5.46, 5.815, z - .105, z + .105)
        for x, inward in ((38.68, 1), (46.32, -1)):
            near, far = sorted((x, x + .27 * inward))
            f.box('trim', near, far, 5.23, 5.48, z - .084, z + .084)
    for z in (37.9, 41.7, 46.5, 52, 56.65):
        f.box('trim', 46.675, 49.325, 3.34, 3.56, z - .09, z + .09)
    for x in (43.6, 46.5):
        f.box('trim', x - .09, x + .09, 3.34, 3.56, 33.68, 36.32)
    for z in (59.45, 63.7, 66.9):
        f.box('trim', 46.68, 49.32, 5.49, 5.81, z - .10, z + .10)

    # The original stair and gallery guards remain the collision surfaces.
    guard = f.wall('Library gallery guard')
    x = guard['x']
    for z in (58.72, 60.67, 62.55, 64.48, 66.39):
        f.box('trim', x - .058, x + .058, 2.4, 3.54, z - .052, z + .052)
    f.box('trim', x - .065, x + .065, 3.46, 3.54, 58.69, 66.42)
    f.box('oak', x - .05, x + .05, 2.42, 2.53, 58.69, 66.42)
    for z in [58.84 + i * .23 for i in range(33)]:
        f.box('oak', x - .023, x + .023, 2.51, 3.48, z - .023, z + .023)
    for index in range(1, 13):
        tread = f.wall(f'Library stair guard {index}')
        x, y, z = (tread[key] for key in ('x', 'y', 'z'))
        f.box('oak', x - .029, x + .029, y, y + 1.045, z - .028, z + .028)
        if index in (1, 12):
            f.box('trim', x - .052, x + .052, y, y + 1.11, z - .052, z + .052)
        # Project the handrail continuously along the pitch of the flight.
        a, b = x - .17, x + .17
        rise = .1
        low = [(a, y + .99 - rise, z - .047), (b, y + .99 + rise, z - .047),
               (b, y + .99 + rise, z + .047), (a, y + .99 - rise, z + .047)]
        high = [(px, py + .065, pz) for px, py, pz in low]
        for quad in [high, [low[0], high[0], high[1], low[1]], [low[2], high[2], high[3], low[3]]]:
            f.mesh('trim').quad([(px, -pz, py) for px, py, pz in quad],
                                [(px, py) for px, py, pz in quad])

    # Court-facing range, oriel cornice and dressed horizontal storey bands.
    for name in ('West walk low court window', 'West walk court gallery light'):
        f.face(name, 'x', 1, 'masonry')
    for y, z0, z1 in ((1.15, 51.3, 68), (3.48, 51.3, 58.5), (5.63, 58.5, 68)):
        f.box('cut', 49.64, 49.79, y, y + .14, z0, z1)
    f.box('cut', 46.91, 47.24, 2.36, 2.57, 60.6, 64.4)
    f.box('cut', 46.91, 47.24, 5.56, 5.77, 60.6, 64.4)
    # Seat the oriel sill against the deck above the existing door head.
    f.box('cut', 46.76, 46.87, 2.401, 2.49, 60.92, 64.08)
    roof(f, 38.28, 49.58, 58.45, 68.48, 6.0, 8.1)
    for z in (59.6, 60.7, 64.1, 66.4):
        f.box('cut', 49.62, 49.78, 5.76, 6.10, z - .09, z + .09)
    # A single wool rug anchors the reading table, outside the door and stair lines.
    f.mesh('rug').quad([(41.19, -62.87, .008), (41.19, -65.2, .008),
                        (44, -65.2, .008), (44, -62.87, .008)],
                       [(0, 0), (0, 1), (1, 1), (1, 0)])
    f.group('LibraryGallery')


def teaching(f):
    # Painted dado and thin rails suit the later schoolrooms.
    for prefix in ('History', 'Latin', 'Greek'):
        faces = [('west', 'x', 1), ('east', 'x', -1), ('south', 'z', 1), ('north', 'z', -1)]
        faces = [face for face in faces if any(w['name'] == f'{prefix} {face[0]} wall' for w in f.walls)]
        for side, axis, inward in faces:
            f.face(f'{prefix} {side} wall', axis, inward, 'chalk')
        axis, inward = ('z', 1) if prefix == 'History' else ('x', -1 if prefix == 'Latin' else 1)
        f.face(prefix + ' entrance wall', axis, inward, 'chalk')
        f.opening(prefix + ' entrance wall', 'painted')
        x = {'History': 50, 'Latin': 57.5, 'Greek': 68.5}[prefix]
        f.box('painted', x - 3.31, x + 3.31, 3.51, 3.71, 74.65, 74.77)
        f.box('painted', x - 3.31, x + 3.31, 3.51, 3.71, 79.3, 79.42)

    for name in ('North back wall 53.5', 'North back wall 65', 'History entrance wall'):
        f.face(name, 'z', -1, 'chalk')
    f.face('Latin entrance wall', 'x', 1, 'chalk')
    f.face('Greek entrance wall', 'x', -1, 'chalk')
    f.opening('Latin north wall', 'cut')
    f.opening('North west end', 'cut')
    f.opening('North extension bay', 'cut', mullions=1)
    f.box('cut', 60.82, 65.18, 2.86, 3.0, 73.31, 73.66)
    f.box('painted', 46.68, 79.12, 3.55, 3.71, 73.2, 73.33)
    f.box('painted', 46.68, 79.12, 3.58, 3.71, 70.64, 70.76)
    for x in (50.2, 54.3, 58.4, 63.0, 67.6, 71.7, 75.8):
        f.box('painted', x - .057, x + .057, 3.59, 3.705, 70.76, 73.2)
    for x in (61.19, 64.81):
        f.box('painted', x - .055, x + .055, 3.56, 3.705, 73.5, 81.32)
    for z in (74.25, 77.4, 80.55):
        f.box('painted', 61.245, 64.755, 3.58, 3.705, z - .058, z + .058)
    f.arcade('z', 70.5, 1.42, 3.7, (49.5, 58, 67.5, 76.7), .55)
    f.box('cut', 49.34, 76.86, 1.37, 1.49, 70.25, 70.75)
    f.box('cut', 49.33, 76.87, 3.67, 3.86, 70.29, 70.61)
    for z in (69.27,):
        for x in (49.5, 76.7):
            f.box('cut', x - .225, x + .225, 1.37, 1.49, z - 1.23, z + 1.23)

    # Older examination route. Cut stone below a limewashed brick-toned upper wall.
    for name, axis, side in [
        ('Candidates south wall', 'z', 1), ('Candidates outer west wall', 'x', 1),
        ('Candidates inner west return', 'x', -1), ('Candidates outer north wall', 'z', -1),
        ('Candidates landing back wall', 'z', -1), ('Candidates return end', 'x', -1),
        ('History north wall', 'z', 1), ('Latin north wall', 'z', 1),
        ('Candidates turn headwall', 'z', -1), ('Candidates landing cheek', 'x', 1)
    ]:
        limits = (54, 59.55) if name == 'Latin north wall' else None
        f.face(name, axis, side, 'rough', top=2.8, limits=limits, plinth=True)
    for x in (47.5, 51.4, 54.4):
        f.box('painted', x - .075, x + .075, 2.62, 2.805, 81.68, 83.3)

    # Low slate silhouette over the later classroom block, with stone eaves.
    roof(f, 46.42, 72.15, 73.5, 81.62, 3.86, 5.35)
    f.group('NorthTeaching')


def roof(f, left, right, south, north, eaves, ridge):
    middle = (south + north) / 2
    mesh = f.mesh('slate')
    for a, b, ya, yb in [(south, middle, eaves, ridge), (middle, north, ridge, eaves)]:
        mesh.quad([(left, -a, ya), (left, -b, yb), (right, -b, yb), (right, -a, ya)],
                  [(left, a), (left, b), (right, b), (right, a)])
    for end, side in [(left, -1), (right, 1)]:
        for a, b, ya, yb in [(south, middle, eaves, ridge), (middle, north, ridge, eaves)]:
            pts = [(end, -a, eaves - .06), (end, -b, eaves - .06), (end, -b, yb), (end, -a, ya)]
            f.mesh('masonry').quad(pts if side > 0 else pts[::-1],
                                   [(a, eaves), (b, eaves), (b, yb), (a, ya)])
    for z in (south, north):
        f.box('cut', left, right, eaves - .1, eaves + .025, z - .06, z + .06)


def book_passage(f):
    f.arcade('z', 51.3, 1.42, 3.55, (54, 55, 61, 67, 73, 76.7), .43)
    f.box('cut', 53.85, 54.15, 1.42, 3.55, 51.15, 51.46)
    f.arcade('x', 76.7, 1.42, 3.7, (51.3, 56.5, 62.5, 67.8), .46)
    f.box('cut', 49.5, 76.88, 1.36, 1.49, 51.08, 51.54)
    f.box('cut', 76.48, 76.91, 1.36, 1.49, 51.54, 68)
    for name in ('Reserved east connection bay', 'Reserved south cross-campus bay'):
        f.opening(name, 'cut', mullions=1)
    for name in ('Binding Room passage wall', 'Map Room passage wall'):
        f.opening(name, 'cut', casing=.10)
    for x in (56, 61.2, 65.8, 70, 74):
        f.box('trim', x - .09, x + .09, 3.34, 3.56, 48.88, 51.13)
    for z in (53.5, 57.65, 61.6, 65.75):
        f.box('trim', 76.87, 79.13, 3.47, 3.71, z - .095, z + .095)
    f.box('trim', 54, 79.12, 3.39, 3.56, 48.86, 48.98)
    f.box('trim', 54, 76.94, 3.39, 3.56, 51.07, 51.20)
    f.box('trim', 76.87, 77.00, 3.54, 3.71, 51.29, 68)
    f.box('trim', 79.02, 79.14, 3.54, 3.71, 51.43, 68)
    f.box('cut', 76.68, 79.30, 3.55, 3.70, 51.16, 51.35)
    # Drip courses on the courtyard side and a low roof above the southern walk.
    roof(f, 54, 79.31, 48.64, 51.37, 3.73, 4.3)
    f.box('cut', 76.59, 76.77, 3.70, 3.85, 51.38, 68)
    # Narrow gravel skirts meet the existing court lawn at its four edges.
    for x0, x1, z0, z1 in ((49.50, 50.28, 51.3, 70.5), (75.92, 76.70, 51.3, 70.5),
                            (50.28, 75.92, 51.3, 52.03), (50.28, 75.92, 69.77, 70.5)):
        f.box('cut', x0, x1, -.133, -.119, z0, z1, 1.8)
    f.group('BookPassage')


def door_leaf(f, name, frame, field):
    # Simple rectangular leaf at the existing standard 1550 by 2250 opening.
    f.box(frame, -.774, .774, 0, 2.25, -.053, .053)
    for side in (-1, 1):
        rear, front = sorted((side * .053, side * .063))
        for x0, x1 in ((-.63, -.033), (.033, .63)):
            for y0, y1 in ((.18, .90), (1.035, 2.10)):
                f.box(field, x0, x1, y0, y1, rear, front, .83)
        near, far = sorted((side * .063, side * .088))
        f.box('iron', .58, .653, .91, 1.13, near, far)
        f.box('brass', .49, .635, 1.025, 1.063, near - .006, far + .006)
    f.group(name)


def build(temporary):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    plaster, oak, trim = scholars_materials(temporary)
    materials = dict(plaster=plaster, oak=oak, trim=trim, rug=woven_rug(temporary))
    for source, key, title, color, weight in [
        ('Weathered masonry', 'masonry', 'Reused court limestone', (.69, .63, .49), .52),
        ('Weathered masonry', 'cut', 'Dressed limestone', (.82, .76, .62), .21),
        ('Aged lime plaster', 'chalk', 'North Schools chalk plaster', (.82, .83, .74), .32),
        ('Aged lime plaster', 'rough', 'Old passage lime render', (.52, .47, .40), .45),
    ]:
        materials[key] = reuse_wall_material(source, title, temporary, color, weight)
    for key, title, color, metal in [
        ('quoin', 'Ochre voussoir', (.46, .38, .27), 0),
        ('painted', 'Painted olive joinery', (.20, .236, .184), 0),
        ('dado', 'Distempered sage dado', (.39, .43, .35), 0),
        ('slate', 'Welsh slate', (.16, .175, .19), 0),
        ('iron', 'Blackened iron', (.047, .043, .035), .46),
        ('brass', 'Tarnished brass', (.53, .34, .115), .52),
    ]:
        materials[key] = solid_material(title, color, metal)

    manifest = json.loads(FIRST_COURT_MANIFEST.read_text())
    for name, finish in [('library-gallery', library), ('north-teaching', teaching), ('book-passage', book_passage)]:
        finish(Finish(finish_source(manifest['areas'], name, key='id')['definition'], materials))
    door_leaf(Finish({'platforms': []}, materials), 'OakLeaf', 'trim', 'oak')
    door_leaf(Finish({'platforms': []}, materials), 'PaintedLeaf', 'painted', 'oak')
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / 'library_court.glb'), export_format='GLB',
                              export_image_format='AUTO', export_yup=True)


if __name__ == '__main__':
    with TemporaryDirectory() as directory:
        build(directory)
