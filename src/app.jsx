"use strict"

import * as React from 'react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { WebSocketContext } from './websocket-context';
import { DownloadingForm } from './components/downloading-form.jsx';
import { FilesView } from './components/files-view.jsx';
import * as protocol from './protocol/message';

const backendUrl = "ws://localhost:3080/ws"

function Application() {
  const { sendMessage, lastMessage, readyState } = 
    useWebSocket(backendUrl,
      {
        share: false,
        shouldReconnect: (closeEvent) => {
          console.warn("WebSocket Closed:", closeEvent.code, closeEvent.reason);
          return false;
        },
        heartbeat: true,
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
  }, [readyState]);

  return <WebSocketContext.Provider value={{ lastMessage, sendMessage }}>
    <FilesView/>
  </WebSocketContext.Provider>
}

const root = createRoot(document.body)
root.render(<Application />)
