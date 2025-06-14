"use strict"

export class DownloadingState {
  constructor() {
    this.percentage = 0;
    this.error = null;
    this.done = false;
    this.uuid = null;
  }

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }
}
