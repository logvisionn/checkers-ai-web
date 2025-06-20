from copy import deepcopy
from enum import IntEnum
from typing import List, Tuple, Set


class Piece(IntEnum):
    EMPTY   = 0
    P1_MAN  = 1
    P1_KING = 2
    P2_MAN  = -1
    P2_KING = -2


Move = List[Tuple[int, int]]


class Board:
    def __init__(self):
        self.state: List[List[Piece]] = [[Piece.EMPTY]*8 for _ in range(8)]
        self.reset()

    def reset(self):
        for r in range(8):
            for c in range(8):
                if (r + c) % 2:
                    if r < 3:
                        self.state[r][c] = Piece.P2_MAN
                    elif r > 4:
                        self.state[r][c] = Piece.P1_MAN
                    else:
                        self.state[r][c] = Piece.EMPTY
        for r in (3, 4):
            for c in range(8):
                self.state[r][c] = Piece.EMPTY

    @staticmethod
    def in_bounds(r: int, c: int) -> bool:
        return 0 <= r < 8 and 0 <= c < 8

    def _crown(self, r: int, piece: Piece) -> Piece:
        if piece == Piece.P1_MAN and r == 0:
            return Piece.P1_KING
        if piece == Piece.P2_MAN and r == 7:
            return Piece.P2_KING
        return piece

    def get_valid_moves(self, player: int) -> List[Move]:
        moves: List[Move] = []
        captures: List[Move] = []
        dirs = [(-1, -1), (-1, 1), (1, -1), (1, 1)]

        def recurse_capture(
            board_obj: "Board",
            r: int,
            c: int,
            path: Move,
            visited: Set[Tuple[int, int, int, int]],
            used: Set[Tuple[int, int]],
        ):
            piece = board_obj.state[r][c]
            king = abs(piece) == 2

            # try every diagonal direction
            for dr, dc in dirs:
                if king:
                    # long-range search for enemy to jump
                    step = 1
                    while True:
                        mr, mc = r + dr*step, c + dc*step
                        if not board_obj.in_bounds(mr, mc):
                            break
                        mid = board_obj.state[mr][mc]
                        if mid.value * player < 0:
                            # once enemy found, try landing squares beyond
                            land = 1
                            while True:
                                tr, tc = mr + dr*land, mc + dc*land
                                if not board_obj.in_bounds(tr, tc):
                                    break
                                if board_obj.state[tr][tc] != Piece.EMPTY:
                                    break
                                if (tr, tc) in used:
                                    land += 1
                                    continue
                                key = (mr, mc, tr, tc)
                                if key not in visited:
                                    b2 = deepcopy(board_obj)
                                    b2._apply_capture((r, c), (mr, mc), (tr, tc), piece)
                                    recurse_capture(
                                        b2,
                                        tr,
                                        tc,
                                        path + [(tr, tc)],
                                        visited | {key},
                                        used    | {(mr, mc)},
                                    )
                                land += 1
                        if mid != Piece.EMPTY:
                            break
                        step += 1
                else:
                    # man: only adjacent jump
                    mr, mc = r + dr, c + dc
                    tr, tc = r + 2*dr, c + 2*dc
                    if (
                        board_obj.in_bounds(mr, mc)
                        and board_obj.in_bounds(tr, tc)
                        and board_obj.state[mr][mc].value * player < 0
                        and board_obj.state[tr][tc] == Piece.EMPTY
                        and (tr, tc) not in used
                    ):
                        key = (mr, mc, tr, tc)
                        if key not in visited:
                            b2 = deepcopy(board_obj)
                            b2._apply_capture((r, c), (mr, mc), (tr, tc), piece)
                            recurse_capture(
                                b2,
                                tr,
                                tc,
                                path + [(tr, tc)],
                                visited | {key},
                                used    | {(mr, mc)},
                            )

            # record any capture path of length > 1
            if len(path) > 1 and path not in captures:
                captures.append(path)

        # generate slides & captures for every piece
        for r in range(8):
            for c in range(8):
                p = self.state[r][c]
                if p.value * player <= 0:
                    continue
                king = abs(p) == 2

                # slides
                if king:
                    # kings glide any distance
                    for dr, dc in dirs:
                        step = 1
                        while True:
                            nr, nc = r + dr*step, c + dc*step
                            if not self.in_bounds(nr, nc) or self.state[nr][nc] != Piece.EMPTY:
                                break
                            moves.append([(r, c), (nr, nc)])
                            step += 1
                else:
                    # men move one forward diagonal
                    for dr, dc in dirs:
                        if dr * player < 0:
                            nr, nc = r + dr, c + dc
                            if self.in_bounds(nr, nc) and self.state[nr][nc] == Piece.EMPTY:
                                moves.append([(r, c), (nr, nc)])

                # captures (mandatory if any exist)
                recurse_capture(self, r, c, [(r, c)], set(), {(r, c)})

        return captures if captures else moves

    def _apply_capture(
        self,
        frm: Tuple[int, int],
        mid: Tuple[int, int],
        to: Tuple[int, int],
        piece: Piece
    ):
        r0, c0 = frm
        r1, c1 = mid
        r2, c2 = to
        self.state[r0][c0] = Piece.EMPTY
        self.state[r1][c1] = Piece.EMPTY
        self.state[r2][c2] = self._crown(r2, piece)

    def apply_move(self, move: Move):
        r0, c0 = move[0]
        piece = self.state[r0][c0]
        self.state[r0][c0] = Piece.EMPTY
        for r, c in move[1:]:
            if abs(r - r0) >= 2:
                self.state[(r + r0)//2][(c + c0)//2] = Piece.EMPTY
            r0, c0 = r, c
        self.state[r0][c0] = self._crown(r0, piece)

    def is_game_over(self) -> bool:
        return not (self.get_valid_moves(1) or self.get_valid_moves(-1))

    def evaluate(self) -> int:
        return sum(int(p) for row in self.state for p in row)