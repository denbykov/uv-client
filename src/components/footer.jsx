"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

export function Footer({ }) {
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
      <div className='footer'>
      </div>
    </>
  );
}
