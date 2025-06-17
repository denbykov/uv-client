"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useWebSocketData } from '../websocket-context';

import * as protocol from '../protocol/index';
import { useSelectDirectory } from '../hooks/use-select-directory';

// import { 
//   useDownloadingProgressMessage,
//   useDownloadingDoneMessage,
//   useErrorMessage,
//   useDoneMessage,
//   useGetFilesResponseMessage,
//   useDeleteFilesErrorMessage,
//   useCanceledMessage
// } from '../protocol/hooks';

class State {
  constructor() {
    this.defaultDownloadingDirectory = "";
  }
}

export function SettingsView() {
  // const { send } = useWebSocketData();
  const {selectedDirectory, selectDirectory} = useSelectDirectory();
  const [state, setState] = useState(new State());

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

  const saveSettings = useCallback(
    function(formData) {
      console.log(formData);
    }
  )

  // Message hooks

  // useGetFilesResponseMessage(handleFilesMessage);

  // Effects

  useEffect(() => {
    if (selectedDirectory !== null) {
      setState((prev) => {
        var newState = structuredClone(prev);
        newState.defaultDownloadingDirectory = selectedDirectory;
        return newState;
      });
    }
  }, [selectedDirectory]);

  // Rendering

  return (
    <>
      <div className="view">
        <div className="sub-view">
          <div className="settings">
            <form action={saveSettings} className="form">
              <div className="item">
                <label className='label'>Default Downloading Directory</label>
                <div className="row">
                  <input name="url" disabled value={state.defaultDownloadingDirectory}></input>
                  <button className="button" type="button" onClick={selectDirectory}>Select</button>
                </div>
              </div>
              {/* <button className="button" type="submit">Save</button> */}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
