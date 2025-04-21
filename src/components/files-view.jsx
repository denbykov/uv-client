"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useWebSocketData } from '../websocket-context';
import * as protocol from '../protocol/message';

function FileListItem({ index, item }) {
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

class State {
  constructor(uuid) {
    this.uuid = uuid;
  }

  copy(other) {
    this.uuid = other.uuid;
  }
}

export function FilesView() {
  const { lastMessage, sendMessage } = useWebSocketData();
  const [state, setState] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (state === null || lastMessage === null) {
      return;
    }

    const handleMessage = async(lastMessage) => {
      const message = await protocol.parseMessage(lastMessage);
      if (state.uuid !== message.header.uuid) {
        return;
      }

      if (message.header.type == protocol.types.GetFilesResponse) {
        setItems((prev) => {
          const newItems = message.payload.files;
          return newItems;
        });
      }
      else if (message.header.type === protocol.types.Error) {
        console.log(`failed to load files: ${message.payload.Reason}`);
      } else {
        console.log(`unable to handle message: ${message}`);
      }
    };

    handleMessage(lastMessage);
  }, [lastMessage]);

  const loadFiles = useCallback(
      function() {
      // if (state !== null) {
      //   return;
      // }

      const newState = new State();
      newState.uuid = protocol.uuidv4();
      setState(newState);

      const request = protocol.buildGetFilesRequest(newState.uuid, 20, 0);
      sendMessage(request.serialize(), []);
    }
  );

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <>
      <div className="main-section">
        <div className="main sub-section">
        </div>
        <div className="side sub-section scrollable">
          <ul>
            {items.map((item, index) => (
              <FileListItem key={item.id} index={index} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
