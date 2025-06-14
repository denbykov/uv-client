"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';

import { DownloadingForm } from '../downloading-form.jsx';
import { FileListItem } from '../file-list-item.jsx';
import { FileView } from '../file-view.jsx';

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

class DownloadingInProgress {
    constructor(uuid, id) {
      this.uuid = uuid;
      this.id = id;
      this.canceled = false;
    }
}

class DownloadingsInProgess {
  constructor() {
    this.items = [];
  }

  add = function(uuid, id) {
    this.items.push(new DownloadingInProgress(uuid, id));
  }

  includesUUID = function(uuid) {
    return typeof this.items.find((item) => item.uuid === uuid) !== "undefined";
  }

  includesID = function(id) {
    return typeof this.items.find((item) => item.id === id) !== "undefined";
  }

  remove = function(uuid) {
    this.items = this.items.filter((el) => el === uuid);
  }

  getByID = function(id) {
    var item = this.items.find((item) => item.id === id);
    if (typeof item === "undefined") {
      return null;
    }

    return item;
  }
}

class State {
  constructor() {
    this.currentRequest = null;
    this.pagination = new PaginationData();
    this.scrolling = new ScrollingData();
    this.downloadingsInProgess = new DownloadingsInProgess();
    this.checkedItems = [];
    
    this.secondaryDeletionRequests = [];
  }

  resetScrolling = function() {
    this.currentRequest = null;
    this.pagination = new PaginationData();
    this.scrolling = new ScrollingData();
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

export function ItemList({ 
  sendLoadPagesRequest,
  sendDeleteFilesRequest,
  lastResponse,
  refresh, setRefresh,
  resetScrolling, setResetScrolling}) {
  const stateRef = useRef(new State());
  const [items, setItems] = useState(new Items());
  const [selectedFile, setSelectedFile] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);

  // Methods

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

      sendLoadPagesRequest(direction, limit, offset);
    },
    []
  );

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

  const handleLastResponse = useCallback(
    function() {
      const state = stateRef.current;
      const pagination = state.pagination;
      pagination.total = lastResponse.total;
      pagination.items = lastResponse.items;
      updateDisplayedItems();

      pagination.offset = lastResponse.offset;
      const direction = lastResponse.direction;
      
      if (direction === 0) {
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
    [lastResponse]
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

  const actualizeDisplayedItems = useCallback(
    function() {
      loadThreePages(0);
    },
    []
  );

  const doRefresh = useCallback(
    function() {
      if (refresh) {
        actualizeDisplayedItems();
        setRefresh(false);
      }
    },
    [refresh]
  )

  const isChecked = useCallback(
    function(id) {
      return typeof checkedItems.find((item) => item === id) !== "undefined";
    },
    [checkedItems]
  );

  const doResetScrolling = useCallback(
    function() {
      if (!resetScrolling) {
        return;
      }

      const state = stateRef.current;

      if (isChecked(selectedFile)) {
        setSelectedFile(null);
      }

      state.resetScrolling();

      var element = document.getElementById('scrollable');
      element.scrollTop = 0;
      loadThreePages(0);

      setCheckedItems([]);

      setResetScrolling(false);
    },
    [selectedFile, checkedItems, resetScrolling]
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

  // krutch to make it wait for session establishment
  const loadInitialData = useCallback(
    function () {
      async function load() {
        await new Promise(r => setTimeout(r, 100));
        loadThreePages(0);
      }
      load();
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

      const checkedItems = state.checkedItems.slice();
      setCheckedItems(checkedItems);
    },
    []
  );

  const isAnythingChecked = useCallback(
    function() {
      return checkedItems.length > 0;
    },
    [checkedItems]
  );

  const onHeaderCheckChanged = useCallback(
    function(e) {
      if (!e.target.checked) {
        const state = stateRef.current;
        state.checkedItems = [];
        setCheckedItems([]);
      }
    },
    [checkedItems]
  );

  const cancelDownloading = useCallback(
    function(downloadingInProgress) {
      downloadingInProgress.canceled = true;
      const request = protocol.buildCancelRequest(downloadingInProgress.uuid);
      send(request.serialize(), []);
    },
    []
  );

  const onDeleteFilesClicked = useCallback(
    function() {
      const state = stateRef.current;

      var idsToDelete = [];

      for (let i = 0; i < state.checkedItems.length; i++) {
        var id = state.checkedItems[i];
        var downloadingInProgress = state.downloadingsInProgess.getByID(id);

        if (downloadingInProgress !== null) {
          cancelDownloading(downloadingInProgress);
        } else {
          idsToDelete.push(id);
        }
      }

      if (idsToDelete.length > 0) {
        sendDeleteFilesRequest(idsToDelete);
      }
    },
    []
  );

  // Effects

  useEffect(loadInitialData, []);
  useEffect(handleLastResponse, [lastResponse]);
  useEffect(doRefresh, [refresh]);
  useEffect(doResetScrolling, [resetScrolling]);

  // Rendering

  return (
    <>
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
              <div>
                Nothing yet
              </div>
              <button className="add-item button" onClick={() => setSelectedFile(null)}>+</button>
            </div>
            <div>
              <div className={"multiaction-container" + (isAnythingChecked() ? "" : " disabled")}>
                <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isAnythingChecked()}
                    onChange={onHeaderCheckChanged}
                  />
                  <span className="checkmark"></span>
                </label>
                <button onClick={onDeleteFilesClicked} className="delete icon-button" aria-label="Delete">
                  <FaTrash className="icon" />
                </button>
              </div>
            </div>
          </div>
          <div id='scrollable' className="body" onScroll={(event) => {handleScroll(event)}}>
            <ul>
              {items.displayedItems.map((item, index) => {
                return <FileListItem 
                  key={item.id} 
                  index={index}
                  item={item}
                  selectedFile={selectedFile} 
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
