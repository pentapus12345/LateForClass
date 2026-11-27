"""Export local First Court render meshes for existing architectural joins."""

import json
from pathlib import Path
import struct
import sys
from tempfile import TemporaryDirectory

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from build_vaulted_bays import Mesh, OUTPUT, SEGMENTS, elevation, door_material
from build_scholars_passage import finish_quad, passage_box, wall_faces
from build_collegiate_bay import material_with_image


def sampled_stone(temporary):
    data = (OUTPUT / 'arched_room_lintel.glb').read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + length])
    texture = gltf['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
    source = gltf['textures'][texture]['source']
    view = gltf['bufferViews'][gltf['images'][source]['bufferView']]
    start = 28 + length + view.get('byteOffset', 0)
    path = Path(temporary) / 'stone.jpg'
    path.write_bytes(data[start:start + view['byteLength']])
    image = bpy.data.images.load(str(path))
    image.scale(256, 256)
    image.filepath_raw = str(path)
    image.file_format = 'JPEG'
    image.save(quality=83)
    return material_with_image('Existing weathered stone', path)


def finish(hex_color, label):
    def linear(value):
        return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4

    return door_material(label, tuple(linear(int(hex_color[i:i + 2], 16) / 255) for i in (0, 2, 4)))


def vault_end(mesh, center, spring, scale, bottom, start_z, end_z):
    """Close between the porch or gable and the actual pointed vault profile."""
    def height(local_x):
        return max(bottom, spring + scale * elevation(local_x) + 0.038)

    sections = [2 * (2 * index / SEGMENTS - 1) for index in range(SEGMENTS + 1)]
    for first, second in zip(sections, sections[1:]):
        high_a, high_b = height(first), height(second)
        if max(high_a, high_b) <= bottom:
            continue
        a, b = center + first * scale, center + second * scale
        for z, reverse in [(start_z, True), (end_z, False)]:
            points = [(a, -z, bottom), (b, -z, bottom), (b, -z, high_b), (a, -z, high_a)]
            if reverse:
                points.reverse()
            mesh.quad(points, [(x / 2.8, y / 2.8) for x, _, y in points])
        top = [(a, -start_z, high_a), (b, -start_z, high_b), (b, -end_z, high_b), (a, -end_z, high_a)]
        top.reverse()
        mesh.quad(top, [(x / 2.8, z / 2.8) for x, z, _ in top])


def masonry_opening(mesh, x, z, near, far, top, height, *, east_face=True):
    """Face a rectangular opening on its existing wall and reveal planes."""
    z0, z1 = z[0] + 0.002, z[1] - 0.002
    top -= 0.002
    # Each face and reveal meets the next at the same edge.
    for a, b in [(near, z0), (z1, far)]:
        wall_faces(mesh, [(x - 0.18, a), (x - 0.18, b)], 0, height, period=2.4)
        if east_face:
            wall_faces(mesh, [(x + 0.18, b), (x + 0.18, a)], 0, height, period=2.4)
    for a, b in [[(x - 0.188, z0), (x + 0.188, z0)], [(x + 0.188, z1), (x - 0.188, z1)]]:
        wall_faces(mesh, [a, b], 0, top, depth=0, period=2.4)
    wall_faces(mesh, [(x - 0.18, z0), (x - 0.18, z1)], top, height, period=2.4)
    if east_face:
        wall_faces(mesh, [(x + 0.18, z1), (x + 0.18, z0)], top, height, period=2.4)
    finish_quad(mesh, [(x - 0.188, z0, top), (x + 0.188, z0, top),
                       (x + 0.188, z1, top), (x - 0.188, z1, top)], (0, 1), 2.4)

def cloister_faces(masonry):
    # The solid spine and the porches use the same stone as the arcade piers and ribs.
    for path, bottom, top in [
        ([(-5.82, 0.18), (4.82, 0.18), (4.82, 4)], 0, 3.7),
        ([(0.18, 22.1), (0.18, 3.82), (-5.82, 3.82)], 0, 3.7),
        ([(0.18, 22.1), (0.18, 4)], 3.7, 5.9),
        ([(0.18, 23.9), (0.18, 22.1)], 3.9, 5.9),
        ([(0.18, 35.82), (0.18, 23.9)], 0, 4.4),
        ([(0.18, 35.82), (0.18, 23.9)], 4.4, 5.9),
        ([(5.18, 32.18), (9.82, 32.18)], 0, 4.4),
    ]:
        wall_faces(masonry, path, bottom, top, period=2.4)

    for x0, x1, y, z0, z1 in [(-5.82, 4.82, 3.698, 0.18, 3.82),
                              (4.99, 9.82, 4.398, 32.18, 35.82),
                              (0.18, 4.99, 4.398, 32, 35.82)]:
        finish_quad(masonry, [(x0, z0, y), (x1, z0, y), (x1, z1, y), (x0, z1, y)], (0, 1), 2.4)

    masonry_opening(masonry, 10, (33, 35), 32.18, 35.82, 3.45, 4.4, east_face=False)
    wall_faces(masonry, [(-0.18, 23.9), (-0.18, 25.82), (-4.32, 25.82),
                         (-4.32, 20.18), (-0.18, 20.18), (-0.18, 22.1)], 0, 0.145, period=2.4)


def jamb(mesh, axis, x, z):
    """Finish the existing plaster reveals directly below the stone spring."""
    across, depth = (z, x) if axis == 'x' else (x, z)
    for side in (-1, 1):
        a, b = sorted((across + side * 0.898, across + side * 0.954))
        left, right = depth - 0.186, depth + 0.186
        low, high = ((left, 0, a), (right, 2.251, b)) if axis == 'x' else (
            (a, 0, left), (b, 2.251, right))
        passage_box(mesh, low, high, 2.8)


def build(temporary):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    stone = sampled_stone(temporary)
    oak = finish('75503a', 'Reception soffit oak')
    plaster = finish('eadfc8', 'Existing reception plaster')
    arrival = finish('c9b9a1', 'Existing arrival plaster')
    paving = finish('938876', 'Lookout recess ground')

    for variant in ('GatehouseJoints', 'CloisterJoints', 'EastRangeJoints'):
        root = bpy.data.objects.new(variant, None)
        bpy.context.collection.objects.link(root)
        masonry, white, south, soffit, ground = (Mesh() for _ in range(5))
        if variant == 'GatehouseJoints':
            # Set both soffit faces behind the vault's X planes. Keep the
            # existing underside, outer wall contacts and collision outlines.
            passage_box(soffit, (-22, 4.55, -16), (-18.035, 4.87, 4), 1.8)
            passage_box(soffit, (-9.965, 4.55, -16), (-6, 4.87, 4), 1.8)
            passage_box(south, (-22, 0, -16.18), (-6, 9, -15.82), 2.8)
            vault_end(south, -14, 4.444, 2, 9, -16.18, -15.82)
            for x0, x1, bottom in [(-22, -20.8, 0), (-20.8, -18.8, 3.2), (-18.8, -6, 0)]:
                passage_box(white, (x0, bottom, 3.82), (x1, 9, 4.18), 2.8)
            vault_end(white, -14, 4.444, 2, 9, 3.82, 4.18)
            for x in (-18, -10):
                for near, far in [(-16.01, -15.36), (-6.23, -5.77), (3.36, 4.01)]:
                    passage_box(masonry, (x - 0.23, 4.397, near), (x + 0.23, 4.53, far), 2.8)
            jamb(masonry, 'x', -14.5, 32)
            jamb(masonry, 'x', -22, -3)
            # The porch begins at the stone reveal. Scholars’ oak begins past its gable.
            masonry_opening(masonry, -6, (1, 3), 1, 3, 3.4, 4.55)
            wall_faces(masonry, [(-20.8, 4.18), (-18.8, 4.18)], 3.2, 4, period=2.4)
            for path in [[(-21.12, 4.18), (-20.8, 4.18)], [(-18.8, 4.18), (-18.48, 4.18)]]:
                wall_faces(masonry, path, 0, 4, period=2.4)
            for path in [[(-20.8, 4.188), (-20.8, 3.812)], [(-18.8, 3.812), (-18.8, 4.188)]]:
                wall_faces(masonry, path, 0, 3.2, depth=0.002, period=2.4)
            finish_quad(masonry, [(-20.8, 3.812, 3.198), (-18.8, 3.812, 3.198),
                                   (-18.8, 4.188, 3.198), (-20.8, 4.188, 3.198)], (0, 1), 2.4)
            masonry_opening(masonry, 10, (41, 43), 40.68, 43.32, 3.1, 4)
        elif variant == 'CloisterJoints':
            cloister_faces(masonry)
            vault_end(masonry, 2.5, 3.2225, 1.25, 3.86, 3.85, 4.035)
            vault_end(masonry, 2.5, 3.2225, 1.25, 4.749, 28.97, 29.13)
            passage_box(masonry, (0, 4.39, 31.96), (5, 5.0, 32.035), 2.8)
            # Seat the existing rib sockets into the solid spine with stepped returns.
            for z in (4, 10.25, 16.5, 22.75, 29):
                passage_box(masonry, (0.17, 2.96, z - 0.16), (0.26, 3.13, z + 0.16), 2.8)
                passage_box(masonry, (0.17, 3.13, z - 0.21), (0.32, 3.35, z + 0.21), 2.8)
                passage_box(masonry, (0.17, 3.35, z - 0.17), (0.30, 4.64, z + 0.17), 2.8)
            jamb(masonry, 'x', 0, 23)
        else:
            # Complete the existing recessed exterior below the lookout.
            # These are exterior skins on the classroom and range walls.
            passage_box(masonry, (30.176, -0.16, 38.175), (30.192, 4.095, 46.04), 2.8)
            passage_box(masonry, (30.192, -0.16, 38.176), (33.85, 4.487, 38.192), 2.8)
            passage_box(ground, (30.016, -0.23, 38.12), (34.06, -0.12, 46.10), 2.8)
            jamb(masonry, 'z', 26, 38)
            jamb(masonry, 'z', 39.5, 38)
            # The low vestibule portal and the taller stair opening end the range's dado.
            for path, bottom, top in [
                ([(16.598, 38.188), (19.402, 38.188)], 3.348, 4),
                ([(19.52, 37.812), (16.48, 37.812)], 3.348, 4.5),
                ([(16.688, 38.18), (16.688, 37.998), (16.598, 37.998),
                  (16.598, 37.812), (16.48, 37.812)], 0, 3.348),
                ([(19.52, 37.812), (19.402, 37.812), (19.402, 37.998),
                  (19.312, 37.998), (19.312, 38.18)], 0, 3.348),
                ([(34.068, 38), (34.068, 37.812), (33.92, 37.812)], 0, 4.5),
                ([(37.08, 37.812), (36.812, 37.812), (36.812, 38)], 0, 4.5),
            ]:
                wall_faces(masonry, path, bottom, top, depth=0, period=2.4)
            finish_quad(masonry, [(16.598, 37.812, 3.348), (19.402, 37.812, 3.348),
                                   (19.402, 38.188, 3.348), (16.598, 38.188, 3.348)], (0, 1), 2.4)
            wall_faces(masonry, [(34.06, 42.57), (34.06, 38)], 0, 2.4, period=2.4)
            for path, bottom, top in [
                ([(34.06, 42.57), (34.06, 42.36)], 2.4, 6.35),
                ([(34.06, 38.28), (34.06, 38)], 2.4, 6.35),
                ([(34.06, 42.57), (34.06, 38)], 6.35, 7.6),
            ]:
                wall_faces(masonry, path, bottom, top, period=2.4)

        for label, mesh, material in [('stone joints', masonry, stone), ('north gable', white, plaster),
                                       ('arrival gable', south, arrival),
                                       ('soffit', soffit, oak), ('recess paving', ground, paving)]:
            if mesh.faces:
                mesh.make_object(f'{variant} {label}', material, use_uv=material == stone)
        for obj in bpy.context.collection.objects:
            if obj.type == 'MESH' and obj.parent is None:
                obj.parent = root

    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / 'first_court_joints.glb'), export_format='GLB')


if __name__ == '__main__':
    with TemporaryDirectory() as directory:
        build(directory)
