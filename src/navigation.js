import { useState } from 'react';

export const views = {
  Files: "Files",
  Settings: "Settings",
};

export function useNavigation() {
  const [view, setViewRaw] = useState(views.Files);
  
  var setView = function(view) {
    if (view in views) {
      setViewRaw(view);
    } else {
      console.error(`trying to navigate to invalid view: ${view}`);
    }
  }

  return {view, setView};
}