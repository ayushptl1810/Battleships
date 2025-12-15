import random
from typing import List, Dict, Any, Tuple

from .Battleships import Game, Board


SHIP_LENGTHS = [2, 3, 3, 4, 5]


def create_game() -> Game:
    return Game()


def place_ship_for_player(
    game: Game,
    player_index: int,
    row: int,
    col: int,
    direction: str,
    length: int,
) -> None:
    player = game.players[player_index]
    if length not in game.ship_length_list:
        raise ValueError("Invalid ship length")

    # Map short directions to engine directions
    if direction == "H":
        engine_direction = "Horizontal"
    elif direction == "V":
        engine_direction = "Vertical"
    else:
        raise ValueError("Invalid direction")

    if not player.board.check_ship_placement(row, col, engine_direction, length):
        raise ValueError("Cannot place ship there")

    player.board.place_ship(row, col, engine_direction, length)


def randomize_board(board: Board) -> None:
    for length in SHIP_LENGTHS:
        placed = False
        while not placed:
            direction = random.choice(["Horizontal", "Vertical"])
            if direction == "Horizontal":
                start_row = random.randint(0, board.size - 1)
                start_col = random.randint(0, board.size - length)
            else:
                start_row = random.randint(0, board.size - length)
                start_col = random.randint(0, board.size - 1)

            if board.check_ship_placement(start_row, start_col, direction, length):
                board.place_ship(start_row, start_col, direction, length)
                placed = True


def make_move(
    game: Game,
    player_index: int,
    row: int,
    col: int,
) -> Dict[str, Any]:
    player = game.players[player_index]
    opponent = game.players[1 - player_index]
    marker = "1" if player_index == 0 else "2"

    if (row + 1, col + 1) in player.moves:
        raise ValueError("Already fired at this target")

    if not (0 <= row < opponent.board.size and 0 <= col < opponent.board.size):
        raise ValueError("Target out of bounds")

    player.moves.append((row + 1, col + 1))

    hit = opponent.board.hit(row, col)
    result: Dict[str, Any] = {
        "hit": hit,
        "sunk": False,
        "switch_turn": False,
    }

    if hit:
        player.points += 1
        player.tracking_board.matrix[row, col] = f"X{marker}"
        if opponent.board.check_sunk(player.tracking_board.matrix, row, col):
            if opponent.ships_remaining:
                opponent.ships_remaining.pop()
            result["sunk"] = True
    else:
        player.tracking_board.matrix[row, col] = f"O{marker}"
        game.current_player = 1 - game.current_player
        result["switch_turn"] = True

    return result


def _serialize_board(board: Board, hide_ships: bool) -> List[List[str]]:
    size = board.size
    out: List[List[str]] = []
    for r in range(size):
        row_values: List[str] = []
        for c in range(size):
            cell = board.matrix[r, c]
            if cell in ("SH", "SV"):
                row_values.append("ship" if not hide_ships else "unknown")
            else:
                row_values.append("water")
        out.append(row_values)
    return out


def _serialize_tracking(matrix) -> List[List[str]]:
    size = matrix.shape[0]
    out: List[List[str]] = []
    for r in range(size):
        row_values: List[str] = []
        for c in range(size):
            cell = matrix[r, c]
            if isinstance(cell, str) and cell.startswith("X"):
                row_values.append("hit")
            elif isinstance(cell, str) and cell.startswith("O"):
                row_values.append("miss")
            else:
                row_values.append("unknown")
        out.append(row_values)
    return out


def serialize_state(game: Game, viewer_index: int) -> Dict[str, Any]:
    viewer = game.players[viewer_index]
    opponent = game.players[1 - viewer_index]

    return {
        "currentPlayer": game.current_player,
        "players": [
            {
                "name": game.players[0].name,
                "points": game.players[0].points,
                "shipsRemaining": len(game.players[0].ships_remaining),
            },
            {
                "name": game.players[1].name,
                "points": game.players[1].points,
                "shipsRemaining": len(game.players[1].ships_remaining),
            },
        ],
        "viewerIndex": viewer_index,
        "boards": {
            "own": _serialize_board(viewer.board, hide_ships=False),
            "opponent": _serialize_board(opponent.board, hide_ships=True),
            "tracking": _serialize_tracking(viewer.tracking_board.matrix),
        },
        "status": _compute_status(game),
    }


def _compute_status(game: Game) -> str:
    if not game.players[0].ships_remaining and not game.players[1].ships_remaining:
        return "finished"
    if not game.players[0].ships_remaining or not game.players[1].ships_remaining:
        return "finished"
    return "playing"



