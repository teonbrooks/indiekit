import { IndiekitError } from "@indiekit/error";
import { getCursor } from "@indiekit/util";

/**
 * Query uploaded files
 * @type {import("express").RequestHandler}
 */
export const queryController = async (request, response, next) => {
  const { application } = request.app.locals;
  const { database } = application;

  try {
    const limit = Number(request.query.limit) || 0;
    const { after, before, q, url } = request.query;

    if (!q) {
      throw IndiekitError.badRequest(
        response.locals.__("BadRequestError.missingParameter", "q")
      );
    }

    switch (q) {
      case "source": {
        if (!database) {
          throw IndiekitError.notImplemented(
            response.locals.__("NotImplementedError.database")
          );
        }

        if (url) {
          // Return properties for a given URL
          const item = await database.media.findFirst({
            select: {
              properties: {
                select: {
                  contentType: true,
                  mediaType: true,
                  published: true,
                  url: true,
                },
              },
            },
            where: { properties: { is: { url } } },
          });

          if (!item) {
            throw IndiekitError.notFound(
              response.locals.__("NotFoundError.resource", "file")
            );
          }

          response.json(item.properties);
        } else {
          // Return properties for all previously uploaded files
          const cursor = await getCursor(database.media, after, before, limit);

          response.json({
            items: cursor.items.map((post) => ({
              "content-type": post.properties["content-type"],
              "media-type": post.properties["media-type"],
              published: post.properties.published,
              url: post.properties.url,
            })),
            paging: {
              ...(cursor.hasNext && { after: cursor.lastItem }),
              ...(cursor.hasPrev && { before: cursor.firstItem }),
            },
          });
        }

        break;
      }

      default: {
        throw IndiekitError.notImplemented(
          response.locals.__("NotImplementedError.query", {
            key: "q",
            value: q,
          })
        );
      }
    }
  } catch (error) {
    next(error);
  }
};
