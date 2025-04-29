"use strict"

export class DownloadingState {
  constructor() {
    this.percentage = 0;
    this.error = null;
    this.done = false;
    this.uuid = null;
  }

  copy(other) {
    this.percentage = other.percentage;
    this.error = other.error;
    this.done = other.done;
    this.uuid = other.uuid;
  }
}