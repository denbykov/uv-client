import { createContext, useContext } from 'react';

export const WebSocketContext = createContext();

export const useWebSocketData = () => {
  return useContext(WebSocketContext);
};