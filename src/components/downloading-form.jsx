"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useWebSocketData } from '../websocket-context';
import { DownloadingState } from './states/downloading-state';
import * as protocol from '../protocol/index';
import { useErrorMessage, useDownloadingProgressMessage } from '../protocol/hooks';

export function DownloadingForm({ setSelectedFile }) {
  const { send } = useWebSocketData();
  const [dlState, setDlState] = useState(null);

  // Methods

  const handleErrorMessage = useCallback(
    function(message) {
      if (dlState === null || dlState.uuid !== message.header.uuid) {
        return;
      }

      const state = dlState.clone();
      state.error = message.payload.reason;
      setDlState(state);
    },
    [dlState]
  );

  const handleProgressMessage = useCallback(
    function(message) {
      if (dlState === null || dlState.uuid !== message.header.uuid) {
        return;
      }

      const state = dlState.clone();
      state.percentage = message.payload.percentage;
      setDlState(state);
      
      setSelectedFile(message.payload.id);
    },
    [dlState]
  );

  const download = useCallback(
    function(formData) {
      if (dlState !== null) {
        console.log.Error("Downloading state already esists!");
        return;
      }

      const state = new DownloadingState();
      state.uuid = protocol.uuidv4();
      setDlState(state);

      const url = formData.get("url");
      const request = protocol.buildDownloadingRequest(state.uuid, url);
      send(request.serialize(), []);
    },
    [dlState]
  );

  // Message hooks

  useErrorMessage(handleErrorMessage);
  useDownloadingProgressMessage(handleProgressMessage);

  // Rendering

  if (dlState === null) {
    return (
      <>
      <div className="downloading-form-container">
        <form action={download} className="downloading-form">
          <label>Enter URL</label>
          <input name="url"></input>
          <button className="button" type="submit">Download</button>
        </form>
      </div>
      </>
    );
  }  

  if (dlState.error !== null) {
    return (
      <>
      <div className="downloading-form-container">
        <div className="dl-status-container error">
          <div className="label">Error</div>
          <div className="message">{dlState.error}</div>
          <button className="button" onClick={() => setDlState(null)}>Continue</button>
        </div>
      </div>
      </>
    );
  }
}
