/**
 * Photos picked from the phone's album, made small enough to keep.
 *
 * A modern phone photo is 4000px wide and several megabytes. Nothing in this
 * app ever shows one larger than a screen, so each one is redrawn at most
 * MAX_EDGE across and handed back as a data URL — which means it needs no
 * upload, no object URL to revoke, and no blob that dies when the tab does.
 *
 * The quality and the edge are chosen together: at 1400px and q=0.72 a
 * full-bleed photo still looks like a photograph on a 3x screen, and a
 * typical one comes back around 200KB rather than 4MB.
 */

const MAX_EDGE = 1400;
const QUALITY = 0.72;

/** How many a single memory will take. Enough for an evening, not an album. */
export const MAX_PHOTOS = 6;

function fits(w: number, h: number): [number, number] {
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  return [Math.round(w * scale), Math.round(h * scale)];
}

/** The whole file, unchanged, for when the canvas route is not available. */
function asDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read that photo'));
    reader.readAsDataURL(file);
  });
}

export async function readPickedPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not a photo');

  try {
    // createImageBitmap applies the EXIF orientation for us, which drawing a
    // plain <img> to a canvas does not — otherwise every photo taken sideways
    // would come back sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const [w, h] = fits(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', QUALITY);
  } catch {
    /* An unsupported format, a tainted canvas, an old browser — keep the
       original rather than losing the photo. */
    return asDataUrl(file);
  }
}
