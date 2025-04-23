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
    this.limit = 12
    this.offset = 0
    this.total = 0

    this.pagesLoaded = 0

    this.previousPage = null
    this.currentPage  = null
    this.nextPage     = null

    this.itemsLoaded = 0
  }
}

class ScrollingData {
  constructor() {
    this.itemHeight = 0
    this.pageHeight = 0
  }
}

class CurrentRequest {
  constructor(uuid, page, continuation) {
    this.uuid = uuid;
    this.page = page;
    this.continuation = continuation;
  }
}

class State {
  constructor() {
    this.currentRequest = null;
    this.pagination = new PaginationData();
    this.scrolling = new ScrollingData();
  }
}

export function FilesView() {
  const { lastMessage, sendMessage } = useWebSocketData();
  const stateRef = useRef(new State());
  const [items, setItems] = useState([]);

  // Methods

  const updateItems = useCallback(
    function() {
      const state = stateRef.current;
      const pagination = state.pagination;

      var items = [];
      if (pagination.previousPage !== null) {
        items = items.concat(pagination.previousPage);
      }
      
      if (pagination.currentPage !== null) {
        items = items.concat(pagination.currentPage);
      }
      
      if (pagination.nextPage !== null) {
        items = items.concat(pagination.nextPage);
      }

      state.pagination.itemsLoaded = items.length;

      setItems(items);
    },
    []
  );

  const handleFilesMessage = useCallback(
    function(message) {
      const state = stateRef.current;
      const pagination = state.pagination;
    
      const newItems = message.payload.files;
      
      state.pagination.total = message.payload.total;

      if (state.currentRequest.page == -1) {
        pagination.previousPage = newItems;
      } else if (state.currentRequest.page == 0) {
        pagination.currentPage = newItems;
      } else if (state.currentRequest.page == 1) {
        pagination.nextPage = newItems;
      }

      updateItems();

      const continuation = state.currentRequest.continuation;
    
      state.pagination.pagesLoaded += 1;
      state.currentRequest = null;

      if (typeof continuation !== 'undefined' && continuation !== null) {
        console.log("Executing handle files message continuation")
        continuation();
      }
    },
    []
  );
  
  const handleMessage = useCallback(
    async function(lastMessage) {
      if (lastMessage === null) {
        return;
      }
    
      const state = stateRef.current;

      if (state.currentRequest === null) {
        console.log("have no request");
        return;
      }
    
      const message = await protocol.parseMessage(lastMessage);
      if (state.currentRequest.uuid !== message.header.uuid) {
        console.log("Not my uuid!");
        return;
      }
    
      if (message.header.type == protocol.types.GetFilesResponse) {
        handleFilesMessage(message);
      }
      else if (message.header.type === protocol.types.Error) {
        console.log(`failed to load files: ${message.payload.reason}`);
      } else {
        console.log(`unable to handle message: ${message}`);
      }
    },
    []
  );
  
  const loadPage = useCallback(
    function (page, continuation) {
      console.log(`load page(${page})`);

      const state = stateRef.current;

      if (state.currentRequest !== null) {
        throw new Error("unable to do paralel requests");
      }

      if (page !== 0 && (page > 1 || page < -1)) {
        throw new Error("page argument should be in range [-1, 1]");
      }

      if (page === -1 && state.pagination.previousPage !== null) {
        throw new Error("previous page already loaded");
      }

      if (page === 0 && state.pagination.currentPage !== null) {
        throw new Error("current page already loaded");
      }

      if (page === +1 && state.pagination.nextPage !== null) {
        throw new Error("next page already loaded");
      }
    
      state.currentRequest = new CurrentRequest(protocol.uuidv4(), page, continuation);
    
      const offset = state.pagination.offset + state.pagination.limit * page;
      const total = state.pagination.total;
      if (offset < 0 || offset > total) {
        throw new Error(`offset is out of the boundaries! offset: ${offset}, total: ${total}`)
      }
    
      const request = protocol.buildGetFilesRequest(
        state.currentRequest.uuid, state.pagination.limit, offset);
    
      sendMessage(request.serialize(), []);
    },
    []
  );

  const loadNextPageIfAwailable = useCallback(
    function() {
      const state = stateRef.current;
      const pagination = state.pagination;

      const nextPageAvailable = pagination.offset + pagination.limit < pagination.total;
      if (nextPageAvailable) {
        loadPage(+1);
      }
    });
  
  const handleScroll = useCallback(
    function(event) {
      const scrollTop = event.currentTarget.scrollTop;
      const offsetHeight = event.currentTarget.offsetHeight;
      const scrollHeight = event.currentTarget.scrollHeight;
    
      const state = stateRef.current;
      const scrolling = state.scrolling;
      const pagination = state.pagination;
    
      if (pagination.total > 0 && scrolling.itemHeight == 0) {
        scrolling.itemHeight = scrollHeight / pagination.itemsLoaded;
        scrolling.pageHeight = scrolling.itemHeight * pagination.limit;
      }

      if (state.currentRequest !== null) {
        return;
      }

      if (scrolling.pageHeight < offsetHeight) {
        throw Error("current scrolling implementation requires offset height to be larger than page height");
      }

      const twoNextPagesAvailable = pagination.offset + pagination.limit * 2 < pagination.total;
      const twoPreviousPagesAvailable = 
        (pagination.offset - pagination.limit * 2 >= 0) && 
        (pagination.offset - pagination.limit * 2 < pagination.total);
      
      const atBeginning = pagination.previousPage === null;
      const atEnd = pagination.nextPage === null;
      const inMiddle = !(atBeginning || atEnd) ;
      
      if (atBeginning) {
        if (scrollTop >= scrolling.pageHeight && twoNextPagesAvailable) {
          pagination.previousPage = pagination.currentPage;
          pagination.currentPage = pagination.nextPage;
          pagination.offset += pagination.limit;
          pagination.nextPage = null;
          
          loadPage(+1);
          return;
        }
  
        if (scrollTop >= scrolling.pageHeight && !twoNextPagesAvailable) {
          pagination.previousPage = pagination.currentPage;
          pagination.currentPage = pagination.nextPage;
          pagination.offset += pagination.limit;
          pagination.nextPage = null;

          updateItems();
          return;
        }

        return;
      }

      if (inMiddle) {
        if (scrollTop + offsetHeight == scrollHeight) {
          pagination.previousPage = pagination.currentPage;
          pagination.currentPage = pagination.nextPage;
          pagination.offset += pagination.limit;
          pagination.nextPage = null;

          updateItems();
          return;
        }

        if (scrollTop >= scrolling.pageHeight * 2 && !twoNextPagesAvailable) {
          pagination.previousPage = pagination.currentPage;
          pagination.currentPage = pagination.nextPage;
          pagination.offset += pagination.limit;
          pagination.nextPage = null;

          updateItems();
          return;
        }

        if (scrollTop >= scrolling.pageHeight * 2 && twoNextPagesAvailable) {
          pagination.previousPage = pagination.currentPage;
          pagination.currentPage = pagination.nextPage;
          pagination.offset += pagination.limit;
          pagination.nextPage = null;
          
          loadPage(+1);
          return;
        }

        if (scrollTop <= scrolling.pageHeight && twoPreviousPagesAvailable) {
          pagination.nextPage = pagination.currentPage;
          pagination.currentPage = pagination.previousPage;
          pagination.offset -= pagination.limit;
          pagination.previousPage = null;
          
          loadPage(-1);
          return;
        }

        if (scrollTop <= scrolling.pageHeight && !twoPreviousPagesAvailable) {
          pagination.nextPage = pagination.currentPage;
          pagination.currentPage = pagination.previousPage;
          pagination.offset -= pagination.limit;
          pagination.previousPage = null;
          
          updateItems();
          return;
        }

        return;
      }

      if (atEnd) {
        const scrollBottom = scrollTop + offsetHeight;

        const lastPageSize = pagination.total - pagination.offset;
        const lastPageHeight = lastPageSize * scrolling.itemHeight;

        if (scrollBottom <= scrollHeight - lastPageHeight) {
          pagination.nextPage = pagination.currentPage;
          pagination.currentPage = pagination.previousPage;
          pagination.offset -= pagination.limit;
          pagination.previousPage = null;
          
          loadPage(-1);
          return;
        }

        return;
      }
    },
    []
  );

  // Effects

  useEffect(() => {handleMessage(lastMessage)}, [lastMessage]);
  useEffect(() => loadPage(0, loadNextPageIfAwailable), []);

  // Rendering

  return (
    <>
      <div className="main-section">
        <div className="main sub-section">
        </div>
        <div className="side sub-section scrollable" onScroll={(event) => {handleScroll(event)}}>
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
