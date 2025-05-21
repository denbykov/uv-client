"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';

import { useWebSocketData } from '../websocket-context';
import { DownloadingForm } from './downloading-form.jsx';
import { FileListItem } from './file-list-item.jsx';
import { FileView } from './file-view.jsx';
import { ItemList } from './generic/item-list.jsx';
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

class State {
  constructor() {
    this.currentRequest = null;
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
  const [ lastResponse, setLastResponse ] = useState(new LastResponse());

  // Methods

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

  const sendRequest = useCallback(
    function(direction, limit, offset) {
      const state = stateRef.current;
      state.currentRequest = new CurrentRequest(protocol.uuidv4(), direction, offset);
    
      const request = protocol.buildGetFilesRequest(
        state.currentRequest.uuid, limit, Math.max(0, offset));
    
      send(request.serialize(), []);
    }
  )

  // Message hooks

  useGetFilesResponseMessage(handleFilesMessage);
  // useDownloadingProgressMessage(handleProgressMessage);
  // useDownloadingDoneMessage(handleDownloadingDoneMessage);
  // useDeleteFilesErrorMessage(handleDeleteFilesErrorMessage);
  // useDoneMessage(handleDoneMessage);
  // useDeleteFilesErrorMessage(handleDeleteFilesErrorMessage);
  // useErrorMessage(handleErrorMessage);
  // useCanceledMessage(handleCancelledMessage);

  // Rendering

  return (
    <>
      <ItemList 
        sendRequest={sendRequest}
        lastResponse={lastResponse}
      />
    </>
  );
}
