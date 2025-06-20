import React from "react";
import Square from "./Square";
import Piece from "./Piece";

export default function Board({
  board,
  selected,
  lastMove,
  possibleDestinations,
  onSquareClick,
}) {
  return (
    <>
      <div className="board-wrapper">
        <div className="ranks">
          {board.map((_, r) => (
            <div key={r} className="rank-label">
              {8 - r}
            </div>
          ))}
        </div>

        <div className="board-grid">
          {board.map((rowArr, r) =>
            rowArr.map((cell, c) => {
              const isHighlighted =
                selected?.[0] === r && selected?.[1] === c;
              const isPossible = possibleDestinations?.some(
                ([pr, pc]) => pr === r && pc === c
              );
              return (
                <div
                  key={`${r}-${c}`}
                  className="grid-cell-wrapper"
                >
                  <Square
                    row={r}
                    col={c}
                    highlighted={isHighlighted}
                    lastMove={lastMove}
                    possible={isPossible}
                    onClick={() => onSquareClick(r, c)}
                  >
                    <Piece value={cell} />
                  </Square>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="files">
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((f) => (
          <div key={f} className="file-label">
            {f}
          </div>
        ))}
      </div>
    </>
  );
}
