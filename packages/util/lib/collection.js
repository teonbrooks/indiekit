/**
 * Get pagination cursor
 * @param {object} collection - Database collection
 * @param {string} afterId - Items created after object with this ID
 * @param {string} beforeId - Items created before object with this ID
 * @param {number} limit - Number of items to return within cursor
 * @returns {Promise<object>} Pagination cursor
 */
export const getCursor = async (collection, afterId, beforeId, limit) => {
  const cursor = {
    items: [],
    hasNext: false,
    hasPrev: false,
  };
  const options = {
    orderBy: { properties: { published: "desc" } },
    take: Number.parseInt(String(limit), 10) || 40,
  };

  if (beforeId) {
    options.cursor = { id: beforeId };
  } else if (afterId) {
    options.cursor = { id: afterId };
  }

  const items = await collection.findMany(options);

  if (items.length > 0) {
    cursor.items = items;
    cursor.lastItem = items.at(-1).id;
    cursor.firstItem = items[0].id;
    cursor.hasNext = Boolean(
      await collection.findUnique({
        where: { id: cursor.lastItem },
      })
    );
    cursor.hasPrev = Boolean(
      await collection.findUnique({
        where: { id: cursor.firstItem },
      })
    );
  }

  return cursor;
};
