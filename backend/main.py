from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any
import secrets

from .game_engine import (
    create_game,
    place_ship_for_player,
    make_move,
    serialize_state,
    randomize_board,
)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateGameResponse(BaseModel):
    gameId: str
    playerId: str
    state: Dict[str, Any]


class JoinGameRequest(BaseModel):
    gameId: str


class JoinGameResponse(BaseModel):
    playerId: str
    state: Dict[str, Any]


class Placement(BaseModel):
    row: int
    col: int
    direction: str
    length: int


class PlaceShipsRequest(BaseModel):
    playerId: str
    placements: List[Placement]


class MoveRequest(BaseModel):
    playerId: str
    row: int
    col: int


class MoveResult(BaseModel):
    hit: bool
    sunk: bool
    switch_turn: bool
    state: Dict[str, Any]


class GameWrapper:
    def __init__(self, game, player1_token: str):
        self.game = game
        self.player_tokens: Dict[str, int] = {player1_token: 0}


games: Dict[str, GameWrapper] = {}


def _generate_code(length: int = 4) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _get_game(game_id: str) -> GameWrapper:
    wrapper = games.get(game_id)
    if not wrapper:
        raise HTTPException(status_code=404, detail="Game not found")
    return wrapper


def _get_player_index(wrapper: GameWrapper, player_id: str) -> int:
    if player_id not in wrapper.player_tokens:
        raise HTTPException(status_code=403, detail="Unknown player")
    return wrapper.player_tokens[player_id]


@app.post("/games", response_model=CreateGameResponse)
def create_game_endpoint() -> CreateGameResponse:
    game = create_game()
    game_id = _generate_code()
    player_id = secrets.token_hex(8)
    games[game_id] = GameWrapper(game, player_id)

    # For now, randomize opponent board; player 0 will place ships via API later
    randomize_board(game.players[1].board)

    state = serialize_state(game, viewer_index=0)
    return CreateGameResponse(gameId=game_id, playerId=player_id, state=state)


@app.post("/games/join", response_model=JoinGameResponse)
def join_game_endpoint(payload: JoinGameRequest) -> JoinGameResponse:
    wrapper = _get_game(payload.gameId)
    if len(wrapper.player_tokens) >= 2:
        raise HTTPException(status_code=400, detail="Game already has two players")

    player_id = secrets.token_hex(8)
    wrapper.player_tokens[player_id] = 1
    state = serialize_state(wrapper.game, viewer_index=1)
    return JoinGameResponse(playerId=player_id, state=state)


@app.post("/games/{game_id}/place")
def place_ships_endpoint(game_id: str, payload: PlaceShipsRequest):
    wrapper = _get_game(game_id)
    player_index = _get_player_index(wrapper, payload.playerId)

    for placement in payload.placements:
        try:
            place_ship_for_player(
                wrapper.game,
                player_index=player_index,
                row=placement.row,
                col=placement.col,
                direction=placement.direction,
                length=placement.length,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return serialize_state(wrapper.game, viewer_index=player_index)


@app.post("/games/{game_id}/move", response_model=MoveResult)
def move_endpoint(game_id: str, payload: MoveRequest) -> MoveResult:
    wrapper = _get_game(game_id)
    player_index = _get_player_index(wrapper, payload.playerId)

    if wrapper.game.current_player != player_index:
        raise HTTPException(status_code=400, detail="Not your turn")

    try:
        result = make_move(
            wrapper.game,
            player_index=player_index,
            row=payload.row,
            col=payload.col,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    state = serialize_state(wrapper.game, viewer_index=player_index)
    return MoveResult(
        hit=bool(result["hit"]),
        sunk=bool(result["sunk"]),
        switch_turn=bool(result["switch_turn"]),
        state=state,
    )


@app.get("/games/{game_id}/state")
def get_state_endpoint(game_id: str, playerId: str):
    wrapper = _get_game(game_id)
    player_index = _get_player_index(wrapper, playerId)
    return serialize_state(wrapper.game, viewer_index=player_index)



