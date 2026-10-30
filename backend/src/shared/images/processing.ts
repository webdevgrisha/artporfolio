import sharp, { type Sharp } from "sharp";

import { BadRequestError } from "#shared/http/errors";

/** Widths for the srcset: phones, tablets and 1x desktops, up to 2x desktops. */
const targetWidths = [640, 960, 1_280, 1_920];

export const outputFormats = ["avif", "webp"] as const;

// Source photos only: WebP and AVIF are already compressed for the web, and compressing them
// again would visibly lower the quality.
export const sourceFormats = ["jpeg", "png"] as const;

// Rejects decompression bombs: small files that decode into huge images.
const maxInputPixels = 50_000_000;

/** The largest source photo an upload may send, in bytes. */
export const maxSourceFileSize = 15 * 1024 * 1024;

export type OutputFormat = (typeof outputFormats)[number];
export type SourceFormat = (typeof sourceFormats)[number];

export interface EncodedImage {
  data: Buffer;
  format: OutputFormat;
  height: number;
  width: number;
}

export interface ProcessedImage {
  images: EncodedImage[];
  sourceFormat: SourceFormat;
}

interface SourceImage {
  format: SourceFormat;
  /** Width after applying the EXIF orientation. */
  width: number;
}

function isSourceFormat(format: string): format is SourceFormat {
  return (sourceFormats as readonly string[]).includes(format);
}

async function readSource(input: Buffer): Promise<SourceImage> {
  const metadata = await sharp(input)
    .metadata()
    .catch(() => {
      throw new BadRequestError("The file is not an image");
    });

  if (!isSourceFormat(metadata.format)) {
    throw new BadRequestError("Unsupported image format");
  }

  if (metadata.width * metadata.height > maxInputPixels) {
    throw new BadRequestError("The image is too large");
  }

  return { format: metadata.format, width: metadata.autoOrient.width };
}

/** Widths to generate: never wider than the original, so images are not upscaled. */
function widthsFor(originalWidth: number): number[] {
  return [...new Set(targetWidths.map((width) => Math.min(width, originalWidth)))];
}

function encode(image: Sharp, format: OutputFormat): Sharp {
  return format === "avif" ? image.avif({ effort: 4, quality: 50 }) : image.webp({ quality: 80 });
}

/**
 * The pixels are decoded only here: reading the metadata checks the header alone. sharp checks the
 * options when they are set, so a failure here comes from the data of the upload, such as a file
 * cut off in the middle.
 */
async function toEncodedImage(image: Sharp, format: OutputFormat): Promise<EncodedImage> {
  const { data, info } = await encode(image, format)
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new BadRequestError("The image is damaged");
    });

  return { data, format, height: info.height, width: info.width };
}

/**
 * Turns an upload into web images: every target width in every format. The image is rotated
 * according to its EXIF orientation and resized without cropping. sharp converts the output to
 * sRGB and drops all metadata, including the location.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const source = await readSource(input);
  const images: EncodedImage[] = [];

  // One image at a time: decoding a large photo several times in parallel could run out of memory.
  for (const width of widthsFor(source.width)) {
    for (const format of outputFormats) {
      const resized = sharp(input, { limitInputPixels: maxInputPixels })
        .autoOrient()
        .resize({ width });
      images.push(await toEncodedImage(resized, format));
    }
  }

  return { images, sourceFormat: source.format };
}
