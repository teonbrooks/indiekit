export const mediaTypeCount = {
  /**
   * Count the number of media of a given type
   * @param {object} application - Application configuration
   * @param {object} properties - JF2 properties
   * @returns {Promise<object>} Media count
   */
  async get(application, properties) {
    if (!application.database) {
      console.warn("No database configuration provided");
      console.info(
        "See https://getindiekit.com/configuration/#application-mongodburl-url"
      );

      return;
    }

    const postType = properties["media-type"];
    const startDate = new Date(new Date(properties.published).toDateString());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const response = await application.database.post.aggregate({
      _count: true,
      where: {
        properties: {
          is: {
            postType: {
              equals: postType,
            },
            published: {
              gte: startDate,
              lt: endDate,
            },
          },
        },
      },
    });

    return response.length;
  },
};
