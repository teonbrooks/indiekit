import { Controller } from "@hotwired/stimulus";
import Trix from "trix";
import { debounce } from "../../lib/utils/debounce.js";

function createStorageKey(file) {
  const date = new Date();
  const day = date.toISOString().slice(0, 10);
  const name = date.getTime() + "-" + file.name;

  return ["tmp", day, name].join("/");
}

function createFormData(key, file) {
  const data = new FormData();
  data.append("key", key);
  data.append("Content-Type", file.type);
  data.append("file", file);

  return data;
}

function uploadFile(file, mediaEndpoint, progressCallback, successCallback) {
  const key = createStorageKey(file);
  const formData = createFormData(key, file);
  const xhr = new XMLHttpRequest();

  xhr.open("POST", mediaEndpoint, true);

  xhr.upload.addEventListener("progress", (event) => {
    const progress = (event.loaded / event.total) * 100;
    progressCallback(progress);
  });

  xhr.addEventListener("load", () => {
    const alt = "";
    const url = xhr.getResponseHeader("location");
    if (xhr.status == 201) {
      successCallback({ alt, url });
    }
  });

  xhr.send(formData);
}

function uploadFileAttachment(attachment, mediaEndpoint) {
  if (!attachment.file) {
    return;
  }

  uploadFile(attachment.file, mediaEndpoint, setProgress, setAttributes);

  function setProgress(progress) {
    attachment.setUploadProgress(progress);
  }

  function setAttributes(attributes) {
    attachment.setAttributes(attributes);
  }
}

export const TextareaController = class extends Controller {
  initialize() {
    this.adjustHeight = this.adjustHeight.bind(this);
  }

  connect() {
    const delay = 100;

    this.element.style.overflow = "hidden";
    this.onResize =
      delay > 0 ? debounce(this.adjustHeight, delay) : this.adjustHeight;
    this.adjustHeight();

    this.element.addEventListener("input", this.adjustHeight);
    window.addEventListener("resize", this.onResize);

    window.addEventListener("trix-before-initialize", () => {
      Trix.config.blockAttributes.heading1 = {
        tagName: "h2",
        terminal: true,
        breakOnReturn: true,
        group: false,
      };
    });

    window.addEventListener("trix-attachment-add", (event) => {
      const { mediaEndpoint } = event.target.dataset;
      uploadFileAttachment(event.attachment, mediaEndpoint);
    });
  }

  disconnect() {
    window.removeEventListener("resize", this.onResize);
  }

  adjustHeight() {
    this.element.style.height = "auto";
    this.element.style.height = `${this.element.scrollHeight + 4}px`;
  }
};
