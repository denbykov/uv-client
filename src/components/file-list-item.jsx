"use strict"

import * as React from 'react';

import { useWebSocketData } from '../websocket-context';

export function FileListItem({ index, item }) {
  const { lastMessage, sendMessage } = useWebSocketData();

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