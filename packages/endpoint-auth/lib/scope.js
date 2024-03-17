export const scopes = ["create", "update", "draft", "media", "delete"];

/**
 * Get `items` object for checkboxes component
 * @param {string} scope - Selected scope(s)
 * @param {import("express").Response} response - Response
 * @returns {object} Items for checkboxes component
 */
export function getScopeItems(scope, response) {
  console.log("scope", scope);
  const scopesArray = scope.split(" ");

  return scopesArray.map((value) => ({
    label: response.locals.__(`scope.${value}.label`),
    value,
    checked: scope?.includes(value),
  }));
}
