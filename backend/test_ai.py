from app.minimax.board import Board
from app.minimax.logic import minimax

b = Board()
print("Initial score:", b.evaluate())
score, move = minimax(b, depth=3, maximizing=True, alpha=float('-inf'), beta=float('inf'))
print("Best score:", score, "Best move:", move)
