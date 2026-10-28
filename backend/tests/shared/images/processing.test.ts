import { crc32, deflateSync } from "node:zlib";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { BadRequestError } from "#shared/http/errors";
import { processImage } from "#shared/images/processing";

function solidImage(width: number, height: number) {
  return sharp({ create: { background: "#a33", channels: 3, height, width } });
}

function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(body));

  return Buffer.concat([length, body, checksum]);
}

/** A tiny PNG that claims a huge size: sharp reads the size without decoding the pixels. */
function pngClaimingSize(width: number, height: number): Buffer {
  const header = Buffer.alloc(13);

  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 0, 0, 0, 0], 8);

  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.alloc(1))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("image processing", () => {
  it("encodes every target width in AVIF and WebP", async () => {
    const { images, sourceFormat } = await processImage(
      await solidImage(2_400, 1_200).jpeg().toBuffer(),
    );

    expect(sourceFormat).toBe("jpeg");

    expect(images.map(({ format, height, width }) => ({ format, height, width }))).toEqual([
      { format: "avif", height: 320, width: 640 },
      { format: "webp", height: 320, width: 640 },
      { format: "avif", height: 480, width: 960 },
      { format: "webp", height: 480, width: 960 },
      { format: "avif", height: 640, width: 1_280 },
      { format: "webp", height: 640, width: 1_280 },
      { format: "avif", height: 960, width: 1_920 },
      { format: "webp", height: 960, width: 1_920 },
    ]);
    await expect(sharp(images[0]?.data).metadata()).resolves.toMatchObject({
      compression: "av1",
      format: "heif",
    });
    await expect(sharp(images[1]?.data).metadata()).resolves.toMatchObject({ format: "webp" });
  });

  it("does not upscale a small image", async () => {
    const { images, sourceFormat } = await processImage(
      await solidImage(800, 600).png().toBuffer(),
    );

    expect(sourceFormat).toBe("png");
    expect(images.map(({ width }) => width)).toEqual([640, 640, 800, 800]);
  });

  it("applies the EXIF orientation and removes the metadata", async () => {
    const photo = await solidImage(300, 200).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const {
      images: [image],
    } = await processImage(photo);
    const metadata = await sharp(image?.data).metadata();

    expect(metadata).toMatchObject({ height: 300, width: 200 });
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
  });

  it("rejects a file that is not an image", async () => {
    await expect(processImage(Buffer.from("not an image"))).rejects.toBeInstanceOf(BadRequestError);
  });

  it.each(["webp", "avif"] as const)("rejects an already compressed %s source", async (format) => {
    const image = await solidImage(100, 100).toFormat(format).toBuffer();

    await expect(processImage(image)).rejects.toThrow("Unsupported image format");
  });

  it("rejects an image with too many pixels", async () => {
    await expect(processImage(pngClaimingSize(10_000, 10_000))).rejects.toThrow(
      "The image is too large",
    );
  });
});
