// Next's default imageSizes + deviceSizes (next.config.ts doesn't override
// them) — the /_next/image endpoint 400s on any other width.
const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

function nearestAllowedWidth(width: number) {
  return ALLOWED_WIDTHS.find((w) => w >= width) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

// Builds a URL for Next.js's built-in image optimizer (/_next/image). Use
// this where an image needs to go through Next's WebP/AVIF + resize pipeline
// but can't be a plain <Image> element — e.g. a CSS background-image. The
// source must be a local /public path or a remote host listed in
// next.config.ts's images.remotePatterns.
export function optimizedImageUrl(src: string, width: number, quality = 75) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${nearestAllowedWidth(width)}&q=${quality}`;
}
