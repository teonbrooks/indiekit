/**
 * Return queryable publication config
 *
 * @param {object} publication Publication config
 * @returns {object} Queryable config
 */
export const getConfig = publication => {
  const {
    categories,
    mediaEndpoint,
    postTypes,
    syndicationTargets
  } = publication;

  return {
    categories,
    'media-endpoint': mediaEndpoint,
    'post-types': postTypes.map(postType => ({
      type: postType.type,
      name: postType.name
    })),
    'syndicate-to': syndicationTargets.map(target => target.info)
  };
};

/**
 * Query a list
 *
 * @param {Array} list List of items
 * @param {object} options Options (filter, limit, offset)
 * @returns {Array} Updated list
 */
export const queryList = (list, options) => {
  const {filter, limit} = options;

  if (Array.isArray(list)) {
    if (filter) {
      list = list.filter(item => {
        item = JSON.stringify(item);
        item = item.toLowerCase();
        return item.includes(filter);
      });
    }

    if (limit) {
      const offset = options.offset || 0;
      list = list.slice(offset, offset + limit);
      list.length = Math.min(list.length, limit);
    }
  }

  return list;
};
