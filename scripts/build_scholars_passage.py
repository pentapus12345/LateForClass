"""Build the fitted Scholars' Passage sample with Blender's offline Python."""

import json
from pathlib import Path
import struct
import sys
from tempfile import TemporaryDirectory

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from build_vaulted_bays import Mesh, OUTPUT
from build_collegiate_bay import material_with_image


def reuse_wall_material(name, label, temporary, color, texture_weight):
    """Reuse the optimized images from the approved collegiate wall."""
    data = (OUTPUT / 'collegiate_bay_wall.glb').read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + length])
    material = next(item for item in gltf['materials'] if item['name'] == name)
    texture = material['pbrMetallicRoughness']['baseColorTexture']['index']
    image = gltf['images'][gltf['textures'][texture]['source']]
    view = gltf['bufferViews'][image['bufferView']]
    start = 28 + length + view.get('byteOffset', 0)
    path = Path(temporary) / (name + '.jpg')
    path.write_bytes(data[start:start + view['byteLength']])
    image = bpy.data.images.load(str(path))
    pixels = np.empty(len(image.pixels), dtype=np.float32)
    image.pixels.foreach_get(pixels)
    rgb = pixels.reshape((-1, 4))[:, :3]
    rgb[:] = rgb * texture_weight + np.array(color) * (1 - texture_weight)
    image.pixels.foreach_set(pixels)
    graded = Path(temporary) / (label + '.jpg')
    image.filepath_raw = str(graded)
    image.file_format = 'JPEG'
    image.save(quality=83)
    return material_with_image(label, graded)


def runner_material(temporary):
    # Worn centre, faded double guard stripes and small repeating lozenges.
    size = 128
    z, x = np.indices((size, size))
    edge = np.minimum(x, size - 1 - x)
    yarn = np.random.default_rng(26).normal(0, 0.012, x.shape) + 0.012 * (-1.0) ** (x + z)
    colors = np.broadcast_to([0.31, 0.13, 0.10], (*x.shape, 3)).copy()
    colors[edge < 15] = [0.20, 0.17, 0.13]
    colors[(edge == 5) | (edge == 12) | (edge == 13)] = [0.45, 0.31, 0.18]
    diamond = np.abs(x - 63.5) / 27 + np.abs(z - 63.5) / 45
    colors[(diamond > 0.84) & (diamond < 1.02)] = [0.44, 0.24, 0.14]
    colors[diamond < 0.27] = [0.235, 0.117, 0.081]
    fade = np.exp(-((x - 63.5) / 38) ** 2) * 0.24
    colors = colors * (1 - fade[..., None]) + np.array([0.28, 0.215, 0.16]) * fade[..., None]
    pixels = np.ones((*x.shape, 4), dtype=np.float32)
    pixels[:, :, :3] = np.clip(colors + yarn[..., None], 0, 1)
    image = bpy.data.images.new('Woven passage runner', width=size, height=size, alpha=False)
    image.pixels.foreach_set(pixels.ravel())
    path = Path(temporary) / 'runner.jpg'
    image.filepath_raw = str(path)
    image.file_format = 'JPEG'
    image.save(quality=83)
    return material_with_image('Faded russet wool', path)


def passage_box(mesh, low, high, period):
    """Build in surveyed game coordinates, converted to Blender's Z up."""
    x, y, z = low
    right, top, far = high
    mesh.box((x, -far, y), (right, -z, top), period)


def fitted_wall(plaster, wood, trim, axis, wall, inward, start, end, plaster_course=True):
    def band(mesh, a, b, bottom, top, back, face, period):
        near, far = sorted((wall + back * inward, wall + face * inward))
        if axis == 'x':
            passage_box(mesh, (near, bottom, a), (far, top, b), period)
        else:
            passage_box(mesh, (a, bottom, near), (b, top, far), period)

    if plaster_course:
        band(plaster, start, end, 1.055, 3.998, -0.005, 0.008, 1.8)
    band(wood, start, end, 0, 1.055, -0.006, 0.014, 0.71)
    for bottom, top, depth in [(0, 0.102, 0.044), (0.102, 0.144, 0.036), (0.144, 0.207, 0.028),
                               (0.875, 0.977, 0.028), (0.977, 1.028, 0.037), (1.028, 1.065, 0.045)]:
        band(trim, start, end, bottom, top, 0.012, depth, 0.82)
    bays = max(1, round((end - start) / 0.67))
    for index in range(bays + 1):
        joint = start + (end - start) * index / bays
        band(trim, max(start, joint - 0.030), min(end, joint + 0.030), 0.207, 0.875, 0.012, 0.035, 0.67)


def build(temporary):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    plaster, wood, trim, runner = Mesh(), Mesh(), Mesh(), Mesh()
    walls = [
        # Axis, wall face, inward direction and the start/end of each uninterrupted run.
        ('x', -21.12, 1, 4.180, 9.097),
        ('x', -21.12, 1, 10.903, 23.271),
        ('x', -18.48, -1, 4.180, 15.097),
        ('x', -18.48, -1, 16.903, 20.499, False),
        ('z', 23.32, -1, -21.121, -14.526),
        ('z', 20.68, 1, -18.301, -11.680, False),
    ]
    for row in walls:
        fitted_wall(plaster, wood, trim, *row)

    # Cap the exposed wall ends beside the doors. Offset the visible reveal
    # from the original shared end plane and meet the existing stone spring.
    for west, east, opening in [(-21.48, -21.075, 10), (-18.525, -18.12, 16)]:
        for edge, sign in [(opening - 0.9, 1), (opening + 0.9, -1)]:
            a, b = sorted((edge - sign * 0.083, edge + sign * 0.002))
            passage_box(trim, (west + 0.003, 0, a), (east - 0.003, 2.25, b), 0.64)

    # Return the inside corner onto the cross passage, with its end grain hidden.
    passage_box(trim, (-18.491, 0, 20.501), (-18.117, 1.065, 20.509), 0.67)
    passage_box(trim, (-18.309, 0, 20.509), (-18.296, 1.065, 20.681), 0.67)
    # Connect the actual finish planes. The old box ends left millimetre-wide
    # strips of the lighter substrate visible at grazing angles.
    corner = [(-18.488, 16.903), (-18.488, 20.508), (-18.308, 20.508),
              (-18.308, 20.688), (-11.680, 20.688)]
    for (x, z), (end_x, end_z) in zip(corner, corner[1:]):
        plaster.quad([(x, -z, 1.055), (end_x, -end_z, 1.055),
                      (end_x, -end_z, 3.998), (x, -z, 3.998)],
                     [(0, 1.055 / 1.8), (np.hypot(end_x - x, end_z - z) / 1.8, 1.055 / 1.8),
                      (np.hypot(end_x - x, end_z - z) / 1.8, 3.998 / 1.8), (0, 3.998 / 1.8)])
    # Two shallow ceiling ties carry the straight passage lanterns.
    for z in (8.2, 16.9):
        passage_box(trim, (-21.114, 3.90, z - 0.082), (-18.487, 4.006, z + 0.082), 0.82)

    # Narrow wall-mounted ledge below the notice, off the walk and door lines.
    passage_box(trim, (-21.13, 1.106, 15.67), (-21.002, 1.142, 16.93), 0.67)
    for z in (15.80, 16.80):
        passage_box(trim, (-21.13, 1.063, z - 0.019), (-21.044, 1.107, z + 0.019), 0.67)

    # One layer above the boards, with the centre aisle and thresholds unchanged.
    runner.quad([(-20.28, -5.18, 0.007), (-19.32, -5.18, 0.007),
                 (-19.32, -19.68, 0.007), (-20.28, -19.68, 0.007)][::-1],
                [(0, 0), (1, 0), (1, 13), (0, 13)][::-1])
    plaster.make_object('Warm lime plaster',
                        reuse_wall_material('Aged lime plaster', 'Soft limewash', temporary, (0.75, 0.70, 0.61), 0.34))
    wood.make_object('Fitted dark oak joinery',
                     reuse_wall_material('Panelled oak', 'Recessed oak', temporary, (0.31, 0.153, 0.073), 0.27))
    trim.make_object('Oak mouldings and fitted ledge',
                     reuse_wall_material('Panelled oak', 'Polished oak moulding', temporary, (0.46, 0.253, 0.123), 0.22))
    runner.make_object('Worn Scholars Passage runner', runner_material(temporary))
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / 'scholars_passage.glb'), export_format='GLB',
                              export_image_format='AUTO', export_yup=True)


if __name__ == '__main__':
    with TemporaryDirectory() as directory:
        build(directory)
