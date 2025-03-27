"use strict"

class Header {
  constructor(type, uuid) {
    this.type = type;
    this.uuid = uuid;
  }
}

class Message {
  constructor(header, payload) {
    this.header = header;
    this.payload = payload;
  }

  serialize() {
    const headerJson = JSON.stringify(this.header);
    const headerBinary = new TextEncoder().encode(headerJson);
    const headerLength = headerBinary.length;

    const headerLengthBinary = new Uint8Array(4);
    lengthBinary[0] = (headerLength >>> 24) & 0xFF;
    lengthBinary[1] = (headerLength >>> 16) & 0xFF;
    lengthBinary[2] = (headerLength >>> 8) & 0xFF;
    lengthBinary[3] = headerLength & 0xFF;

    const packet = new Uint8Array(
      lengthBinary.length + headerBinary.length + payloadBinary.length);

    combinedBinary.set(lengthBinary, 0);
    combinedBinary.set(headerBinary, lengthBinary.length);
    combinedBinary.set(payloadBinary, lengthBinary.length + headerBinary.length);

    return packet;
  }
}