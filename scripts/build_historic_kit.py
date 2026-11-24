"""Run with Blender's offline Python to export the original historic starter kit."""

import math
from pathlib import Path

import bpy


OUTPUT = Path(__file__).resolve().parents[1] / 'assets/models/runtime/architecture'


def material(name, hex_color, roughness=0.75, metallic=0):
    def linear(channel):
        value = int(channel, 16) / 255
        return value / 12.92 if value < 0.04045 else ((value + 0.055) / 1.055) ** 2.4

    color = tuple(linear(hex_color[index:index + 2]) for index in (0, 2, 4)) + (1,)
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    shader = result.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return result


def box(name, center, dimensions, surface):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(surface)


def prism(name, corners, depth, surface):
    vertices = [(x, y, z) for y in (-depth / 2, depth / 2) for x, z in corners]
    faces = [(0, 1, 2, 3), (7, 6, 5, 4)]
    faces.extend((index + 4, (index + 1) % 4 + 4, (index + 1) % 4, index) for index in range(4))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(surface)


def export(name, build):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    build()
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = bpy.context.selected_objects[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bevel = obj.modifiers.new('Soft edges', 'BEVEL')
    bevel.width = 0.006
    bevel.segments = 1
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / (name + '.glb')), export_format='GLB')


def pier():
    for index in range(10):
        z = index * 0.277 + 0.1385
        box('cut limestone', (0, 0, z), (0.27 if index in (0, 9) else 0.22, 0.24, 0.277), stone[index % 3])
    box('pier capital', (0, 0, 2.82), (0.32, 0.3, 0.1), stone[0])


def arch():
    def rise(t):
        return 0.32 * (1 - abs(2 * t - 1) ** 1.55)

    for index in range(14):
        left = index / 14
        right = (index + 1) / 14
        start = -1.96 + 3.92 * left
        end = -1.96 + 3.92 * right
        low = rise(left)
        high = rise(right)
        prism('limestone voussoir', [(start, low), (end, high), (end, high + 0.19), (start, low + 0.19)],
              0.30, stone[index % 3])


def door():
    box('flush oak core', (0, 0, 1.125), (1.8, 0.077, 2.25), oak[1])
    for index in range(9):
        x = (index - 4) * 0.2
        box('oak board', (x, 0, 1.125), (0.193, 0.101, 2.25), oak[index % 3])
    for side in (-1, 1):
        for z in (0.32, 1.9):
            box('iron strap', (-0.59, side * 0.053, z), (0.48, 0.014, 0.045), iron)
        box('latch plate', (0.66, side * 0.053, 1.03), (0.10, 0.014, 0.24), iron)
        box('brass lever', (0.61, side * 0.056, 1.035), (0.16, 0.008, 0.04), brass)


def jamb():
    box('oak casing', (0, 0, 1.125), (0.092, 0.058, 2.25), oak[1])
    box('casing ridge', (0, 0, 1.125), (0.034, 0.074, 2.25), oak[0])


def head():
    box('oak head', (0, 0, 0.06), (1.984, 0.060, 0.12), oak[1])
    box('head moulding', (0, 0, 0.085), (2.02, 0.078, 0.041), oak[0])


def window():
    box('deep sill', (0, 0, 0.045), (1.34, 0.26, 0.09), stone[0])
    box('oak bottom rail', (0, 0, 0.13), (1.16, 0.11, 0.085), oak[0])
    for x in (-0.53, 0, 0.53):
        box('window mullion', (x, 0, 0.70), (0.075, 0.11, 1.14), oak[1])
    box('window cross rail', (0, 0, 0.75), (1.16, 0.1, 0.063), oak[0])
    for x, direction in [(-0.53, 1), (0.53, -1)]:
        tip = -direction * 0.02
        prism('pointed limestone head',
              [(x - 0.044, 1.20), (x + 0.044, 1.20), (tip + 0.049, 1.55), (tip - 0.049, 1.55)],
              0.17, stone[1])
    box('stone window cap', (0, 0, 1.55), (0.19, 0.19, 0.071), stone[0])


OUTPUT.mkdir(parents=True, exist_ok=True)
stone = [material('Limestone ' + name, color, 0.91)
         for name, color in [('warm', 'B4A48C'), ('light', 'C2B39B'), ('grey', 'A99E8E')]]
oak = [material('Oak ' + name, color, 0.78)
       for name, color in [('mid', '79573C'), ('dark', '583923'), ('worn', '8C6240')]]
iron = material('Blackened iron', '323331', 0.64, 0.45)
brass = material('Worn brass', 'A1814F', 0.53, 0.55)

for name, build in [('stone_pier', pier), ('stone_arch', arch), ('oak_door', door), ('oak_jamb', jamb),
                    ('oak_head', head), ('mullioned_window', window)]:
    export(name, build)
