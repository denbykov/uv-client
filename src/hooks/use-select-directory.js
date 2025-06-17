import { useState } from 'react';

export const views = {
  Files: "Files",
  Settings: "Settings",
};

async function pickDirectory(setDirectory) {
  const dir = await window.electronAPI.selectDirectory();
  if (dir) {
    setDirectory(dir);
  }
}

export function useSelectDirectory() {
  const [selectedDirectory, setDirectory] = useState(null);
  
  var selectDirectory = async function(view) {
    pickDirectory(setDirectory);
  }

  return {selectedDirectory, selectDirectory};
}

