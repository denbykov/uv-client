"use strict"

import types from './types'

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, 
          v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

class Header {
  constructor(type, uuid) {
    this.type = type;
    this.uuid = uuid;
  }
}

export class Message {
  constructor(header, payload) {
    this.header = header;
    this.payload = payload;
  }

  serialize() {
    const headerJson = JSON.stringify(this.header);
    const headerBinary = new TextEncoder().encode(headerJson);
    const headerLength = headerBinary.length;

    const hlBinary = new Uint8Array(4);
    hlBinary[0] = (headerLength >>> 24) & 0xFF;
    hlBinary[1] = (headerLength >>> 16) & 0xFF;
    hlBinary[2] = (headerLength >>> 8) & 0xFF;
    hlBinary[3] = headerLength & 0xFF;

    var payloadBinary = null;
    if (this.payload instanceof Uint8Array) {
      payloadBinary = this.payload;
    } else {
      const payloadJson = JSON.stringify(this.payload);
      payloadBinary = new TextEncoder().encode(payloadJson);
    }

    const packet = new Uint8Array(
      hlBinary.length + headerBinary.length + payloadBinary.length);

    packet.set(hlBinary, 0);
    packet.set(headerBinary, hlBinary.length);
    packet.set(payloadBinary, hlBinary.length + headerBinary.length);

    return packet;
  }

  static parse(data) {
    const headerLength = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];

    const headerBinary = data.slice(4, 4 + headerLength);
    const headerJson = new TextDecoder().decode(headerBinary);
    const headerObj = JSON.parse(headerJson);

    const payload = data.slice(4 + headerLength);

    const header = new Header(headerObj.type, headerObj.uuid);
    return new Message(header, payload);
  }
}

export function buildDownloadingRequest(uuid, url) {
  const payload = {
    url: url
  }
  
  return new Message(
    new Header(
      types.DownloadingRequest,
      uuid,
    ),
    payload,
  )
}

export async function parseMessage(lastMessage) {
  const dataBuffer = await lastMessage.data.arrayBuffer();
  const data = new Uint8Array(dataBuffer);
  const preParsedMessage = Message.parse(data);

  if (preParsedMessage.header.type == types.Error) {
    const json = new TextDecoder().decode(preParsedMessage.payload);
    const payload = JSON.parse(json);
    return preParsedMessage.payload = payload;
  }

  throw new Error("Failed to parse backend message");
}
