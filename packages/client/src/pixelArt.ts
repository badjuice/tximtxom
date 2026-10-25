// Smoothing pixel art without blurring it, for the table and the DOM cards alike.

/** How many times the art is enlarged before smoothing. */
export const UPSCALE = 4;

/**
 * The image enlarged UPSCALE times with hard pixel edges. Drawn smaller with
 * smoothing on, only the edges between pixels blur, so smoothed pixel art
 * stays sharp; drawn with smoothing off, it looks the same as the original.
 */
export function upscaled(img: HTMLImageElement | HTMLCanvasElement | ImageBitmap): HTMLCanvasElement {
  const { width: w, height: h } = img;
  const canvas = document.createElement('canvas');
  canvas.width = w * UPSCALE;
  canvas.height = h * UPSCALE;
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  c.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}
