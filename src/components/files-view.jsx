"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

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

async function handleMessage(stateRef, setItems, lastMessage) {
  if (lastMessage === null) {
    return;
  }

  const state = stateRef.current;

  const message = await protocol.parseMessage(lastMessage);
  if (state.uuid !== message.header.uuid) {
    console.log("Not my uuid!");
    return;
  }

  if (message.header.type == protocol.types.GetFilesResponse) {
    const newItems = message.payload.files;
    setItems(newItems);

    state.pagination.total = message.payload.total;
    state.pagination.pagesLoaded += 1;
  }
  else if (message.header.type === protocol.types.Error) {
    console.log(`failed to load files: ${message.payload.reason}`);
  } else {
    console.log(`unable to handle message: ${message}`);
  }
}

function loadPage(stateRef, sendMessage, page) {
  if (page !== 0 && (page > 1 || page < -1)) {
    throw new Error("Page argument should be in range [-1, 1]");
  }

  const state = stateRef.current;
  state.uuid = protocol.uuidv4();

  state.pagination.offset += state.pagination.limit * page;

  const request = protocol.buildGetFilesRequest(
    state.uuid, state.pagination.limit, state.pagination.offset);

  sendMessage(request.serialize(), []);
}

function handleScroll(stateRef, event) {
  const scrollTop = event.currentTarget.scrollTop;
  const offsetHeight = event.currentTarget.offsetHeight;
  const scrollHeight = event.currentTarget.scrollHeight;

  const state = stateRef.current;

  if (state.pagination.total > 0 && state.scrolling.itemHeight == 0) {
    state.scrolling.itemHeight = 
      scrollHeight / 
      Math.min(state.pagination.limit, state.pagination.total);
  }

  // if (state.pagination.total > state.pagination.limit && state.pagination.pagesLoaded == 1) {
  //   // loadPage();
  // }

  state.scrolling.scrollTop = scrollTop;
  state.scrolling.offsetHeight = offsetHeight;

  // console.log(scrollTop);
  // console.log(offsetHeight);
};

export function FilesView() {
  const { lastMessage, sendMessage } = useWebSocketData();
  const state = useRef(new State());
  const [items, setItems] = useState([]);

  useEffect(() => {handleMessage(state, setItems, lastMessage)}, [lastMessage]);
  useEffect(() => loadPage(state, sendMessage, 0), []);

  return (
    <>
      <div className="main-section">
        <div className="main sub-section">
        </div>
        <div className="side sub-section scrollable" onScroll={(event) => {handleScroll(state, event)}}>
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
