import type { ProcessPhoto } from "@/entities/about";
import type { Image } from "@/shared/api/image";
import type { Photo } from "@/shared/api/photo";

/** An image as the API returns it. */
export function apiImage(fileName = "photo.jpg"): Image {
  return {
    fileName,
    fileSize: 466_000,
    height: 640,
    sources: {
      avif: [{ url: "https://storage.test/image/960.avif?token=token", width: 960 }],
      webp: [{ url: "https://storage.test/image/960.webp?token=token", width: 960 }],
    },
    version: "version",
    width: 960,
  };
}

/** A photo with its description as the API returns it. */
export function apiPhoto(alt = "Портрет", fileName = "photo.jpg"): Photo {
  return { ...apiImage(fileName), alt };
}

/** A process photo as the API returns it; its file is named after the id. */
export function apiProcessPhoto(id: string, alt = `Этап ${id}`): ProcessPhoto {
  return { ...apiPhoto(alt, `${id}.jpg`), id };
}

/** A picked image file. */
export function imageFile(name = "new.png", type = "image/png"): File {
  return new File(["image"], name, { type });
}
