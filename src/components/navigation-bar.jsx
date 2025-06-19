"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { views } from '../hooks/use-navigation.js';

export function NavigationBar({ view, setView }) {
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
