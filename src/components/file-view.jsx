"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useWebSocketData } from '../websocket-context';
import * as protocol from '../protocol/index';
import { useGetFileResponseMessage } from '../protocol/hooks';

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

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
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
  const { send } = useWebSocketData();
  const [state, setState] = useState(new State());

  // Methods

  const handleMessage = useCallback(
    function(message) {
      if (message.header.uuid === state.uuid) {
        setState((prev) => {
          var newState = prev.clone();

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
      send(request.serialize());
    },
    [selectedFile]
  );

  // Effects

  useEffect(() => loadFile(), [selectedFile]);

  // Message hooks

  useGetFileResponseMessage(handleMessage);

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
