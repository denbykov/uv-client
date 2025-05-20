"use strict"

import { useEffect, useRef } from 'react';

import types from './types';
import { parseMessage } from './message';

const wsDispatcher = new EventTarget();
const backendUrl = "ws://localhost:3080/ws";

export function useWebSocketHandler() {
  const ws = useRef(null);
  
  useEffect(() => {
    ws.current = new WebSocket(backendUrl);
    ws.current.onmessage = async (event) => {
      const raw = event.data;
      const parsed = await parseMessage(raw);
      const { type } = parsed.header;

      wsDispatcher.dispatchEvent(new CustomEvent(type, { detail: parsed }));
    };

    return () => ws.current?.close();
  }, []);

  const send = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.error("WebSocket is not ready");
    }
  };

  return { send };
}

function useMessage(handler, messageType) {
  useEffect(() => {
    function callback(e) {
      handler(e.detail);
    }
    wsDispatcher.addEventListener(messageType, callback);
    return () => {
      wsDispatcher.removeEventListener(messageType, callback);
    };
  }, [handler]);
}

export const useDownloadProgressMessage = (handler) => useMessage(handler, types.DownloadingProgress);
export const useGetFileResponseMessage = (handler) => useMessage(handler, types.GetFileResponse);