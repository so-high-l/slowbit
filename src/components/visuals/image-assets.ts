/** One decoded image per URL, shared by previews and sessions. No work in painters. */
export function createImageAssetCache<T extends string>(
  paths: Record<T, string>,
  makeImage: () => HTMLImageElement = () => new Image(),
) {
  const images = new Map<T, HTMLImageElement>();
  const pending = new Map<T, Promise<void>>();
  return {
    get(key: T): HTMLImageElement | null { return images.get(key) ?? null; },
    preload(onChange: () => void): () => void {
      let subscribed = true;
      for (const key of Object.keys(paths) as T[]) {
        if (!pending.has(key)) {
          pending.set(key, new Promise<void>((resolve) => {
            const image = makeImage();
            const finish = (loaded: boolean) => {
              clearTimeout(timeout);
              image.onload = image.onerror = null;
              if (loaded && image.naturalWidth > 0) images.set(key, image);
              resolve();
            };
            const timeout = setTimeout(() => finish(false), 15000);
            image.decoding = "async";
            image.onload = () => finish(true);
            image.onerror = () => finish(false);
            image.src = paths[key];
          }));
        }
        void pending.get(key)!.then(() => { if (subscribed) onChange(); });
      }
      return () => { subscribed = false; };
    },
  };
}
