"""Export the original worn oak finish and lantern with Blender's offline Python."""

from math import cos, pi, sin
from pathlib import Path
from tempfile import TemporaryDirectory

import bpy
import numpy as np


OUTPUT = Path(__file__).resolve().parents[1] / 'assets/models/runtime/architecture'


def material(name, color, roughness, metallic=0):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    shader = result.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return result


def worn_oak(path):
    size = 256
    rng = np.random.default_rng(18)
    rows, columns = np.indices((size, size)) / size
    planks = columns * 7
    index = planks.astype(int)
    edge = planks % 1
    ends = (rows + rng.random(7)[index]) % 1
    warp = 0.012 * np.sin(2 * pi * (2 * rows + columns))
    grain = np.sin(2 * pi * (37 * columns + warp * 37)) + 0.42 * np.sin(2 * pi * (97 * columns + warp * 53))
    wear = 0.08 * np.sin(2 * pi * (3 * rows + rng.random(7)[index]))
    brightness = 1 + grain * 0.065 + wear + rng.normal(0, 0.026, (size, size))
    brightness *= rng.uniform(0.8, 1.21, 7)[index]
    brightness *= np.where((edge < 0.046) | (ends < 0.008), 0.48, 1)
    brightness *= np.where((edge > 0.955) | (ends > 0.992), 1.12, 1)
    pixels = np.ones((size, size, 4), dtype=np.float32)
    pixels[:, :, :3] = brightness[:, :, None] * (0.29, 0.164, 0.079)
    image = bpy.data.images.new('Worn oak board tile', width=size, height=size, alpha=False)
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = str(path)
    image.file_format = 'JPEG'
    image.save(quality=86)
    oak = material('Worn oak', (1, 1, 1), 0.83)
    node = oak.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = bpy.data.images.load(str(path))
    oak.node_tree.links.new(node.outputs['Color'], oak.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    bpy.ops.mesh.primitive_plane_add(size=1)
    bpy.context.object.data.materials.append(oak)


def lantern():
    iron = material('Forged iron', (0.085, 0.059, 0.033), 0.55, 0.45)
    glass = material('Warm lantern glass', (0.49, 0.30, 0.13), 0.63)
    shader = glass.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value = (0.97, 0.72, 0.44, 1)
    shader.inputs['Emission Strength'].default_value = 1

    def rings(name, profile, surface, capped=True):
        count = 6
        vertices = [(radius * cos(2 * pi * i / count), radius * sin(2 * pi * i / count), height)
                    for radius, height in profile for i in range(count)]
        faces = [(start + i, start + (i + 1) % count, start + (i + 1) % count + count, start + i + count)
                 for start in range(0, len(vertices) - count, count) for i in range(count)]
        if capped:
            faces += [tuple(reversed(range(count))), tuple(range(len(vertices) - count, len(vertices)))]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        mesh.materials.append(surface)
        return obj

    foot = rings('Lantern foot', [(0.08, 0), (0.15, 0.025), (0.16, 0.065)], iron)
    rings('Lantern panes', [(0.147, 0.061), (0.182, 0.338)], glass, capped=False)
    canopy = rings('Lantern canopy and stem', [(0.195, 0.33), (0.20, 0.36), (0.07, 0.455), (0.022, 0.46),
                                              (0.022, 0.651), (0.068, 0.662), (0.068, 0.68)], iron)
    frame = [foot, canopy]
    for index in range(6):
        angle = index * pi / 3
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.17 * cos(angle), 0.17 * sin(angle), 0.20))
        post = bpy.context.object
        post.name = 'Lantern mullion'
        post.scale = (0.024, 0.021, 0.28)
        post.rotation_euler = (0, 0.127, angle)
        post.data.materials.append(iron)
        frame.append(post)
    bpy.ops.object.select_all(action='DESELECT')
    for part in frame:
        part.select_set(True)
    bpy.context.view_layer.objects.active = canopy
    bpy.ops.object.join()
    canopy.name = 'Forged lantern frame'


def export(name, build):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    build()
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / f'{name}.glb'), export_format='GLB')


if __name__ == '__main__':
    with TemporaryDirectory() as temporary:
        export('worn_oak', lambda: worn_oak(Path(temporary) / 'worn_oak.jpg'))
        export('iron_lantern', lantern)
