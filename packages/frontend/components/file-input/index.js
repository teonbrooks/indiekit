/* eslint-disable jsdoc/no-undefined-types */
import { Controller } from "@hotwired/stimulus";
import { wrapElement } from "../../lib/utils/wrap-element.js";

// TODO: Show error message in failed upload
// TODO: Review progressive enhancement
// TODO: Indicate upload in progress
// TODO: Add accept option for media types to accept
export const FileInputController = class extends Controller {
  static targets = ["button", "errorMessage", "file", "progress"];

  static values = {
    endpoint: String,
  };

  initialize() {
    // Create group to hold input and button
    const $inputButtonGroup = document.createElement("div");
    $inputButtonGroup.classList.add("input-button-group");

    // Create and display choose file button
    const $button = this.buttonTarget.content.cloneNode(true);
    const $input = this.element.querySelector(".input");

    // Wrap input within `input-button-group` container
    wrapElement($input, $inputButtonGroup);

    // Add button to `input-button-group` container
    $inputButtonGroup.append($button);
  }

  /**
   * Fetch file
   * @param {Event} event - File input event
   */
  async fetch(event) {
    const formData = new FormData();
    formData.append("file", event.target.files[0]);

    try {
      this.progressTarget.hidden = false;
      this.fileTarget.readOnly = true;

      const endpointResponse = await fetch(this.endpointValue, {
        method: "POST",
        body: formData,
      });
      const url = await endpointResponse.headers.get("location");

      this.fileTarget.value = url;
      this.fileTarget.readOnly = false;
      this.progressTarget.hidden = true;
    } catch (error) {
      // TODO: Error not caught
      this.showErrorMessage(this.element, error);
      this.fileTarget.readOnly = false;
      this.progressTarget.hidden = true;
    }
  }

  showErrorMessage($field, message) {
    const $input = $field.querySelector(".input");
    const $inputButtonGroup = $field.querySelector(".input-button-group");

    // Create error message
    let $errorMessage = this.errorMessageTarget.content.cloneNode(true);
    $inputButtonGroup.before($errorMessage);
    $errorMessage = $field.querySelector(".error-message");
    const $errorMessageText = $field.querySelector(".error-message__text");

    // Add field error class
    $field.classList.add("field--error");

    // Add error message text
    $errorMessageText.textContent = message;

    // Update `aria-describedby` on input element to reference error message
    const inputAttributes = $input.getAttribute("aria-describedby") || "";
    $input.setAttribute(
      "aria-describedby",
      [inputAttributes, $errorMessage.id].join(" "),
    );
  }
};
