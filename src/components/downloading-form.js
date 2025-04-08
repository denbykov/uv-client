"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useWebSocketData } from '../websocket-context';
import * as protocol from '../protocol/message';

class DownloadingState {
  constructor() {
    this.percentage = 0;
    this.error = null;
    this.done = false;
    this.uuid = null;
  }

  copy(other) {
    this.percentage = other.percentage;
    this.error = other.error;
    this.done = other.done;
    this.uuid = other.uuid;
  }
}

export function DownloadingForm() {
  const { lastMessage, sendMessage } = useWebSocketData();
  const [dlState, setDlState] = useState(null);

  useEffect(() => {
    if (dlState === null) {
      return;
    }

    if (dlState === null && dlState.uuid !== lastMessage.header.uuid) {
      return;
    }

    if (lastMessage === null) {
      return;
    }

    const handleMessage = async(lastMessage) => {
      const message = await protocol.parseMessage(lastMessage);
      if (message.header.type === protocol.types.Error) {
        setDlState((prev) => {
          const state = new DownloadingState();

          if (prev !== null) {
            state.copy(prev);
          }
          
          state.error = message.payload.reason;
          return state;
        });
      } else if (message.header.type === protocol.types.DownloadingProgress) {
        setDlState((prev) => {
          const state = new DownloadingState();

          if (prev !== null) {
            state.copy(prev);
          }
          
          state.percentage = message.payload.percentage;
          return state;
        });
      } else if (message.header.type === protocol.types.Done) {
        setDlState((prev) => {
          const state = new DownloadingState();

          if (prev !== null) {
            state.copy(prev);
          }
          
          state.done = true;
          return state;
        });
      } else {
        console.log(`unable to handle message: ${message}`);
      }
    };

    handleMessage(lastMessage);
  }, [lastMessage]);

  const download = useCallback(
    function(formData) {
      if (dlState !== null) {
        console.log.Error("Downloading state already esists!");
        return;
      }

      const state = new DownloadingState();
      state.uuid = protocol.uuidv4();
      setDlState(state);

      const url = formData.get("url");
      const request = protocol.buildDownloadingRequest(state.uuid, url);
      sendMessage(request.serialize(), [])
    }
  );

  const cancel = useCallback(
    function() {
      if (dlState === null) {
        console.log.Error("Downloading state does not esist!");
        return;
      }
      const request = protocol.buildCancelRequest(dlState.uuid);
      sendMessage(request.serialize(), []);

      setDlState(null);
    }
  );

  if (dlState === null) {
    return (
      <>
      <div className="canvas">
        <div className="url-form-container">
          <form action={download} className="url-form">
            <label>Enter URL</label>
            <input name="url"></input>
            <button className="bordered" type="submit">Donwload</button>
          </form>
        </div>
      </div>
      </>
    );
  }  

  if (dlState.error !== null) {
    return (
      <>
      <div className="canvas">
        <div className="url-form-container">
          <div className="dl-status-contaier">
            <div className="error label">Error</div>
            <div className="error message bordered-like">{dlState.error}</div>
            <button className="bordered error" onClick={() => setDlState(null)}>Continue</button>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (dlState.done === true) {
    const percentage = dlState.percentage.toFixed(0) + "%";
    return (
      <>
      <div className="canvas">
        <div className="url-form-container">
          <div className="dl-status-contaier">
            <div className="label">Downloading</div>
            <div className="message bordered progress-bar-container">
              <div className="progress-percentage">{percentage}</div>
              <div className="static-progress-bar" style={{width: percentage}}></div>
            </div>
            <button className="bordered" onClick={() => setDlState(null)}>Continue</button>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (dlState.percentage !== null) {
    var percentageValue = dlState.percentage.toFixed(0);
    console.log(percentageValue);
    if (percentageValue == 100) {
      percentageValue = 99;
    }
    const percentage = percentageValue + "%";
    return (
      <>
      <div className="canvas">
        <div className="url-form-container">
          <div className="dl-status-contaier">
            <div className="label">Downloading</div>
            <div className="message bordered progress-bar-container">
              <div className="progress-bar" style={{width: percentage}}>
                <div className="progress-animation"></div>
              </div>
              <div className="progress-percentage">{percentage}</div>
            </div>
            <button className="bordered" onClick={() => cancel()}>Cancel</button>
          </div>
        </div>
      </div>
      </>
    );
  }
}
