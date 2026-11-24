"""Resize embedded PNG/JPEG textures in a static GLB using macOS sips."""

import argparse
import json
import struct
import subprocess
import tempfile
from pathlib import Path


GLB_MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A
BINARY_CHUNK = 0x004E4942
FORMATS = {'image/jpeg': 'jpg', 'image/png': 'png'}


def pad(data, value=b'\0'):
    return data + value * (-len(data) % 4)


def optimize(source, destination, max_edge):
    if source.resolve() == destination.resolve():
        raise ValueError('Choose a separate output path for the runtime copy.')
    with source.open('rb') as original, tempfile.TemporaryDirectory() as temporary:
        magic, version, length, json_size, chunk_type = struct.unpack('<5I', original.read(20))
        if (magic, version, chunk_type) != (GLB_MAGIC, 2, JSON_CHUNK) or length != source.stat().st_size:
            raise ValueError('Expected a GLB 2.0 file with a JSON chunk.')
        model = json.loads(original.read(json_size))
        if 'EXT_meshopt_compression' in model.get('extensionsUsed', []):
            raise ValueError('Export an uncompressed GLB before resizing textures.')
        binary_size, chunk_type = struct.unpack('<2I', original.read(8))
        binary_start = original.tell()
        if chunk_type != BINARY_CHUNK or binary_start + binary_size != length:
            raise ValueError('Expected a single embedded BIN chunk.')
        buffers = model['buffers']
        if len(buffers) != 1 or 'uri' in buffers[0]:
            raise ValueError('Expected one embedded buffer.')
        if any('bufferView' not in image or image.get('mimeType') not in FORMATS for image in model.get('images', [])):
            raise ValueError('Only embedded PNG and JPEG images are supported.')

        image_formats = {image['bufferView']: FORMATS[image['mimeType']] for image in model.get('images', [])}
        output = bytearray()
        for index, view in enumerate(model['bufferViews']):
            offset, size = view.get('byteOffset', 0), view['byteLength']
            if view['buffer'] != 0 or offset < 0 or offset + size > binary_size:
                raise ValueError('Invalid view into the embedded buffer.')
            original.seek(binary_start + offset)
            chunk = original.read(size)
            if index in image_formats:
                extension = image_formats[index]
                image = Path(temporary) / f'source.{extension}'
                resized = Path(temporary) / f'resized.{extension}'
                image.write_bytes(chunk)
                subprocess.run(['sips', '-Z', str(max_edge), str(image), '--out', str(resized)],
                               check=True, stdout=subprocess.DEVNULL)
                chunk = resized.read_bytes()
            view['byteOffset'] = len(output)
            view['byteLength'] = len(chunk)
            output.extend(pad(chunk))

    buffers[0]['byteLength'] = len(output)
    manifest = pad(json.dumps(model, separators=(',', ':')).encode(), b' ')
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('wb') as result:
        result.write(struct.pack('<5I', GLB_MAGIC, 2, 28 + len(manifest) + len(output), len(manifest), JSON_CHUNK))
        result.write(manifest)
        result.write(struct.pack('<2I', len(output), BINARY_CHUNK))
        result.write(output)
    print(f'{source.stat().st_size:,} → {destination.stat().st_size:,} bytes')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    parser.add_argument('--max-edge', type=int, default=1024)
    args = parser.parse_args()
    if args.max_edge < 1:
        parser.error('--max-edge must be positive')
    optimize(args.source, args.destination, args.max_edge)


if __name__ == '__main__':
    main()
