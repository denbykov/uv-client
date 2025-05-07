"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useWebSocketData } from '../websocket-context';
import * as protocol from '../protocol/message';
import { DownloadingState } from './states/downloading-state';

export function DownloadingForm({ setSelectedFile }) {
  const { lastMessage, sendMessage } = useWebSocketData();
  const [dlState, setDlState] = useState(null);

  useEffect(() => {
    if (dlState === null || lastMessage === null) {
      return;
    }

    const handleMessage = async(lastMessage) => {
      const message = await protocol.parseMessage(lastMessage);

      if (dlState.uuid !== message.header.uuid) {
        return;
      }

      if (message.header.type === protocol.types.Error) {
        setDlState((prev) => {
          const state = new DownloadingState();
          state.copy(prev);
          state.error = message.payload.reason;
          return state;
        });
      } else if (message.header.type === protocol.types.DownloadingProgress) {
        setDlState((prev) => {
          const state = new DownloadingState();

          if (prev !== null) {
            state.copy(prev);
          }

          setSelectedFile(message.payload.id);
          state.percentage = message.payload.percentage;
          return state;
        });
      } else if (message.header.type === protocol.types.DownloadingDone) {
        setDlState((prev) => {
          const state = new DownloadingState();

          if (prev !== null) {
            state.copy(prev);
          }
          
          state.done = true;
          return state;
        });
      } else {
        console.log(`unable to handle message: ${message}`);
      }
    };

    handleMessage(lastMessage);
  }, [lastMessage]);

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
      sendMessage(request.serialize(), []);
    }
  );

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
