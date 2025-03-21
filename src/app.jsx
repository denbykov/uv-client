"use strict"

import * as React from 'react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function Square({ value, onClick }) {
  return (
     <button 
      className="square"
      onClick={onClick}>
      {value}
    </button>
    );
}

function Board({ squares, onSquareClick }) {
  return (
    <>
    <div className="board-row">
      <Square value={squares[0]} onClick={() => onSquareClick(0)} />
      <Square value={squares[1]} onClick={() => onSquareClick(1)} />
      <Square value={squares[2]} onClick={() => onSquareClick(2)} />
    </div>
    <div className="board-row">
      <Square value={squares[3]} onClick={() => onSquareClick(3)} />
      <Square value={squares[4]} onClick={() => onSquareClick(4)} />
      <Square value={squares[5]} onClick={() => onSquareClick(5)} />
    </div>
    <div className="board-row">
      <Square value={squares[6]} onClick={() => onSquareClick(6)} />
      <Square value={squares[7]} onClick={() => onSquareClick(7)} />
      <Square value={squares[8]} onClick={() => onSquareClick(8)} />
    </div>
    </>
  );
}

function findWinner(squares) {
  const axisSize = 3

  let i
  // check - axis
  i = 0
  if (squares[i] == squares[i + 1] && squares[i + 1] == squares[i + 2]) {
    return squares[i]
  }

  // check | axis
  i = 1
  if (squares[i] == squares[i + axisSize] && squares[i + axisSize] == squares[i + axisSize * 2]) {
    return squares[i]
  }

  // check \ axis
  i = 0
  if (squares[i] == squares[i + axisSize + 1] && squares[i + axisSize + 1] == squares[i + (axisSize + 1) * 2]) {
    return squares[i]
  }

  // check / axis
  i = 2
  if (squares[i] == squares[i + axisSize - 1] && squares[i + axisSize - 1] == squares[i + (axisSize - 1) * 2]) {
    return squares[i]
  }

  return null
}

function Game() {
  const [history, setHistory] = useState(Array(0))
  const [squares, setSquares] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState(0)

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState()

  const nextPlayer = turn % 2 ? "O" : "X"

  function onSquareClick(index) {
    if (gameOver) {
      return
    }

    const newSquares = squares.slice()
    newSquares[index] = nextPlayer
    setSquares(newSquares)

    let newWinner = findWinner(squares)
    if (!!newWinner) {
      setWinner(winner)
      setGameOver(true)
      return
    }

    if (turn == 8) {
      setGameOver(true)
      return
    }

    setTurn(turn + 1)
  }

  function calculateStatus() {
    if (gameOver) {
      return !!winner ? "Game over!" : winner
    }

    return `Next player: ${nextPlayer}`
  }

  return (
  <>
  <div className="status">{calculateStatus()}</div>
  <Board squares={squares} onSquareClick={onSquareClick} />
  </> 
  );
}

const root = createRoot(document.body)
root.render(<Game />)
