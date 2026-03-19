// ══════════════════════════════════════════════════════════════
// IMAGE UTILITIES — File/paste/drop → base64 conversion
// ══════════════════════════════════════════════════════════════

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function pasteToBase64(clipboardEvent) {
  const items = clipboardEvent.clipboardData?.items;
  if (!items) return null;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      return fileToBase64(file);
    }
  }
  return null;
}

export function resizeImage(base64, maxWidth = 1280, maxHeight = 720) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width <= maxWidth && height <= maxHeight) {
        resolve(base64);
        return;
      }

      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const resized = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      resolve(resized);
    };
    img.src = 'data:image/jpeg;base64,' + base64;
  });
}

export function createPreviewUrl(base64, mimeType = 'image/jpeg') {
  return `data:${mimeType};base64,${base64}`;
}
