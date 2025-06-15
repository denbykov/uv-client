"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { views } from '../navigation.js';

export function NavigationBar({ view, setView }) {
  // Methods

  // const handleMessage = useCallback(
  //   function(message) {
  //     if (message.header.uuid === state.uuid) {
  //       setState((prev) => {
  //         var newState = prev.clone();

  //         newState.fill(message.payload);
  //         return newState;
  //       });
  //     }
  //   },
  //   [state]
  // );

  // Effects

  // useEffect(() => loadFile(), [selectedFile]);

  // Message hooks

  // useGetFileResponseMessage(handleMessage);

  // Rendering

  const selectView = useCallback(
    function(view) {

    },
    []
  );

  return (
    <>
      <div className='navigation-bar'>
        <button 
          className={"button " + (view === views.Files ? "pressed" : "")} 
          onClick={() => setView(views.Files)}>Files
        </button>
        <button 
          className={"button " + (view === views.Settings ? "pressed" : "")} 
          onClick={() => setView(views.Settings)}>Settings
        </button>
      </div>
    </>
  );
}
