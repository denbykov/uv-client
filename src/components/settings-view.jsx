"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useWebSocketData } from '../websocket-context';

import * as protocol from '../protocol/index';
// import { 
//   useDownloadingProgressMessage,
//   useDownloadingDoneMessage,
//   useErrorMessage,
//   useDoneMessage,
//   useGetFilesResponseMessage,
//   useDeleteFilesErrorMessage,
//   useCanceledMessage
// } from '../protocol/hooks';

export function SettingsView() {
  // const stateRef = useRef(new State());
  // const { send } = useWebSocketData();

  // Methods

  // const sendLoadPagesRequest = useCallback(
  //   function(direction, limit, offset) {
  //     const state = stateRef.current;
  //     state.currentRequest = new CurrentRequest(protocol.uuidv4(), direction, offset);
    
  //     const request = protocol.buildGetFilesRequest(
  //       state.currentRequest.uuid, limit, Math.max(0, offset));
    
  //     send(request.serialize(), []);
  //   },
  //   []
  // );

  // Message hooks

  // useGetFilesResponseMessage(handleFilesMessage);

  // Rendering

  return (
    <>
      <div className="view">
        <div>
          Hello my baby, hello my honney!
        </div>
      </div>
    </>
  );
}
