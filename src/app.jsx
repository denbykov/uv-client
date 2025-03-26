"use strict"

import * as React from 'react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function Application() {
  function download(formData) {
    const url = formData.get("url");
    alert(`You tried to download file from url: '${url}'`);
  }

  return (
  <>
  <div className="canvas">
    <form action={download} className="url-form">
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
