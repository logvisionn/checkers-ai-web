import React from "react";

export default function Square({
  row, col, children, onClick,
  highlighted, lastMove, possible,
  hintSource, hintDest
}) {
  const isDark = (row + col) % 2 === 1;
  const isLast = lastMove?.some(([r,c]) => r===row && c===col);

  const style = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: possible ? "pointer" : "default",
    backgroundColor: isLast
      ? "#f0e68c"
      : highlighted
      ? "#add8e6"
      : possible
      ? "#ffe680"
      : isDark
      ? "#769656"
      : "#EEEED2",
    boxSizing: "border-box",
  };

  return (
    <div className="square" style={style} onClick={onClick}>
      {children}
      {hintSource && <div className="hint-dot source" />}
      {hintDest   && <div className="hint-dot dest"   />}
    </div>
  );
}
