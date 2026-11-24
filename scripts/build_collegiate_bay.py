"""Build the reversible hall wall module and its framed portrait in Blender."""

from math import pi
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_vaulted_bays import Mesh, OUTPUT, SOURCE_TEXTURES, SPRING, door_material, export, surface


def material_with_image(name, path):
    result = door_material(name, (1, 1, 1))
    nodes = result.node_tree.nodes
    image = nodes.new('ShaderNodeTexImage')
    image.image = bpy.data.images.load(str(path))
    result.node_tree.links.new(image.outputs['Color'], nodes.get('Principled BSDF').inputs['Base Color'])
    return result


def finish_tile(name, path, color, relief):
    pixels = np.ones((*relief.shape, 4), dtype=np.float32)
    pixels[:, :, :3] = color * relief[:, :, None]
    height, width = relief.shape
    image = bpy.data.images.new(name, width=width, height=height, alpha=False)
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = str(path)
    image.file_format = 'JPEG'
    image.save(quality=82)
    return material_with_image(name, path)


def collegiate_wall(temporary):
    stone = surface('Weathered masonry', 'masonry', temporary, 512, 0.43, 0.62, 0.14)
    rng = np.random.default_rng(18)
    y, x = np.indices((128, 128)) / 128
    mottle = 1 + 0.012 * np.sin(2 * pi * (2 * x + y)) + 0.011 * np.cos(2 * pi * (x - 3 * y))
    mottle += 0.008 * np.sin(2 * pi * (5 * x + 6 * y)) + rng.normal(0, 0.007, (128, 128))
    plaster = finish_tile('Aged lime plaster', Path(temporary) / 'plaster.jpg', (0.82, 0.78, 0.69), mottle)
    grain = 1 + 0.102 * np.sin(2 * pi * (17 * x + 0.23 * np.sin(2 * pi * y)))
    grain += 0.043 * np.sin(2 * pi * (36 * x - y)) + rng.normal(0, 0.023, (128, 128))
    oak = finish_tile('Panelled oak', Path(temporary) / 'oak.jpg', (0.47, 0.30, 0.17), grain)
    levels = json.loads((Path(__file__).resolve().parents[1] / 'assets/levels.json').read_text())['levels']
    placement = next(item for level in levels for item in level.get('environmentObjects', [])
                     if item.get('asset') == 'collegiateBayWall' and 'windowOpening' in item)
    opening = placement['windowOpening']
    # Blender Y becomes negative Z in the game, and Blender Z is height above the module base.
    center = placement['z'] - opening['center']
    bottom = opening['bottom'] - placement['y']
    aperture = (center - opening['width'] / 2, center + opening['width'] / 2, bottom, bottom + opening['height'])
    build_wall_variant('PlainBay', stone, plaster, oak)
    build_wall_variant('WindowBay', stone, plaster, oak, aperture)
    jamb = Mesh()
    jamb.box((-0.125, -0.32, 0), (0.125, 0.32, 2.86), 2.8)
    jamb.make_object('PortalJamb', stone)


def cut_box(mesh, low, high, period, aperture):
    if aperture is None:
        mesh.box(low, high, period)
        return
    x, y, z = low
    end_x, end_y, end_z = high
    left, right, sill, head = aperture
    cut_left, cut_right = max(y, left), min(end_y, right)
    cut_low, cut_high = max(z, sill), min(end_z, head)
    if cut_left >= cut_right or cut_low >= cut_high:
        mesh.box(low, high, period)
        return
    for start, end, minimum, maximum in [(y, cut_left, z, end_z), (cut_right, end_y, z, end_z),
                                         (cut_left, cut_right, z, cut_low), (cut_left, cut_right, cut_high, end_z)]:
        if end > start and maximum > minimum:
            mesh.box((x, start, minimum), (end_x, end, maximum), period)


def build_wall_variant(name, stone, plaster, oak, aperture=None):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    wall = Mesh()
    cut_box(wall, (-0.36, -2.05, 0), (0.4, 2.05, SPRING), 2.8, aperture)
    for left, right in [(-2.05, -1.86), (1.86, 2.05)]:
        cut_box(wall, (-0.4, left, 0), (-0.36, right, SPRING), 2.8, aperture)
    wall.make_object('Masonry backing and jamb returns', stone)

    face = Mesh()
    cut_box(face, (-0.388, -1.86, 1.1), (-0.36, 1.86, SPRING), 2.5, aperture)
    face.make_object('Lime-plastered upper wall', plaster)

    field = Mesh()
    cut_box(field, (-0.378, -1.86, 0), (-0.36, 1.86, 1.1), 0.7, aperture)
    for index in range(8):
        left = (index - 4) * 0.465
        cut_box(field, (-0.388, left + 0.067, 0.226), (-0.378, left + 0.398, 0.921), 0.7, aperture)
    field.make_object('Recessed oak panel fields', oak)

    trim = Mesh()
    for low, high, front in [(0, 0.132, -0.4), (0.132, 0.18, -0.396), (0.18, 0.208, -0.391),
                              (0.94, 1.021, -0.392), (1.021, 1.101, -0.396), (1.101, 1.137, -0.4)]:
        cut_box(trim, (front, -1.86, low), (-0.378, 1.86, high), 0.85, aperture)
    for index in range(9):
        joint = (index - 4) * 0.465
        left = max(-1.86, joint - 0.032)
        right = min(1.86, joint + 0.032)
        cut_box(trim, (-0.397, left, 0.205), (-0.378, right, 0.94), 0.85, aperture)
    trim.make_object('Oak cap, stiles, and skirting', oak)
    for item in bpy.context.scene.objects:
        if item.type == 'MESH' and item.parent is None:
            item.parent = root


def framed_portrait(temporary):
    resized = Path(temporary) / 'portrait.jpg'
    subprocess.run(['sips', '-Z', '256', '-s', 'formatOptions', '83', str(SOURCE_TEXTURES / 'portrait_john_locke.jpg'),
                    '--out', str(resized)], check=True, stdout=subprocess.DEVNULL)
    image = material_with_image('Portrait canvas', resized)
    picture = Mesh()
    picture.quad([(-0.345, -0.029, 0.079), (0.345, -0.029, 0.079), (0.345, -0.029, 0.921),
                  (-0.345, -0.029, 0.921)], [(0, 0), (1, 0), (1, 1), (0, 1)])
    picture.make_object('Replaceable portrait canvas', image)

    def moulding(name, profiles, material):
        def corners(radius, bottom, front):
            return [(-radius, front, bottom), (radius, front, bottom), (radius, front, 1 - bottom),
                    (-radius, front, 1 - bottom)]

        frame = Mesh()
        for first, second in zip(profiles, profiles[1:]):
            outside, inside = corners(*first), corners(*second)
            for index in range(4):
                next_corner = (index + 1) % 4
                frame.quad([outside[index], outside[next_corner], inside[next_corner], inside[index]],
                           [(0, 0), (1, 0), (1, 1), (0, 1)])
        frame.make_object(name, material)

    moulding('Stained oak frame', [(0.423, 0, 0.01), (0.423, 0, -0.028), (0.411, 0.012, -0.047),
                                  (0.384, 0.039, -0.056), (0.37, 0.053, -0.044)],
              door_material('Dark frame oak', (0.105, 0.052, 0.023), 0.56))
    moulding('Gilt inner bead', [(0.37, 0.053, -0.044), (0.361, 0.062, -0.051),
                                 (0.35, 0.073, -0.046), (0.344, 0.079, -0.03)],
              door_material('Aged gilt', (0.51, 0.294, 0.068), 0.54, 0.35))


if __name__ == '__main__':
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory() as temporary:
        export('collegiate_bay_wall', lambda: collegiate_wall(temporary))
        export('framed_portrait', lambda: framed_portrait(temporary))
