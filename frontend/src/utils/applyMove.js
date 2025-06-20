export function applyMove(board, from, to) {
  const [r0, c0] = from;
  const [r1, c1] = to;
  const dr = Math.sign(r1 - r0);
  const dc = Math.sign(c1 - c0);

  // Deep-clone the board
  const newBoard = board.map(row => [...row]);

  // Pick up the moving piece
  let piece = newBoard[r0][c0];
  newBoard[r0][c0] = 0;

  // If this was a capture (jump of more than one square), remove the jumped piece
  if (Math.abs(r1 - r0) > 1 || Math.abs(c1 - c0) > 1) {
    let rr = r0 + dr;
    let cc = c0 + dc;
    while (rr !== r1 || cc !== c1) {
      if (newBoard[rr][cc] !== 0) {
        newBoard[rr][cc] = 0;
        break;
      }
      rr += dr;
      cc += dc;
    }
  }

  // Crown promotion: man reaching the far end
  if (piece === 1 && r1 === 0) {
    piece = 2;
  } else if (piece === -1 && r1 === 7) {
    piece = -2;
  }

  // Place the piece at its destination
  newBoard[r1][c1] = piece;
  return newBoard;
}