"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useWebSocketData } from '../websocket-context';
import * as protocol from '../protocol/message';
import { DownloadingForm } from './downloading-form.jsx';
import { FileListItem } from './file-list-item.jsx';
import { FileView } from './file-view.jsx';

const paginationStates = {
  atBeginning: "atBeginning",
  inMiddle: "inMiddle",
  atEnd: "atEnd",
};

class PaginationData {
  constructor() {
    this.limit = 15
    this.offset = -this.limit
    this.total = 0

    this.state = paginationStates.atBeginning;
    this.items = null

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
  constructor(uuid, direction, offset) {
    this.uuid = uuid;
    this.direction = direction;
    this.offset = offset;
  }
}

class State {
  constructor() {
    this.currentRequest = null;
    this.pagination = new PaginationData();
    this.scrolling = new ScrollingData();
    this.downloadingsInProgess = [];
    this.checkedItems = [];
  }
}

class Items {
  constructor() {
    this.displayedItems = [];
    this.total = 0;
    this.currentPage = 0;
    this.pageCount = 0;
  }

  copy = function(other) {
    this.displayedItems = other.displayedItems;
    this.total = other.total;
    this.currentPage = other.currentPage;
    this.pageCount = other.pageCount;
  }
}

export function FilesView() {
  const { lastMessage, sendMessage } = useWebSocketData();
  const stateRef = useRef(new State());
  const [items, setItems] = useState(new Items());
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);

  // Methods

  const updateDisplayedItems = useCallback(
    function() {
      const state = stateRef.current;
      const pagination = state.pagination;

      var items = new Items();
      items.displayedItems = pagination.items;
      state.pagination.itemsLoaded = items.displayedItems.length;
      items.total = pagination.total;
      items.pageCount = Math.ceil(pagination.total / pagination.limit);

      setItems((prev) => {
        if (prev.currentPage == 0) {
          items.currentPage = 1;
        } else {
          items.currentPage = prev.currentPage;
        }
        return items;
      });
    },
    []
  );

  const updateCurrentPageNumber = useCallback(
    function(delta) {
      setItems((prev) => {
        var items = new Items();
        items.copy(prev);
        items.currentPage += delta;
        return items;
      });
    },
    []
  );

  const handleFilesMessage = useCallback(
    function(message) {
      const state = stateRef.current;
      const pagination = state.pagination;
      pagination.total = message.payload.total;
      pagination.items = message.payload.files;
      updateDisplayedItems();

      const request = state.currentRequest;

      pagination.offset = request.offset;
      const direction = request.direction;

      state.currentRequest = null;
      
      if (request.direction === 0) {
        return;
      }

      if (direction === +1 && pagination.total <= pagination.offset + pagination.limit * 2) {
        pagination.state = paginationStates.atEnd;
        return;
      }

      if (direction === -1 && pagination.offset === -pagination.limit) {
        pagination.state = paginationStates.atBeginning;
        return;
      }
      
      pagination.state = paginationStates.inMiddle;
    },
    []
  );

  const actualizeDisplayedItems = useCallback(
    function() {
      loadThreePages(0);
    },
    []
  );
  
  const handleMessage = useCallback(
    async function(lastMessage) {
      if (lastMessage === null) {
        return;
      }
    
      const state = stateRef.current;
    
      const message = await protocol.parseMessage(lastMessage);
      const uuid = message.header.uuid;
    
      if (message.header.type === protocol.types.GetFilesResponse) {
        handleFilesMessage(message);
        return;
      }

      if (message.header.type === protocol.types.DownloadingProgress) {
        if (!state.downloadingsInProgess.includes(uuid)) {
          state.downloadingsInProgess.push(uuid);
          actualizeDisplayedItems();
        }
        return;
      }

      if (message.header.type === protocol.types.Error && 
          state.currentRequest !== null && 
          state.currentRequest.uuid === uuid) {
        console.log(`failed to load files: ${message.payload.reason}`);
        return;
      }

      if (message.header.type === protocol.types.Error) {
        if (state.downloadingsInProgess.includes(uuid)) {
          state.downloadingsInProgess = state.downloadingsInProgess.filter((el) => el === uuid);
          actualizeDisplayedItems();
          setError(message.payload.reason);
        }
      }
    },
    []
  );
  
  const loadThreePages = useCallback(
    function (direction) {
      const state = stateRef.current;

      if (state.currentRequest !== null) {
        throw new Error("unable to do paralel requests");
      }

      if (direction !== 0 && (direction > 1 || direction < -1)) {
        throw new Error("direction argument should be in range [-1, 1]");
      }
      
      const total = state.pagination.total;

      var offset = 0;
      if (state.pagination.state !== paginationStates.atBeginning) {
        offset = state.pagination.offset + state.pagination.limit * direction
      }
      
      const limit = state.pagination.limit * 3;
      
      if (offset > total) {
        throw new Error(`offset is larger than total number of items: ${offset}, total: ${total}`)
      }

      state.currentRequest = new CurrentRequest(protocol.uuidv4(), direction, offset);
    
      const request = protocol.buildGetFilesRequest(
        state.currentRequest.uuid, limit, Math.max(0, offset));
    
      sendMessage(request.serialize(), []);
    },
    []
  );

  const calculateScrollingConstants = useCallback(
    function(event) {
      const scrollHeight = event.currentTarget.scrollHeight;
    
      const state = stateRef.current;
      const scrolling = state.scrolling;
      const pagination = state.pagination;
    
      if (pagination.total > 0 && scrolling.itemHeight == 0) {
        scrolling.itemHeight = scrollHeight / pagination.itemsLoaded;
        scrolling.pageHeight = scrolling.itemHeight * pagination.limit;
      }
    },
    []
  );

  const handleScrollAtBeginning = useCallback(
    function(event) {
      const scrollTop = event.currentTarget.scrollTop;
      const offsetHeight = event.currentTarget.offsetHeight;
      const scrollHeight = event.currentTarget.scrollHeight;
      const state = stateRef.current;
      const scrolling = state.scrolling;

      if (scrollTop >= scrolling.pageHeight) {
        loadThreePages(+1);
        updateCurrentPageNumber(+1);
        return;
      }

      if (scrollTop + offsetHeight === scrollHeight) {
        loadThreePages(+1);
        updateCurrentPageNumber(+1);
        return;
      }
    },
    []
  );

  const handleScrollInMiddle = useCallback(
    function(event) {
      const scrollTop = event.currentTarget.scrollTop;
      const offsetHeight = event.currentTarget.offsetHeight;
      const scrollHeight = event.currentTarget.scrollHeight;
      const state = stateRef.current;
      const scrolling = state.scrolling;

      if (scrollTop >= scrolling.pageHeight * 2) {
        loadThreePages(+1);
        updateCurrentPageNumber(+1);
        return;
      }

      if (scrollTop + offsetHeight === scrollHeight) {
        loadThreePages(+1);
        updateCurrentPageNumber(+1);
        return;
      }
      
      if (scrollTop <= scrolling.pageHeight) {
        loadThreePages(-1);
        updateCurrentPageNumber(-1);
        return;
      }
    },
    []
  );

  const handleScrollAtEnd = useCallback(
    function(event) {
      const scrollTop = event.currentTarget.scrollTop;
      const offsetHeight = event.currentTarget.offsetHeight;
      const scrollHeight = event.currentTarget.scrollHeight;

      const state = stateRef.current;
      const scrolling = state.scrolling;
      const pagination = state.pagination;

      const scrollBottom = scrollTop + offsetHeight;
      const lastPageSize = pagination.itemsLoaded - pagination.limit;
      const lastPageHeight = lastPageSize * scrolling.itemHeight;

      if (scrollBottom <= scrollHeight - lastPageHeight) {        
        loadThreePages(-1);
        updateCurrentPageNumber(-1);
        return;
      }
    },
    []
  );
  
  const handleScroll = useCallback(
    function(event) {
      const offsetHeight = event.currentTarget.offsetHeight;

      const state = stateRef.current;
      const pagination = state.pagination;
      const scrolling = state.scrolling;

      calculateScrollingConstants(event);

      if (state.currentRequest !== null) {
        return;
      }

      if (scrolling.pageHeight < offsetHeight) {
        throw Error("current scrolling implementation requires offset height to be larger than page height");
      }

      if (pagination.state === paginationStates.atBeginning) {
        handleScrollAtBeginning(event);
      }

      if (pagination.state === paginationStates.inMiddle) {
        handleScrollInMiddle(event);
      }

      if (pagination.state === paginationStates.atEnd) {
        handleScrollAtEnd(event);
      }
    },
    []
  );

  const onCheckChanged = useCallback(
    function(id, checked) {
      const state = stateRef.current;

      if (checked === true) {
        state.checkedItems.push(id);
      }

      if (checked === false) {
        state.checkedItems = state.checkedItems.filter((item) => item !== id);
      }

      setCheckedItems(state.checkedItems);
    },
    []
  );

  const isChecked = useCallback(
    function(id) {
      // if (id > 65) {
      //   console.log(id);
      //   console.log(checkedItems);
      //   console.log(typeof checkedItems.find((item) => item === id) !== "undefined");
      // }

      return typeof checkedItems.find((item) => item === id) !== "undefined";
    },
    [checkedItems]
  );

  // Effects

  useEffect(() => {handleMessage(lastMessage)}, [lastMessage]);
  useEffect(() => loadThreePages(0), []);

  // Rendering

  return (
    <>
      {error !== null && (
        <div className="error holder">
          <div className="error window">
            <div className='label'>Error</div>
            <div className='message'>{error}</div>
            <button className='button' onClick={() => setError(null)}>Close</button>
          </div>
        </div>
      )}

      <div className="view">
        {selectedFile === null && (
          <div className="main sub-view">
          <DownloadingForm 
            setSelectedFile={setSelectedFile}
          />
        </div>
        )}
        {selectedFile !== null && (
          <div className="main sub-view">
          <FileView selectedFile={selectedFile}/>
        </div>
        )} 
        <div className="side sub-view file-list">
          <div className="header">
            <div>
              Nothing yet
            </div>
            <button className="add-item button" onClick={() => setSelectedFile(null)}>+</button>
          </div>
          <div className="body" onScroll={(event) => {handleScroll(event)}}>
            <ul>
              {items.displayedItems.map((item, index) => {
                return <FileListItem 
                  key={item.id} 
                  index={index}
                  item={item}
                  setSelectedFile={setSelectedFile} 
                  checked={isChecked(item.id)}
                  onCheckChanged={onCheckChanged}
                />
              })}
            </ul>
          </div>
          <div className="footer">
            <div>page {items.currentPage} of {items.pageCount}</div>
            <div>total {items.total}</div>
          </div>
        </div>
      </div>
    </>
  );
}
