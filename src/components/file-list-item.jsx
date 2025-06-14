"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { DownloadingState } from './states/downloading-state';
import { useDownloadingProgressMessage, useDownloadingDoneMessage } from '../protocol/hooks';

export function FileListItem({ index, item, selectedFile, setSelectedFile, checked, onCheckChanged }) {
  const [dlState, setDlState] = useState(null);
  const [itemStatus, setItemStatus] = useState(item.status);

  const [isChecked, setIsChecked] = useState(checked);

  // Methods

  const handleProgressMessage = useCallback(
    function(message) {
      if (message.payload.id === item.id) {
        setDlState((prev) => {
          var newState = prev.clone();
          newState.uuid = message.header.uuid;
          newState.percentage = message.payload.percentage;
          
          return newState;
        });
      }
    },
    []
  );
  
  const handleDoneMessage = useCallback(
    function(message) {
      if (message.payload.id === item.id) {
        setItemStatus("f");
        setDlState(null);
      }
    },
    []
  );

  // Effects

  useEffect(() => {setIsChecked(checked)}, [checked]);

  // Message hooks

  useDownloadingProgressMessage(handleProgressMessage);
  useDownloadingDoneMessage(handleDoneMessage);

  // Rendering

  if (itemStatus === "d" && dlState === null) {
    var newState = new DownloadingState();
    newState.percentage = 0;
    setDlState(newState);
  }

  const isSelected = selectedFile === item.id;

  if (dlState !== null) {
    var percentageValue = dlState.percentage.toFixed(0);
    if (percentageValue == 100) {
      percentageValue = 99;
    }
    const percentage = percentageValue + "%";

    return (
      <>
        <li>
          <div className={'file-list-item' + (isSelected ? " selected" : "")} key={index} onClick={() => setSelectedFile(item.id)}>
            <div className="progress-animation">
            </div>

            <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  onCheckChanged(item.id, e.target.checked);
                  setIsChecked(e.target.checked);
                }}
              />
              <span className="checkmark"></span>
            </label>

            <div>{item.id}</div>
            <div>{percentage}</div>
            <div>{item.source}</div>
            <div>{itemStatus}</div>
            <div>{item.addedAt}</div>
          </div>
        </li>
      </>
    );
  }

  return (
    <>
      <li>
        <div className={'file-list-item' + (isSelected ? " selected" : "")} key={index} onClick={() => setSelectedFile(item.id)}>
          <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                onCheckChanged(item.id, e.target.checked);
                setIsChecked(e.target.checked);
              }}
            />
            <span className="checkmark"></span>
          </label>

          <div>{item.id}</div>
          <div>{item.source}</div>
          <div>{itemStatus}</div>
          <div>{item.addedAt}</div>
        </div>
      </li>
    </>
  );
}