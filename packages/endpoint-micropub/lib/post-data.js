import { IndiekitError } from "@indiekit/error";
import { getCanonicalUrl, getDate } from "@indiekit/util";
import { getPostType } from "./post-type-discovery.js";
import { getSyndicateToProperty, normaliseProperties } from "./jf2.js";
import * as update from "./update.js";
import { getPostTypeConfig, renderPath } from "./utils.js";

export const postData = {
  /**
   * Create post data
   * @param {object} application - Application configuration
   * @param {object} publication - Publication configuration
   * @param {object} properties - JF2 properties
   * @param {boolean} [draftMode] - Draft mode
   * @returns {Promise<object>} Post data
   */
  async create(application, publication, properties, draftMode = false) {
    const { database, timeZone } = application;
    const { me, postTypes, syndicationTargets } = publication;

    // Add syndication targets
    const syndicateTo = getSyndicateToProperty(properties, syndicationTargets);
    if (syndicateTo) {
      properties.mp_syndicate_to = syndicateTo;
    }

    // Normalise properties
    properties = normaliseProperties(publication, properties);

    // Add published date (or use that provided by client)
    properties.published = getDate(timeZone, properties.published);

    // Post type
    const type = getPostType(properties);
    properties.postType = type;

    // Get post type configuration
    const typeConfig = getPostTypeConfig(type, postTypes);
    if (!typeConfig) {
      throw IndiekitError.notImplemented(type);
    }

    // Post paths
    const path = await renderPath(
      typeConfig.post.path,
      properties,
      application
    );
    const url = await renderPath(typeConfig.post.url, properties, application);
    properties.url = getCanonicalUrl(url, me);

    // Post status
    // Draft mode: Only create post with a `draft` post-status
    properties.postStatus = draftMode
      ? "draft"
      : properties.postStatus || "published";

    const postData = { path, properties };

    if (database) {
      await database.post.create({
        data: {
          path,
          properties: {
            set: properties,
          },
        },
      });
    }

    return postData;
  },

  /**
   * Read post data
   * @param {object} application - Application configuration
   * @param {string} url - URL of existing post
   * @returns {Promise<object>} Post data
   */
  async read(application, url) {
    const { database } = application;

    const postData = await database.post.findUnique({
      where: { properties: { is: { url } } },
    });

    if (!postData) {
      throw IndiekitError.notFound(url);
    }

    return postData;
  },

  /**
   * Update post data
   *
   * Add, delete or replace properties and/or replace property values
   * @param {object} application - Application configuration
   * @param {object} publication - Publication configuration
   * @param {string} url - URL of existing post
   * @param {object} operation - Requested operation(s)
   * @returns {Promise<object>} Post data
   */
  async update(application, publication, url, operation) {
    const { database, timeZone } = application;
    const { me, postTypes } = publication;

    // Read properties
    let { properties } = await this.read(application, url);

    // Add properties
    if (operation.add) {
      properties = update.addProperties(properties, operation.add);
    }

    // Replace property entries
    if (operation.replace) {
      properties = await update.replaceEntries(properties, operation.replace);
    }

    // Remove properties and/or property entries
    if (operation.delete) {
      properties = Array.isArray(operation.delete)
        ? update.deleteProperties(properties, operation.delete)
        : update.deleteEntries(properties, operation.delete);
    }

    // Normalise properties
    properties = normaliseProperties(publication, properties);

    // Add updated date
    properties.updated = getDate(timeZone);

    // Post type
    const type = getPostType(properties);
    const typeConfig = getPostTypeConfig(type, postTypes);
    properties["post-type"] = type;

    // Post paths
    const path = await renderPath(
      typeConfig.post.path,
      properties,
      application
    );
    const updatedUrl = await renderPath(
      typeConfig.post.url,
      properties,
      application
    );
    properties.url = getCanonicalUrl(updatedUrl, me);

    const postData = { path, properties };

    await database.post.update({
      data: postData,
      where: { properties: { is: { url } } },
    });

    return postData;
  },

  /**
   * Delete post data
   *
   * Delete (most) properties, keeping a record of deleted for later retrieval
   * @param {object} application - Application configuration
   * @param {object} publication - Publication configuration
   * @param {string} url - URL of existing post
   * @returns {Promise<object>} Post data
   */
  async delete(application, publication, url) {
    const { database, timeZone } = application;
    const { postTypes } = publication;

    // Read properties
    const { properties } = await this.read(application, url);

    // Make a copy of existing properties
    const _deletedProperties = structuredClone(properties);

    // Delete all properties, except those required for path creation
    for (const key in _deletedProperties) {
      if (!["mp-slug", "post-type", "published", "type", "url"].includes(key)) {
        delete properties[key];
      }
    }

    // Add deleted date
    properties.deleted = getDate(timeZone);

    // Post type
    const typeConfig = getPostTypeConfig(properties["post-type"], postTypes);

    // Post paths
    const path = await renderPath(
      typeConfig.post.path,
      properties,
      application
    );

    const postData = { path, properties, _deletedProperties };

    await database.post.update({
      data: postData,
      where: { properties: { is: { url } } },
    });

    return postData;
  },

  /**
   * Undelete post data
   *
   * Restore previously deleted properties
   * @param {object} application - Application configuration
   * @param {object} publication - Publication configuration
   * @param {string} url - URL of existing post
   * @param {boolean} [draftMode] - Draft mode
   * @returns {Promise<object>} Post data
   */
  async undelete(application, publication, url, draftMode) {
    const { database } = application;
    const { postTypes } = publication;

    // Read deleted properties
    const { _deletedProperties } = await this.read(application, url);

    // Restore previously deleted properties
    const properties = _deletedProperties;

    // Post type
    const typeConfig = getPostTypeConfig(properties["post-type"], postTypes);

    // Post paths
    const path = await renderPath(
      typeConfig.post.path,
      properties,
      application
    );

    // Post status
    // Draft mode: Only restore post with a `draft` post-status
    properties["post-status"] = draftMode
      ? "draft"
      : properties["post-status"] || "published";

    const postData = { path, properties };

    await database.post.replaceOne({
      data: postData,
      where: { properties: { is: { url } } },
    });

    return postData;
  },
};
