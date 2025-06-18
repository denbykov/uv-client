"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useWebSocketData } from '../websocket-context';

import * as protocol from '../protocol/index';
import { useSelectDirectory } from '../hooks/use-select-directory';
import { useGetSettingsResponse } from '../protocol/hooks';
import { useUpdateSettingsResponse } from '../protocol/hooks';

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
  const { send } = useWebSocketData();
  const { selectedDirectory, selectDirectory } = useSelectDirectory();
  const [ state, setState ] = useState(new State());

  // Methods

  const handleSettingsResponse = useCallback(
    function(message) {
      setState((prev) => {
        var newState = structuredClone(prev);
        newState.defaultDownloadingDirectory = message.payload.storage_dir;
        newState.uuid = null;
        return newState;
      });
    },
    [state]
  );

  const loadSettings = useCallback(
    function() {
      const uuid = protocol.uuidv4();
      const request = protocol.buildGetSettingsRequest(uuid);
      send(request.serialize(), []);
    },
    [state]
  );

  const updateSettings = useCallback(
    function() {
      const payload = {
        storage_dir: state.defaultDownloadingDirectory,
      };

      const uuid = protocol.uuidv4();
      const request = protocol.buildUpdateSettingsRequest(uuid, payload);
      send(request.serialize(), []);
    },
    [state]
  );

  // Message hooks

  useGetSettingsResponse(handleSettingsResponse);

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

  useEffect(loadSettings, []);

  // Rendering

  return (
    <>
      <div className="view">
        <div className="sub-view">
          <div className="settings">
            <form action={updateSettings} className="form">
              <div className='list'>
                <div className="item">
                  <label className='label'>Default Downloading Directory</label>
                  <div className="row">
                    <input name="url" disabled value={state.defaultDownloadingDirectory}></input>
                    <button className="button" type="button" onClick={selectDirectory}>Select</button>
                  </div>
                </div>
              </div>
              <button className="button submit" type="submit">Save</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
