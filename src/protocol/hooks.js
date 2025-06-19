"use strict"

import { useEffect, useRef, useState } from 'react';

import types from './types';
import { parseMessage } from './message';

const wsDispatcher = new EventTarget();
const backendUrl = "ws://localhost:3080/ws";

export function useWebSocketHandler() {
  const ws = useRef(null);

  const [ isActive, setIsActive ] = useState(false);
  
  useEffect(() => {
    ws.current = new WebSocket(backendUrl);
    ws.current.onmessage = async (event) => {
      const raw = event.data;
      const parsed = await parseMessage(raw);
      const { type } = parsed.header;

      wsDispatcher.dispatchEvent(new CustomEvent(type, { detail: parsed }));
    };

    ws.current.onopen = function() {
      setIsActive(true);
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

  return { isActive, send };
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

export const useDownloadingProgressMessage = (handler) => useMessage(handler, types.DownloadingProgress);
export const useDownloadingDoneMessage = (handler) => useMessage(handler, types.DownloadingDone);

export const useErrorMessage = (handler) => useMessage(handler, types.Error);
export const useDoneMessage = (handler) => useMessage(handler, types.Done);
export const useCanceledMessage = (handler) => useMessage(handler, types.Canceled);

export const useGetFilesResponseMessage = (handler) => useMessage(handler, types.GetFilesResponse);
export const useGetFileResponseMessage = (handler) => useMessage(handler, types.GetFileResponse);

export const useDeleteFilesErrorMessage = (handler) => useMessage(handler, types.DeleteFilesError);
export const useGetSettingsResponse = (handler) => useMessage(handler, types.GetSettingsResponse);
export const useUpdateSettingsResponse = (handler) => useMessage(handler, types.UpdateSettingsResponse);
