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

class PaginationData {
  constructor() {
    this.limit = 20
    this.offset = 0
    this.total = 0

    this.pagesLoaded = 0
  }
}

class ScrollingData {
  constructor() {
    this.scrollTop = 0
    this.offsetHeight = 0
    this.pageHeight = 0
    this.itemHeight = 0
  }
}

class State {
  constructor() {
    this.uuid = null;
    this.pagination = new PaginationData();
    this.scrolling = new ScrollingData();
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
        console.log("Not mine uuid!");
        return;
      }

      if (message.header.type == protocol.types.GetFilesResponse) {
        const newItems = message.payload.files;
        setItems(newItems);

        const newState = structuredClone(state);
        newState.pagination.total = message.payload.total;
        newState.pagination.pagesLoaded += 1;
        setState(newState);
      }
      else if (message.header.type === protocol.types.Error) {
        console.log(`failed to load files: ${message.payload.Reason}`);
      } else {
        console.log(`unable to handle message: ${message}`);
      }
    };

    handleMessage(lastMessage);
  }, [lastMessage]);

  const loadFiles = function() {
    var newState = null;
    if (state === null) {
      newState = new State();
      newState.uuid = protocol.uuidv4();
    } else {
      newState = structuredClone(state);
      newState.copy(state);
      newState.uuid = protocol.uuidv4();
    }
    setState(newState);
    
    const request = protocol.buildGetFilesRequest(
      newState.uuid, newState.pagination.limit, newState.pagination.offset);
    sendMessage(request.serialize(), []);
  };

  const handleScroll = function(event) {
    const scrollTop = event.currentTarget.scrollTop;
    const offsetHeight = event.currentTarget.offsetHeight;
    const scrollHeight = event.currentTarget.scrollHeight;

    setState(state => {
      if (state === null) {
        return state;
      }
  
      const newState = structuredClone(state);
  
      if (state.pagination.total > 0 && state.scrolling.itemHeight == 0) {
        newState.scrolling.itemHeight = 
          scrollHeight / 
          Math.min(state.pagination.limit, state.pagination.total);
  
        newState.scrolling.pageHeight = newState.scrolling.itemHeight * state.pagination.limit;
      }
  
      if (state.pagination.total > state.pagination.limit && state.pagination.pagesLoaded == 1) {
        // loadFiles();
      }
  
      newState.scrolling.scrollTop = scrollTop;
      newState.scrolling.offsetHeight = offsetHeight;
  
      console.log(scrollTop);
      console.log(offsetHeight);
      return newState;
    });
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <>
      <div className="main-section">
        <div className="main sub-section">
        </div>
        <div className="side sub-section scrollable" onScroll={handleScroll}>
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
