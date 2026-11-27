"""Export the modular stone hall using Blender's offline Python."""

import json
from math import hypot, sqrt
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory

import bpy
import numpy as np


MODELS = Path(__file__).resolve().parents[1] / 'assets/models'
OUTPUT = MODELS / 'runtime/architecture'
SOURCE_TEXTURES = MODELS / 'architecture/textures'
HALF_SPAN = 2.0
HALF_DEPTH = 2.5
SPRING = 3.9
RISE = 2.62
SEGMENTS = 24


def classroom_arch():
    levels = json.loads((MODELS.parent / 'levels.json').read_text())['levels']
    level = next(level for level in levels if 'pointedOak' in level.get('doorProfiles', {}))
    profile = level['doorProfiles']['pointedOak']
    door = next(door for door in level['doors'] if door.get('arch') == 'pointedOak')
    width = profile['width']
    samples = [(-width / 2 + width * i / (len(profile['rise']) - 1), height)
               for i, height in enumerate(profile['rise'])]
    return samples, door['height'], door['depth']


class Mesh:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.uv = []

    def quad(self, points, uvs):
        start = len(self.vertices)
        self.vertices.extend(points)
        self.faces.append(tuple(range(start, start + 4)))
        self.uv.append(uvs)

    def box(self, low, high, period, uv_shift=(0, 0, 0)):
        x, y, z = low
        X, Y, Z = high
        for points, axes in [
            ([(x, y, z), (x, y, Z), (x, Y, Z), (x, Y, z)], (1, 2)),
            ([(X, y, z), (X, Y, z), (X, Y, Z), (X, y, Z)], (1, 2)),
            ([(x, y, z), (X, y, z), (X, y, Z), (x, y, Z)], (0, 2)),
            ([(x, Y, z), (x, Y, Z), (X, Y, Z), (X, Y, z)], (0, 2)),
            ([(x, y, Z), (X, y, Z), (X, Y, Z), (x, Y, Z)], (0, 1)),
            ([(x, y, z), (x, Y, z), (X, Y, z), (X, y, z)], (0, 1)),
        ]:
            self.quad(points, [tuple((p[axis] + uv_shift[axis]) / period for axis in axes) for p in points])

    def make_object(self, name, material, use_uv=True):
        data = bpy.data.meshes.new(name)
        data.from_pydata(self.vertices, [], self.faces)
        data.update()
        if use_uv:
            uv = data.uv_layers.new()
            for face, coordinates in zip(data.polygons, self.uv):
                for index, texcoord in zip(face.loop_indices, coordinates):
                    uv.data[index].uv = texcoord
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.data.materials.append(material)


def grade(image, name, temporary, saturation, lift):
    pixels = np.empty(len(image.pixels), dtype=np.float32)
    image.pixels.foreach_get(pixels)
    pixels = pixels.reshape((-1, 4))
    color = pixels[:, :3]
    gray = color @ np.asarray([0.2126, 0.7152, 0.0722], dtype=np.float32)
    neutral = gray[:, None] * (1 - saturation) + color * saturation
    color[:] = np.clip(neutral * (1 - lift) + lift, 0, 1)
    image.pixels.foreach_set(pixels.ravel())
    path = Path(temporary) / f'{name}.jpg'
    image.filepath_raw = str(path)
    image.file_format = 'JPEG'
    image.save(quality=83)
    return bpy.data.images.load(str(path))


def surface(name, texture_prefix, temporary, base_size, normal_strength, saturation, lift):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = 0.87
    for suffix, edge in [('base', base_size), ('normal', 256)]:
        filename = f'{texture_prefix}_{suffix}.jpg'
        path = Path(temporary) / filename
        subprocess.run(['sips', '-Z', str(edge), '-s', 'formatOptions', '82',
                        str(SOURCE_TEXTURES / filename), '--out', str(path)],
                       check=True, stdout=subprocess.DEVNULL)
        node = nodes.new('ShaderNodeTexImage')
        node.image = bpy.data.images.load(str(path))
        if suffix == 'base':
            node.image = grade(node.image, name, temporary, saturation, lift)
            links.new(node.outputs['Color'], shader.inputs['Base Color'])
        else:
            node.image.colorspace_settings.name = 'Non-Color'
            normal = nodes.new('ShaderNodeNormalMap')
            normal.inputs['Strength'].default_value = normal_strength
            links.new(node.outputs['Color'], normal.inputs['Color'])
            links.new(normal.outputs['Normal'], shader.inputs['Normal'])
    return material


def elevation(x, half_span=HALF_SPAN, rise=RISE):
    """Two circular arcs meeting at a pointed crown."""
    radius = (half_span ** 2 + rise ** 2) / (2 * half_span)
    return sqrt(max(0, radius ** 2 - (abs(x) + radius - half_span) ** 2))


def vault():
    web = Mesh()
    lunettes = Mesh()
    for ix in range(SEGMENTS):
        for iy in range(SEGMENTS):
            corners = [(ix, iy), (ix, iy + 1), (ix + 1, iy + 1), (ix + 1, iy)]
            points = []
            for i, j in corners:
                x = HALF_SPAN * (2 * i / SEGMENTS - 1)
                y = HALF_DEPTH * (2 * j / SEGMENTS - 1)
                height = max(elevation(x), elevation(y * HALF_SPAN / HALF_DEPTH))
                points.append((x, y, height))
            web.quad(points, [(x / 2.8, y / 2.8) for x, y, _ in points])
    # Masonry side panels close the curved lunettes where the vault meets the walls.
    for side in (-1, 1):
        x = side * HALF_SPAN
        for step in range(SEGMENTS):
            a = HALF_DEPTH * (2 * step / SEGMENTS - 1)
            b = HALF_DEPTH * (2 * (step + 1) / SEGMENTS - 1)
            points = [(x, a, 0), (x, b, 0),
                      (x, b, elevation(b * HALF_SPAN / HALF_DEPTH)),
                      (x, a, elevation(a * HALF_SPAN / HALF_DEPTH))]
            if side == 1:
                points.reverse()
            lunettes.quad(points, [(y / 2.8, (z + SPRING) / 2.8) for _, y, z in points])
    web.make_object('Limewashed vault web', plaster_material)
    lunettes.make_object('Masonry lunettes', wall_material)

    ribs = Mesh()
    rib(ribs, lambda x: -HALF_DEPTH, 0.31)
    for sign in (-1, 1):
        rib(ribs, lambda x: sign * x * HALF_DEPTH / HALF_SPAN, 0.19)
        for end in (-HALF_DEPTH, HALF_DEPTH):
            x = sign * (HALF_SPAN - 0.06)
            inside = end - 0.14 if end > 0 else end
            outside = end if end > 0 else end + 0.14
            ribs.box((x - 0.18, inside, -0.15), (x + 0.18, outside, 0.17), 1.4)
    ribs.box((-0.16, -0.16, RISE - 0.27), (0.16, 0.16, RISE - 0.06), 1.5)
    ribs.make_object('Transverse arch and diagonal ribs', wall_material)


def rib(mesh, center, width):
    sections = []
    for step in range(SEGMENTS + 1):
        x = HALF_SPAN * (2 * step / SEGMENTS - 1)
        y = center(x)
        top = elevation(x) + 0.018
        sections.append([(x, y - width / 2, top), (x, y + width / 2, top),
                         (x, y + width / 2, top - 0.18), (x, y - width / 2, top - 0.18)])
    length = 0
    for a, b in zip(sections, sections[1:]):
        next_length = length + hypot(hypot(b[0][0] - a[0][0], b[0][1] - a[0][1]), b[0][2] - a[0][2])
        for index in range(4):
            following = (index + 1) % 4
            mesh.quad([a[index], b[index], b[following], a[following]],
                      [(length / 1.65, 0), (next_length / 1.65, 0),
                       (next_length / 1.65, 0.15), (length / 1.65, 0.15)])
        length = next_length


def wall_box(name, width, depth, height, y_shift=0, floor=False):
    mesh = Mesh()
    mesh.box((-width / 2, -depth / 2, 0), (width / 2, depth / 2, height),
             3.15 if floor else 2.8, (0, 0, y_shift))
    mesh.make_object(name, floor_material if floor else wall_material)


def portal_cap():
    """A full-depth masonry gable above the entrance's pointed opening."""
    mesh = Mesh()
    half_depth = 0.32
    def opening_height(x):
        return 0.66 * max(0, 1 - abs(x) / 1.75) ** 0.65

    for i in range(30):
        a = 4 * i / 30 - 2
        b = 4 * (i + 1) / 30 - 2
        low_a, low_b = opening_height(a), opening_height(b)
        for side in (-1, 1):
            y = side * half_depth
            points = [(a, y, low_a), (b, y, low_b), (b, y, 3.78), (a, y, 3.78)]
            if side == 1:
                points.reverse()
            mesh.quad(points, [(x / 2.8, (z + 2.86) / 2.8) for x, _, z in points])
        mesh.quad([(a, half_depth, low_a), (b, half_depth, low_b),
                   (b, -half_depth, low_b), (a, -half_depth, low_a)],
                  [(a / 2.8, 0), (b / 2.8, 0), (b / 2.8, 0.23), (a / 2.8, 0.23)])
    mesh.make_object('Pointed stair portal and gable', wall_material)


def profile_solid(mesh, samples, depth, top=None, uv_height=0):
    """Extrude a shaped leaf below the profile or a masonry head above it."""
    front, back = -depth / 2, depth / 2
    for (a, rise_a), (b, rise_b) in zip(samples, samples[1:]):
        low_a, high_a = (rise_a, top) if top is not None else (0, rise_a)
        low_b, high_b = (rise_b, top) if top is not None else (0, rise_b)
        for y in (front, back):
            points = [(a, y, low_a), (b, y, low_b), (b, y, high_b), (a, y, high_a)]
            if y == back:
                points.reverse()
            mesh.quad(points, [(x / 2.8, (z + uv_height) / 2.8) for x, _, z in points])
        for z_a, z_b, reverse in [(low_a, low_b, False), (high_a, high_b, True)]:
            points = [(a, back, z_a), (b, back, z_b), (b, front, z_b), (a, front, z_a)]
            if reverse:
                points.reverse()
            mesh.quad(points, [(x / 2.8, y / 2.8) for x, y, _ in points])
    for (x, height), reverse in [(samples[0], False), (samples[-1], True)]:
        low, high = (height, top) if top is not None else (0, height)
        points = [(x, front, low), (x, front, high), (x, back, high), (x, back, low)]
        if reverse:
            points.reverse()
        mesh.quad(points, [(y / 2.8, (z + uv_height) / 2.8) for _, y, z in points])


def classroom_head(width, depth, height):
    samples, spring, _ = classroom_arch()
    opening_edge = samples[-1][0]
    if width > 2 * opening_edge:
        samples = [(-width / 2, 0), *samples, (width / 2, 0)]
    head = Mesh()
    profile_solid(head, samples, depth, height, spring)
    head.make_object('Arched masonry head and deep reveal', wall_material)

    # The cut-stone course follows the actual opening on both wall faces.
    collar = Mesh()
    for (a, rise_a), (b, rise_b) in zip(samples, samples[1:]):
        if max(abs(a), abs(b)) > opening_edge + 1e-9:
            continue
        for side in (-1, 1):
            y = side * (depth / 2 + 0.001)
            points = [(a, y, rise_a), (b, y, rise_b), (b, y, rise_b + 0.19), (a, y, rise_a + 0.19)]
            if side == 1:
                points.reverse()
            collar.quad(points, [(x / 2.8, z / 2.8 + 0.7) for x, _, z in points])
    collar.make_object('Pointed cut-stone course', wall_material)


def door_material(name, color, roughness=0.76, metallic=0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return material


def pointed_oak_leaf():
    samples, spring, depth = classroom_arch()
    oak = [
        door_material('Weathered oak', (0.118, 0.052, 0.020)),
        door_material('Mid oak', (0.098, 0.039, 0.014)),
        door_material('Dark oak', (0.080, 0.033, 0.012)),
    ]
    # A dark solid edge seals the opening behind the individual plank faces.
    core = Mesh()
    profile_solid(core, [(x, spring + rise) for x, rise in samples], depth - 0.041)
    core.make_object('Full-height fitted oak core', oak[2])
    for index in range(0, len(samples) - 1, 2):
        plank = Mesh()
        left, middle, right = samples[index:index + 3]
        joints = [
            (left[0] + 0.002, spring + left[1] - 0.004),
            (middle[0], spring + middle[1] - 0.004),
            (right[0] - 0.002, spring + right[1] - 0.004),
        ]
        profile_solid(plank, joints, depth - 0.018)
        plank.make_object(f'Oak plank {index // 2 + 1}', oak[(index // 2) % len(oak)])
    hardware = Mesh()
    for low, high in [(-depth / 2, -0.05), (0.05, depth / 2)]:
        for height in (0.42, 1.9):
            hardware.box((-0.87, low, height), (-0.39, high, height + 0.055), 1)
        hardware.box((0.57, low, 1.08), (0.69, high, 1.29), 1)
        hardware.box((0.65, low, 1.15), (0.8, high, 1.18), 1)
    hardware.make_object('Blackened hinges and latch', door_material('Forged iron', (0.034, 0.030, 0.023), 0.52, 0.55))


def export(name, build, tangents=True):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    build()
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / (name + '.glb')), export_format='GLB', export_tangents=tangents)


if __name__ == '__main__':
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory() as temporary:
        wall_material = surface('Weathered masonry', 'masonry', temporary, 512, 0.43, 0.62, 0.14)
        plaster_material = surface('Limewashed masonry', 'masonry', temporary, 384, 0.19, 0.32, 0.59)
        floor_material = surface('Worn flagstones', 'flagstones', temporary, 768, 0.42, 0.58, 0.12)
        for name, build in [
            ('vault_bay', vault),
            ('stair_portal_cap', portal_cap),
            ('stair_portal_jamb', lambda: wall_box('Deep portal jamb', 0.25, 0.64, 2.86)),
            ('bay_wall', lambda: wall_box('Deep masonry wall', 0.8, 4.1, SPRING)),
            ('room_lintel', lambda: wall_box('Deep classroom lintel', 0.8, 1.8, SPRING - 2.25, 2.25)),
            ('hall_gable', lambda: wall_box('Far gable', 4, 0.64, 6.64 - 2.25, 2.25)),
            ('arched_room_lintel', lambda: classroom_head(1.8, 0.8, SPRING - 2.25)),
            ('arched_hall_gable', lambda: classroom_head(4, 0.64, 6.64 - 2.25)),
            ('pointed_oak_door', pointed_oak_leaf),
            ('hall_end_return', lambda: wall_box('Far end masonry return', 1.1, 0.64, 2.25)),
            ('flagstone_slab', lambda: wall_box('Flagstone floor slab', 4, 5, 0.25, floor=True)),
            ('flagstone_threshold', lambda: wall_box('Deep flagstone threshold', 0.8, 1.8, 0.25, floor=True)),
        ]:
            export(name, build)
