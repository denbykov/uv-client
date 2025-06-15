"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useWebSocketData } from '../websocket-context';
import { DownloadingForm } from './downloading-form.jsx';
import { FileListItem } from './file-list-item.jsx';
import { FileView } from './file-view.jsx';
import { ItemList } from './generic/item-list.jsx';
import { ItemListHeader } from './generic/item-list-header.jsx';

import * as protocol from '../protocol/index';
import { 
  useDownloadingProgressMessage,
  useDownloadingDoneMessage,
  useErrorMessage,
  useDoneMessage,
  useGetFilesResponseMessage,
  useDeleteFilesErrorMessage,
  useCanceledMessage
} from '../protocol/hooks';

class CurrentRequest {
  constructor(uuid, direction, offset) {
    this.uuid = uuid;
    this.direction = direction;
    this.offset = offset;
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
    this.deletionRequestUuid = null;
    this.downloadingsInProgess = new DownloadingsInProgess();
  }
}

class LastResponse {
  constructor() {
    this.items = [];
    this.total = 0;
    this.direction = 0;
    this.offset = 0;
  }
}

export function FilesView() {
  const stateRef = useRef(new State());
  const { send } = useWebSocketData();
  const [ error, setError ] = useState(null);
  const [ lastResponse, setLastResponse ] = useState(new LastResponse());
  const [ refresh, setRefresh ] = useState(false);
  const [ resetScrolling, setResetScrolling ] = useState(false);
  const [ selectedFile, setSelectedFile ] = useState(null);
  const [ checkedItems, setCheckedItems ] = useState([]);

  // Methods

  const init = useCallback(
    function() {
      stateRef.current = new State();

      return () => {
        console.log("leaving");
      }
    }
  );

  const sendLoadPagesRequest = useCallback(
    function(direction, limit, offset) {
      console.log(`loading request ${direction} ${limit} ${offset}`);

      const state = stateRef.current;
      state.currentRequest = new CurrentRequest(protocol.uuidv4(), direction, offset);
    
      const request = protocol.buildGetFilesRequest(
        state.currentRequest.uuid, limit, Math.max(0, offset));
    
      send(request.serialize(), []);
    },
    []
  );

  const cancelDownloading = useCallback(
    function(downloadingInProgress) {
      downloadingInProgress.canceled = true;
      const request = protocol.buildCancelRequest(downloadingInProgress.uuid);
      send(request.serialize(), []);
    },
    []
  );

  const deleteFiles = useCallback(
    function() {
      const state = stateRef.current;
      if (state.deletionRequestUuid !== null) {
        console.error(`other deletion request is in progress, uuid: ${state.deletionRequestUuid}`);
        return;
      }
      
      var idsToDelete = [];

      for (let i = 0; i < checkedItems.length; i++) {
        var id = checkedItems[i];
        var downloadingInProgress = state.downloadingsInProgess.getByID(id);

        if (downloadingInProgress !== null) {
          cancelDownloading(downloadingInProgress);
        } else {
          idsToDelete.push(id);
        }
      }

      if (idsToDelete.length > 0) {
        state.deletionRequestUuid = protocol.uuidv4();
        const request = protocol.builDeleteFilesRequest(state.deletionRequestUuid, idsToDelete);
        send(request.serialize(), []);
      }  
    },
    [checkedItems]
  );

  const handleFilesMessage = useCallback(
    function(message) {
      const state = stateRef.current;

      var lastResponse = new LastResponse();
      lastResponse.items = message.payload.files;
      lastResponse.total = message.payload.total;
      lastResponse.direction = state.currentRequest.direction;
      lastResponse.offset = state.currentRequest.offset;

      setLastResponse(lastResponse);

      state.currentRequest = null;
    },
    []
  );

  const handleProgressMessage = useCallback(
    function(message) {
      const state = stateRef.current;
      const uuid = message.header.uuid;

      if (!state.downloadingsInProgess.includesUUID(uuid)) {
        state.downloadingsInProgess.add(uuid, message.payload.id);
        setRefresh(true);
      }
    },
    []
  );

  const handleErrorMessage = useCallback(
    function(message) {
      const state = stateRef.current;
      const uuid = message.header.uuid;

      if (state.currentRequest !== null && 
          state.currentRequest.uuid === uuid) {
        console.log(`failed to load files: ${message.payload.reason}`);
        return;
      }

      if (state.downloadingsInProgess.includesUUID(uuid)) {
        state.downloadingsInProgess.remove(uuid);
        setRefresh(true);
        setError(message.payload.reason);
        return;
      }
    },
    []
  );

  const handleDownloadingDoneMessage = useCallback(
    function(message) {
      const state = stateRef.current;

      var item = state.downloadingsInProgess.getByID(message.payload.id);

      if (item.canceled) {
        let uuid = protocol.uuidv4();
        state.secondaryDeletionRequests.push(uuid);
        let request = protocol.builDeleteFilesRequest(uuid, [item.id]);
        send(request.serialize(), []);
      }
    },
    []
  );

  const handleDeleteFilesErrorMessage = useCallback(
    function(message) {
      const state = stateRef.current;
      const uuid = message.header.uuid;

      if (state.deletionRequestUuid !== null &&
          state.deletionRequestUuid === message.header.uuid) {
        var failedIds = message.payload.failedIds
        var msg = `failed to delete files: ${failedIds}`;
        console.error(msg);
        
        setCheckedItems((prev) => {
          return prev.filter((item) => failedIds.includes(item));
        });

        setRefresh(true);
        setError(msg);
        state.deletionRequestUuid = null;
        return;
      }

      if (state.secondaryDeletionRequests.includes(uuid)) {
        var failedIds = message.payload.failedIds
        var msg = `failed to delete files: ${failedIds}`;
        console.error(msg);
        
        state.secondaryDeletionRequests = state.secondaryDeletionRequests.filter((item) => item !== uuid);

        setError(msg);
        return;
      }
    },
    [checkedItems]
  );

  const handleDoneMessage = useCallback(
    function(message) {
      const state = stateRef.current;
      const uuid = message.header.uuid;

      if (state.deletionRequestUuid !== null &&
          state.deletionRequestUuid === uuid) {
        setCheckedItems([]);
        setResetScrolling(true);
        state.deletionRequestUuid = null;
        return;
      }

      if (state.secondaryDeletionRequests.includes(uuid)) {
        setCheckedItems([]);
        setResetScrolling(true);
        state.secondaryDeletionRequests = state.secondaryDeletionRequests.filter((item) => item !== uuid);
        return;
      }
    },
    []
  );

  const handleCancelledMessage = useCallback(
    function(message) {
      const state = stateRef.current;
      const uuid = message.header.uuid;

      if (state.downloadingsInProgess.includesUUID(uuid)) {
        state.downloadingsInProgess.remove(uuid);
        setRefresh(true);
      }
    },
    []
  );

  const isChecked = useCallback(
    function(id) {
      return typeof checkedItems.find((item) => item === id) !== "undefined";
    },
    [checkedItems]
  );

  const onCheckChanged = useCallback(
    function(id, checked) {
      if (checked === true) {
        setCheckedItems((prev) => {
          var newCheckedItems = prev.slice();
          var containsItem = typeof prev.find((item) => item === id) !== "undefined";

          if (!containsItem) {
            newCheckedItems.push(id);
          }

          return newCheckedItems;
        });
      }

      if (checked === false) {
        setCheckedItems((prev) => {
          return prev.filter((item) => item !== id);
        });
      }
    },
    [checkedItems]
  );

  // Effects

  useEffect(init, []);

  // Message hooks

  useGetFilesResponseMessage(handleFilesMessage);
  useDownloadingProgressMessage(handleProgressMessage);
  useDownloadingDoneMessage(handleDownloadingDoneMessage);
  useDeleteFilesErrorMessage(handleDeleteFilesErrorMessage);
  useDoneMessage(handleDoneMessage);
  useDeleteFilesErrorMessage(handleDeleteFilesErrorMessage);
  useErrorMessage(handleErrorMessage);
  useCanceledMessage(handleCancelledMessage);

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
          <ItemListHeader
            checkedItems={checkedItems} setCheckedItems={setCheckedItems}
            deleteItems={deleteFiles}
          />
          <ItemList 
            childComponent={FileListItem}
            sendLoadPagesRequest={sendLoadPagesRequest}
            lastResponse={lastResponse}
            refresh={refresh} setRefresh={setRefresh}
            resetScrolling={resetScrolling} setResetScrolling={setResetScrolling}
            selectedItem={selectedFile} setSelectedItem={setSelectedFile}
            isChecked={isChecked} onCheckChanged={onCheckChanged}
          />
        </div>
      </div>
    </>
  );
}
