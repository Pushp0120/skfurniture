import { query } from "./_generated/server";

export interface GalleryItem {
  _id: string;
  title: string;
  url: string | null;
}

/** Public: the images the admin has uploaded, newest first. */
export const list = query({
  args: {},
  handler: async (ctx): Promise<GalleryItem[]> => {
    const images = await ctx.db
      .query("galleryImages")
      .withIndex("by_order")
      .order("desc")
      .collect();

    return await Promise.all(
      images.map(async (image) => ({
        _id: image._id as unknown as string,
        title: image.title,
        url: await ctx.storage.getUrl(image.imageId),
      })),
    );
  },
});
