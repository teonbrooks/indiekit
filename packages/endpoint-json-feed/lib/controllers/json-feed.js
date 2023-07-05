import { jsonFeed } from "../json-feed.js";

export const jsonFeedController = async (request, response) => {
  const { application } = request.app.locals;
  const { database } = application;
  const feedUrl = new URL(request.originalUrl, application.url).href;
  const posts = await database.post.findMany({
    where: {
      properties: { isNot: { postStatus: "draft" } },
    },
  });

  return response
    .type("application/feed+json")
    .json(jsonFeed(application, feedUrl, posts));
};
