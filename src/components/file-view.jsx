"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useWebSocketData } from '../websocket-context';
import * as protocol from '../protocol/message';

class State {
  constructor() {
    this.uuid = null;

    this.path = null;
    this.sourceUrl = null;
    this.source = null;
    this.status = null;
    this.addedAt = null;
    this.updatedAt = null;
  }

  copy(other) {
    this.uuid = other.uuid;

    this.path = other.path;
    this.sourceUrl = other.sourceUrl;
    this.source = other.source;
    this.status = other.status;
    this.addedAt = other.addedAt;
    this.updatedAt = other.updatedAt;
  }

  fill(message) {
    this.path = message.path;
    this.sourceUrl = message.sourceUrl;
    this.source = message.source;
    this.status = message.status;
    this.addedAt = message.addedAt;
    this.updatedAt = message.updatedAt;
  }
}

export function FileView({ selectedFile }) {
  const { lastMessage, sendMessage } = useWebSocketData();
  const [state, setState] = useState(new State());

  // Methods

  const handleMessage = useCallback(
    async function(lastMessage) {
      if (lastMessage === null) {
        return;
      }
    
      const message = await protocol.parseMessage(lastMessage);

      if (message.header.type === protocol.types.GetFileResponse && message.header.uuid === state.uuid) {
        setState((prev) => {
          var newState = new State();
          newState.copy(prev);
          newState.fill(message.payload);
          return newState;
        });
      }
    },
    [state]
  );

  const loadFile = useCallback(
    function () {
      const uuid = protocol.uuidv4();

      setState((prev) => {
        const newState = new State();
        newState.uuid = uuid;
        return newState;
      });
      
      const request = protocol.buildGetFileRequest(uuid, selectedFile);
    
      sendMessage(request.serialize(), []);
    },
    [selectedFile]
  );

  // Effects

  useEffect(() => {handleMessage(lastMessage)}, [lastMessage]);
  useEffect(() => loadFile(), [selectedFile]);

  // Rendering

  return (
    <>
      <div>
        <div>{ selectedFile }</div>
        <div>{ state.path }</div>
        <div>{ state.sourceUrl }</div>
        <div>{ state.source }</div>
        <div>{ state.status }</div>
        <div>{ state.addedAt }</div>
        <div>{ state.updatedAt }</div>
      </div>
    </>
  );
}
