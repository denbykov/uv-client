"use strict"

import * as React from 'react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { WebSocketContext } from './websocket-context';
import { FilesView } from './components/files-view.jsx';

import { useWebSocketHandler } from './protocol/hooks';

const backendUrl = "ws://localhost:3080/ws";

function Application() {
  const { send } = useWebSocketHandler();

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
  }, [readyState]);

  return <WebSocketContext.Provider value={{ lastMessage, sendMessage, send }}>
    <FilesView/>
  </WebSocketContext.Provider>
}

const root = createRoot(document.body)
root.render(<Application />)
