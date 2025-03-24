"use strict"

import * as React from 'react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function Application() {
  return (
  <>
  <div className="canvas">
    <form method="post" className="url-form">
      <label>Enter URL</label>
      <input name="url"></input>
      <button type="submit">Donwload</button>
    </form>
  </div>
  </> 
  );
}

const root = createRoot(document.body)
root.render(<Application />)
