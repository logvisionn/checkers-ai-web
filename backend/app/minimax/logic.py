from typing import Tuple, Optional
from .board import Board, Move

def minimax(board: Board,
            depth: int,
            maximizing: bool,
            alpha: int,
            beta: int) -> Tuple[int, Optional[Move]]:
    """
    Returns (best_score, best_move).
    maximizing=True means player 1’s turn, False means player -1.
    """
    # terminal or depth-0
    if depth == 0 or board.is_game_over():
        return board.evaluate(), None

    player = 1 if maximizing else -1
    best_move: Optional[Move] = None

    if maximizing:
        max_eval = float('-inf')
        for move in board.get_valid_moves(player):
            b2 = Board()
            b2.state = [row[:] for row in board.state]
            b2.apply_move(move)
            eval_score, _ = minimax(b2, depth-1, False, alpha, beta)
            if eval_score > max_eval:
                max_eval, best_move = eval_score, move
            alpha = max(alpha, eval_score)
            if beta <= alpha:
                break  # β-cutoff
        return max_eval, best_move

    else:
        min_eval = float('inf')
        for move in board.get_valid_moves(player):
            b2 = Board()
            b2.state = [row[:] for row in board.state]
            b2.apply_move(move)
            eval_score, _ = minimax(b2, depth-1, True, alpha, beta)
            if eval_score < min_eval:
                min_eval, best_move = eval_score, move
            beta = min(beta, eval_score)
            if beta <= alpha:
                break  # α-cutoff
        return min_eval, best_move