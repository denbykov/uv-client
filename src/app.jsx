"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import useWebSocket, { ReadyState } from 'react-use-websocket';
// import randomUUID from 'crypto';

import * as protocol from './protocol/message';

const backendUrl = "ws://localhost:3080/ws"

function Application() {
  const { sendMessage, lastMessage, readyState } = 
    useWebSocket(backendUrl,
      {
        share: false,
        shouldReconnect: () => false,
      },
    );

  useEffect(() => {
    const connectionStatus = {
      [ReadyState.CONNECTING]: 'Connecting',
      [ReadyState.OPEN]: 'Open',
      [ReadyState.CLOSING]: 'Closing',
      [ReadyState.CLOSED]: 'Closed',
      [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    console.log(`Connection state changed, status is: ${connectionStatus}`)
    if (readyState === ReadyState.OPEN) {

    }
  }, [readyState])

  useEffect(() => {
    if (lastMessage == null) {
      return;
    }

    const handleMessage = async(lastMessage) => {
      const message = await protocol.parseMessage(lastMessage);
      console.log(message);
    };

    handleMessage(lastMessage);
  }, [lastMessage]);

  const download = useCallback(
    function(formData) {
      const url = formData.get("url");

      const request = protocol.buildDownloadingRequest(protocol.uuidv4(), url);
      sendMessage(request.serialize(), [])
    }
  );

  return (
  <>
  <div className="canvas">
    <form action={download} className="url-form">
      <label>Enter URL</label>
      <input name="url"></input>
      <button type="submit">Donwload</button>
    </form>
  </div>
  </> 
  );
}

const root = createRoot(document.body)
root.render(<Application />)
