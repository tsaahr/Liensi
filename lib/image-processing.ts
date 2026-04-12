import sharp from "sharp";

export type ImageUploadPreset = "product" | "bannerDesktop" | "bannerMobile";

export type OptimizedImageUpload = {
  buffer: Buffer;
  contentType: "image/webp";
  extension: "webp";
  byteLength: number;
  originalName: string;
};

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 52_000_000;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const presets: Record<
  ImageUploadPreset,
  {
    width: number;
    height: number;
    quality: number;
  }
> = {
  product: {
    width: 1600,
    height: 2000,
    quality: 84
  },
  bannerDesktop: {
    width: 2400,
    height: 1400,
    quality: 84
  },
  bannerMobile: {
    width: 1200,
    height: 1700,
    quality: 84
  }
};

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isSupportedFile(file: File) {
  if (file.type) {
    return SUPPORTED_TYPES.has(file.type);
  }

  return SUPPORTED_EXTENSIONS.has(getExtension(file.name));
}

export function imageUploadHelpText() {
  return "JPG, PNG ou WebP ate 10 MB. O sistema converte para WebP automaticamente.";
}

export async function optimizeImageUpload(file: File, preset: ImageUploadPreset) {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(`A imagem "${file.name}" passa de 10 MB.`);
  }

  if (!isSupportedFile(file)) {
    throw new Error(`A imagem "${file.name}" precisa ser JPG, PNG ou WebP.`);
  }

  const input = Buffer.from(await file.arrayBuffer());
  const options = presets[preset];

  try {
    const { data } = await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS
    })
      .rotate()
      .resize({
        width: options.width,
        height: options.height,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: options.quality,
        effort: 5
      })
      .toBuffer({ resolveWithObject: true });

    if (data.byteLength > MAX_UPLOAD_SIZE) {
      throw new Error(`A imagem "${file.name}" continuou maior que 10 MB apos otimizacao.`);
    }

    return {
      buffer: data,
      contentType: "image/webp" as const,
      extension: "webp" as const,
      byteLength: data.byteLength,
      originalName: file.name
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(`Nao foi possivel otimizar a imagem "${file.name}".`);
  }
}
