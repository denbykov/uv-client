"use strict"

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';

export function ItemListHeader({ checkedItems, setCheckedItems, deleteItems, setSelectedItem }) {
  const isAnythingChecked = useCallback(
    function() {
      return checkedItems.length > 0;
    },
    [checkedItems]
  );

  const onHeaderCheckChanged = useCallback(
    function() {
      setCheckedItems([]);
    },
    []
  );

  return (
    <>
      <div className="header">
        <div>
          <div>
            Nothing yet
          </div>
          <button className="add-item button" onClick={() => setSelectedItem(null)}>+</button>
        </div>
        <div>
          <div className={"multiaction-container" + (isAnythingChecked() ? "" : " disabled")}>
            <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isAnythingChecked()}
                onChange={onHeaderCheckChanged}
              />
              <span className="checkmark"></span>
            </label>
            <button onClick={deleteItems} className="delete icon-button" aria-label="Delete">
              <FaTrash className="icon" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}