import { IndiekitError } from "@indiekit/error";
import { getCursor } from "@indiekit/util";
import { getConfig, queryConfig } from "../config.js";
import { getMf2Properties, jf2ToMf2 } from "../mf2.js";

/**
 * Query previously published posts
 * @type {import("express").RequestHandler}
 */
export const queryController = async (request, response, next) => {
  const { application, publication } = request.app.locals;
  const { database } = application;

  try {
    const config = getConfig(application, publication);
    const limit = Number(request.query.limit) || 0;
    const offset = Number(request.query.offset) || 0;
    let { after, before, filter, properties, q, url } = request.query;

    if (!q) {
      throw IndiekitError.badRequest(
        response.locals.__("BadRequestError.missingParameter", "q")
      );
    }

    // `category` param is used to query `categories` configuration property
    q = q === "category" ? "categories" : String(q);

    switch (q) {
      case "config": {
        response.json(config);

        break;
      }

      case "source": {
        if (!database) {
          throw IndiekitError.notImplemented(
            response.locals.__("NotImplementedError.database")
          );
        }

        if (url) {
          // Return mf2 for a given URL (optionally filtered by properties)
          const item = await database.post.findUnique({
            where: { properties: { is: { url } } },
          });

          if (!item) {
            throw IndiekitError.notFound(
              response.locals.__("NotFoundError.resource", "post")
            );
          }

          const mf2 = jf2ToMf2(item.properties);
          response.json(getMf2Properties(mf2, properties));
        } else {
          // Return mf2 for previously published posts
          const cursor = await getCursor(database.post, after, before, limit);

          response.json({
            items: cursor.items.map((post) => jf2ToMf2(post.properties)),
            paging: {
              ...(cursor.hasNext && { after: cursor.lastItem }),
              ...(cursor.hasPrev && { before: cursor.firstItem }),
            },
          });
        }

        break;
      }

      default: {
        // Query configuration value (can be filtered, limited and offset)
        if (config[q]) {
          response.json({
            [q]: queryConfig(config[q], { filter, limit, offset }),
          });
        } else {
          throw IndiekitError.notImplemented(
            response.locals.__("NotImplementedError.query", {
              key: "q",
              value: q,
            })
          );
        }
      }
    }
  } catch (error) {
    next(error);
  }
};
