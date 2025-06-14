"use strict"

import * as React from 'react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { WebSocketContext } from './websocket-context';
import { FilesView } from './components/files-view.jsx';

import { useWebSocketHandler } from './protocol/hooks';

function Application() {
  const { send } = useWebSocketHandler();

  return <WebSocketContext.Provider value={{ send }}>
    <FilesView/>
  </WebSocketContext.Provider>
}

const root = createRoot(document.body)
root.render(<Application />)
