"use strict"

import * as React from 'react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { WebSocketContext } from './websocket-context';

import { NavigationBar } from './components/navigation-bar.jsx';
import { Footer } from './components/footer.jsx';

import { FilesView } from './components/files-view.jsx';
import { SettingsView } from './components/settings-view.jsx';

import { useWebSocketHandler } from './protocol/hooks';

import { views, useNavigation } from './navigation.js';

function Application() {
  const { send } = useWebSocketHandler();
  const { view, setView } = useNavigation();

  return <WebSocketContext.Provider value={{ send }}>
    <div className='app'>
      <NavigationBar view={view} setView={setView}/>
      {view === views.Files && (<FilesView/>)}
      {view === views.Settings && (<SettingsView/>)}
      <Footer/>
    </div>
  </WebSocketContext.Provider>
}

const root = createRoot(document.body)
root.render(<Application />)
