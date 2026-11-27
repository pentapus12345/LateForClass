"""Build the fitted Scholars' Passage finishes with Blender's offline Python."""

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


FIRST_COURT_MANIFEST = OUTPUT.parents[2] / 'schools' / 'first-court.json'
OAK_CAP = 1.065
OAK_CAP_DEPTH = 0.045
PORTAL_CASING_WIDTH = 0.12
PORTAL_WALL_HALF_DEPTH = 0.18
WALL_FINISH_OFFSET = 0.008
SCHOLARS_PASSAGE_FINISH = {
    'wallMaterials': (
        ('Aged lime plaster', 'Soft limewash', (0.75, 0.70, 0.61), 0.34),
        ('Panelled oak', 'Scholars recessed oak', (0.31, 0.153, 0.073), 0.27),
        ('Panelled oak', 'Scholars oak moulding', (0.46, 0.253, 0.123), 0.22),
    ),
    'capHeight': OAK_CAP,
    'runnerWidth': 0.96,
    'runnerRepeat': 1.12,
}


def finish_source(items, reference, key='name'):
    """Resolve an explicit reference to an existing area, wall or opening."""
    matches = [item for item in items if item.get(key) == reference]
    if len(matches) != 1:
        raise ValueError(f'Expected one finish source matching {key} {reference!r}, found {len(matches)}')
    return matches[0]


def platform_edge(platform, axis, side):
    extent = platform[{'x': 'width', 'z': 'depth'}[axis]]
    return platform[axis] + side * extent / 2


def passage_wall_face(before, after, inward):
    """Keep the ceiling plate on one line across the doorway."""
    face = platform_edge(before, 'x', inward)
    if not np.isclose(face, platform_edge(after, 'x', inward), rtol=0, atol=1e-9):
        raise ValueError(f"Finish faces do not align across the opening between {before['name']!r} and {after['name']!r}")
    return face


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


def wall_edges(path):
    """Walk finish faces with the room on the right. Include the closing point for a loop."""
    normals = []
    for (x, z), (end_x, end_z) in zip(path, path[1:]):
        length = np.hypot(end_x - x, end_z - z)
        normals.append(((z - end_z) / length, (end_x - x) / length))

    # At a right-angle turn, the sum locates the mitre at every moulding depth.
    closed = path[0] == path[-1]
    offsets = [normals[-1] if closed else (0, 0), *normals, normals[0] if closed else (0, 0)]
    corners = [(x + end_x, z + end_z) for (x, z), (end_x, end_z) in zip(offsets, offsets[1:])]
    for a, b, near, far in zip(path, path[1:], corners, corners[1:]):
        yield a, b, near, far


def offset(point, direction, distance):
    return tuple(value + component * distance for value, component in zip(point, direction))


def finish_quad(mesh, points, uv_axes, period):
    mesh.quad([(x, -z, y) for x, z, y in points],
              [tuple(point[axis] / period for axis in uv_axes) for point in points])


def wall_faces(mesh, path, bottom, top, depth=WALL_FINISH_OFFSET, period=1.8):
    for a, b, near, far in wall_edges(path):
        first, last = offset(a, near, depth), offset(b, far, depth)
        uv_axes = (0 if a[0] != b[0] else 1, 2)
        finish_quad(mesh, [(*first, bottom), (*last, bottom), (*last, top), (*first, top)], uv_axes, period)


def portal_edges(profile):
    """Pair the clear opening and the casing edge, from jamb to jamb at the spring."""
    radius = profile['width'] / 2
    for i, rise in enumerate(profile['rise']):
        fraction = 2 * i / (len(profile['rise']) - 1) - 1
        yield ((fraction * radius, rise),
               (fraction * (radius + PORTAL_CASING_WIDTH), rise + 0.15 * (1 - abs(fraction))))


def portal_wall(mesh, area, profiles, name, side, top, period=1.8):
    """Continue the adjoining wall finish from the outer arch to its ceiling."""
    opening = finish_source(area['environmentObjects'], name)
    profile = profiles[opening['archOpening']]
    along_x = opening['rotationY'] == 0
    axes = (0 if along_x else 1, 2)

    def point(across, height):
        face = side * (PORTAL_WALL_HALF_DEPTH + WALL_FINISH_OFFSET)
        x, z = (across, face) if along_x else (face, -across)
        return opening['x'] + x, opening['z'] + z, height

    outer = [edge for _, edge in portal_edges(profile)]
    for (a, low_a), (b, low_b) in zip(outer, outer[1:]):
        points = [point(a, opening['y'] + low_a), point(b, opening['y'] + low_b),
                  point(b, top), point(a, top)]
        finish_quad(mesh, points if side > 0 else points[::-1], axes, period)


def panelled_walls(plaster, field, oak, path, top=4, height=1):
    """Fit the sample's stepped skirting, recessed field, stiles and cap to one wall run."""
    profile = [(0, 0.044), (0.102, 0.044), (0.102, 0.036), (0.144, 0.036),
               (0.144, 0.028), (0.207, 0.028), (0.207, 0.014), (0.875, 0.014),
               (0.875, 0.028), (0.977, 0.028), (0.977, 0.037), (1.028, 0.037),
               (1.028, OAK_CAP_DEPTH), (OAK_CAP, OAK_CAP_DEPTH), (OAK_CAP, 0)]
    wall_faces(plaster, path, OAK_CAP * height, top)
    for a, b, near, far in wall_edges(path):
        uv_axes = (0 if a[0] != b[0] else 1, 2)
        for (low, back), (high, front) in zip(profile, profile[1:]):
            first, last = offset(a, near, back), offset(b, far, back)
            next_first, next_last = offset(a, near, front), offset(b, far, front)
            is_field = low == 0.207 and high == 0.875
            axes = (0, 1) if low == high else uv_axes
            finish_quad(field if is_field else oak,
                        [(*first, low * height), (*last, low * height),
                         (*next_last, high * height), (*next_first, high * height)],
                        axes, 0.71 if is_field else 0.82)

        a_field, b_field = offset(a, near, 0.014), offset(b, far, 0.014)
        delta = np.subtract(b_field, a_field)
        length = np.linalg.norm(delta)
        steps = max(1, round(length / 0.67))
        first = np.array(a_field)
        normal = (-delta[1] / length, delta[0] / length)
        # End stiles meet at the mitre. Intermediate stiles expose both sides.
        for index in range(steps + 1):
            joint = length * index / steps
            start = first + delta * (max(0, joint - 0.030) / length)
            end = first + delta * (min(length, joint + 0.030) / length)
            outside_start = offset(start, near if index == 0 else normal, 0.021)
            outside_end = offset(end, far if index == steps else normal, 0.021)
            stile = [start, outside_start, outside_end, end]
            faces = list(zip(stile, stile[1:]))
            if index == 0 and near != normal:
                faces = faces[1:]
            if index == steps and far != normal:
                faces = faces[:-1]
            for left, right in faces:
                axes = (0 if abs(right[0] - left[0]) > abs(right[1] - left[1]) else 1, 2)
                finish_quad(oak, [(*left, 0.207 * height), (*right, 0.207 * height),
                                  (*right, 0.875 * height), (*left, 0.875 * height)], axes, 0.67)

    # The casing hides the cut edge at openings, but the profile still needs a return.
    if path[0] != path[-1]:
        for point, neighbor, reverse in [(path[0], path[1], True), (path[-1], path[-2], False)]:
            dx, dz = np.subtract(neighbor, point)
            length = np.hypot(dx, dz)
            normal = ((-1 if reverse else 1) * dz / length, (1 if reverse else -1) * dx / length)
            axes = (0 if dx == 0 else 1, 2)
            for (low, back), (high, front) in zip(profile, profile[1:]):
                if low == high:
                    continue
                points = [(*point, low * height), (*offset(point, normal, back), low * height),
                          (*offset(point, normal, front), high * height), (*point, high * height)]
                finish_quad(oak, points if reverse else points[::-1], axes, 0.82)


def oak_wall_plates(mesh, path, height):
    """Follow the ceiling perimeter, mitring at both inside and outside corners."""
    depth = 0.105
    bottom = height - 0.26
    wall_faces(mesh, path, bottom, height + 0.008, depth, 1.2)
    for a, b, near, far in wall_edges(path):
        first, last = offset(a, near, depth), offset(b, far, depth)
        finish_quad(mesh, [(*a, bottom), (*b, bottom), (*last, bottom), (*first, bottom)], (0, 1), 1.2)


def oak_ties(mesh, axis, left, right, height, centers):
    """Seat transverse ties into the continuous wall plates."""
    for center in centers:
        low, high = (center - 0.094, height - 0.225, left + 0.105), (center + 0.094, height + 0.008, right - 0.105)
        if axis == 'z':
            low, high = low[::-1], high[::-1]
        passage_box(mesh, low, high, 1.2)


def runner_strip(mesh, axis, center, start, end):
    width = SCHOLARS_PASSAGE_FINISH['runnerWidth']
    near, far = center - width / 2, center + width / 2
    repeat = round((end - start) / SCHOLARS_PASSAGE_FINISH['runnerRepeat'])
    points = [(near, start), (far, start), (far, end), (near, end)]
    uvs = [(0, 0), (1, 0), (1, repeat), (0, repeat)]
    if axis == 'x':
        points = [(z, x) for x, z in points]
    else:
        points.reverse()
        uvs.reverse()
    mesh.quad([(x, -z, 0.007) for x, z in points], uvs)


def scholars_materials(temporary):
    return tuple(reuse_wall_material(name, label, temporary, color, weight)
                 for name, label, color, weight in SCHOLARS_PASSAGE_FINISH['wallMaterials'])


def scholars_panelling(plaster, field, oak, paths, ceiling_height):
    height_scale = SCHOLARS_PASSAGE_FINISH['capHeight'] / OAK_CAP
    for path in paths:
        panelled_walls(plaster, field, oak, path, ceiling_height, height_scale)


def build(temporary):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    plaster, wood, trim, runner = Mesh(), Mesh(), Mesh(), Mesh()
    manifest = json.loads(FIRST_COURT_MANIFEST.read_text())
    gatehouse = finish_source(manifest['areas'], 'gatehouse', key='id')['definition']
    walls = gatehouse['platforms']
    west_before = finish_source(walls, 'West school wall bay 1')
    west_after = finish_source(walls, 'West school wall bay 2')
    east_before = finish_source(walls, 'East school wall bay 1')
    east_after = finish_source(walls, 'East school wall bay 2')
    reading_before = finish_source(walls, 'Library wall bay 1')
    reading_after = finish_source(walls, 'Library wall bay 2')
    reception_end = platform_edge(finish_source(walls, 'Reception gable lintel 1'), 'z', 1)
    west_face = passage_wall_face(west_before, west_after, 1)
    east_face = passage_wall_face(east_before, east_after, -1)
    east_turn_end = platform_edge(east_after, 'z', 1)
    reading_face = passage_wall_face(reading_before, reading_after, 1)
    paths = [
        # West wall past the bursary, then around the outside of the first turn.
        [(west_face, platform_edge(west_before, 'z', 1) - PORTAL_CASING_WIDTH), (west_face, reception_end)],
        [(reading_face, platform_edge(reading_before, 'z', 1) - PORTAL_CASING_WIDTH), (reading_face, 23.32),
         (west_face, 23.32), (west_face, platform_edge(west_after, 'z', -1) + PORTAL_CASING_WIDTH)],
        # East wall past the Schoolroom, around the short return and the north turn.
        [(east_face, reception_end), (east_face, platform_edge(east_before, 'z', 1) - PORTAL_CASING_WIDTH)],
        [(east_face, platform_edge(east_after, 'z', -1) + PORTAL_CASING_WIDTH), (east_face, east_turn_end),
         (east_after['x'], east_turn_end), (east_after['x'], 20.68),
         (-11.68, 20.68), (-11.68, 40.68), (9.82, 40.68)],
        [(9.82, 43.32), (reading_face, 43.32), (reading_face, platform_edge(reading_after, 'z', -1) + PORTAL_CASING_WIDTH)],
    ]
    scholars_panelling(plaster, wood, trim, paths, 4)

    for head, side in [('Bursar masonry head', 1), ('Gatehouse schoolroom door arched head', -1),
                       ('Reading room door arched head', 1)]:
        portal_wall(plaster, gatehouse, manifest['doorProfiles'], head, side, 4)

    # Run the plates around the turns and seat a tie at each leg of the approach.
    perimeter = [
        (west_face, reception_end), (east_face, reception_end), (east_face, east_turn_end),
        (east_after['x'], east_turn_end), (east_after['x'], 20.68),
        (-11.68, 20.68), (-11.68, 40.68), (9.82, 40.68), (9.82, 43.32),
        (reading_face, 43.32), (reading_face, 23.32), (west_face, 23.32), (west_face, reception_end),
    ]
    oak_wall_plates(trim, perimeter, 4)
    oak_ties(trim, 'z', west_face, east_face, 4, (8.2, 12.55, 16.9))
    oak_ties(trim, 'x', 20.68, 23.32, 4, (-17, -14.57))
    oak_ties(trim, 'z', -14.32, -11.68, 4, (23.63, 27.68, 32.25, 36.5))
    oak_ties(trim, 'x', 40.68, 43.32, 4, (-10, -6, -2, 2, 6))

    passage_box(trim, (-21.13, 1.106, 15.67), (-21.002, 1.142, 16.93), 0.67)
    for z in (15.80, 16.80):
        passage_box(trim, (-21.13, 1.063, z - 0.019), (-21.044, 1.107, z + 0.019), 0.67)

    # Straight lengths of the same runner leave bare boards at both turns and the stone sill.
    runner_strip(runner, 'z', -19.8, 5.18, 19.68)
    runner_strip(runner, 'x', 22, -18.93, -14.12)
    runner_strip(runner, 'z', -13, 24.48, 39.96)
    runner_strip(runner, 'x', 42, -11.42, 8.87)
    for mesh, material in zip((plaster, wood, trim), scholars_materials(temporary)):
        mesh.make_object(material.name, material)
    runner.make_object('Worn Scholars Passage runner', runner_material(temporary))
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / 'scholars_passage.glb'), export_format='GLB',
                              export_image_format='AUTO', export_yup=True)


if __name__ == '__main__':
    with TemporaryDirectory() as directory:
        build(directory)
