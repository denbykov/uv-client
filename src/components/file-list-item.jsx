"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useWebSocketData } from '../websocket-context';
import * as protocol from '../protocol/message';
import { DownloadingState } from './states/downloading-state';

export function FileListItem({ index, item }) {
  const { lastMessage, sendMessage } = useWebSocketData();
  const [dlState, setDlState] = useState(null);
  const [itemStatus, setItemStatus] = useState(item.status);

  // Methods

  const handleMessage = useCallback(
    async function(lastMessage) {
      if (lastMessage === null) {
        return;
      }
    
      const message = await protocol.parseMessage(lastMessage);

      if (message.header.type === protocol.types.DownloadingProgress && message.payload.id === item.id) {
        setDlState((prev) => {
          var newState = new DownloadingState();
          
          if (prev !== null) {
            newState.copy(prev); 
          }

          newState.uuid = message.header.uuid;
          newState.percentage = message.payload.percentage;

          return newState;
        });
      }

      if (message.header.type === protocol.types.DownloadingDone && message.payload.id === item.id) {
        setItemStatus("f");
        setDlState(null);
      }
    },
    [dlState]
  );

  // Effects

  useEffect(() => {handleMessage(lastMessage)}, [lastMessage]);

  // Rendering

  if (itemStatus === "d" && dlState === null) {
    var newState = new DownloadingState();
    newState.percentage = 0;
    setDlState(newState);
  }

  if (dlState !== null) {
    var percentageValue = dlState.percentage.toFixed(0);
    if (percentageValue == 100) {
      percentageValue = 99;
    }
    const percentage = percentageValue + "%";

    return (
      <>
        <li>
          <div className='file-list-item' key={index}>
            <div className="progress-animation">
            </div>
            <div>{item.id}</div>
            <div>{percentage}</div>
            <div>{item.source}</div>
            <div>{item.status}</div>
            <div>{item.addedAt}</div>
          </div>
        </li>
      </>
    );
  }

  return (
    <>
      <li>
        <div className='file-list-item' key={index}>
          <div>{item.id}</div>
          <div>{item.source}</div>
          <div>{item.status}</div>
          <div>{item.addedAt}</div>
        </div>
      </li>
    </>
  );
}