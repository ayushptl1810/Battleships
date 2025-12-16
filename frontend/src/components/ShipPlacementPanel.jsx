import React from "react";
import BoardGrid from "./BoardGrid.jsx";

const DEFAULT_SHIPS = [2, 3, 3, 4, 5];
const BOARD_SIZE = 10;

function createEmptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill("empty"));
}

function canPlaceShip(board, row, col, direction, length) {
  const size = board.length;
  if (direction === "H") {
    if (col + length > size) {
      return false;
    }
  } else {
    if (row + length > size) {
      return false;
    }
  }

  const cells = [];
  for (let i = 0; i < length; i += 1) {
    const r = direction === "H" ? row : row + i;
    const c = direction === "H" ? col + i : col;
    if (board[r][c] !== "empty") {
      return false;
    }
    cells.push([r, c]);
  }

  // Disallow touching ships: check all neighbors of each ship cell
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 0],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [r, c] of cells) {
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
        continue;
      }
      // Allow own cells, but disallow touching any other ship cell
      if (
        board[nr][nc] === "ship" &&
        !cells.some(([cr, cc]) => cr === nr && cc === nc)
      ) {
        return false;
      }
    }
  }

  return true;
}

function applyShip(board, row, col, direction, length) {
  const clone = board.map((r) => r.slice());
  for (let i = 0; i < length; i += 1) {
    const r = direction === "H" ? row : row + i;
    const c = direction === "H" ? col + i : col;
    clone[r][c] = "ship";
  }
  return clone;
}

function ShipPlacementPanel({ onComplete }) {
  const [board, setBoard] = React.useState(() => createEmptyBoard(BOARD_SIZE));
  const [shipsToPlace, setShipsToPlace] = React.useState(DEFAULT_SHIPS);
  const [selectedLength, setSelectedLength] = React.useState(DEFAULT_SHIPS[0]);
  const [orientation, setOrientation] = React.useState("H"); // H or V
  const [message, setMessage] = React.useState(
    "Select a ship, choose orientation, then click on the grid."
  );
  const [placements, setPlacements] = React.useState([]);

  const handleCellClick = (row, col) => {
    if (!shipsToPlace.length) {
      return;
    }
    const length = selectedLength;
    const direction = orientation;

    if (!canPlaceShip(board, row, col, direction, length)) {
      setMessage(
        "Cannot place ship there. It overlaps, touches another ship, or is out of bounds."
      );
      return;
    }

    const nextBoard = applyShip(board, row, col, direction, length);
    const index = shipsToPlace.indexOf(length);
    const nextShips = shipsToPlace.slice();
    if (index >= 0) {
      nextShips.splice(index, 1);
    }

    const nextPlacements = placements.concat([{ row, col, direction, length }]);

    setBoard(nextBoard);
    setShipsToPlace(nextShips);
    setPlacements(nextPlacements);
    setMessage(
      `Placed ship of length ${length}. ${
        nextShips.length ? "Place the next ship." : "All ships placed."
      }`
    );

    if (!nextShips.length && onComplete) {
      onComplete({ board: nextBoard, placements: nextPlacements });
    } else if (nextShips.length) {
      setSelectedLength(nextShips[0]);
    }
  };

  const handleReset = () => {
    setBoard(createEmptyBoard(BOARD_SIZE));
    setShipsToPlace(DEFAULT_SHIPS);
    setSelectedLength(DEFAULT_SHIPS[0]);
    setOrientation("H");
    setPlacements([]);
    setMessage("Select a ship, choose orientation, then click on the grid.");
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs text-green-500 uppercase tracking-widest mb-1">
              Fleet
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_SHIPS.map((length, index) => {
                const remainingCount = shipsToPlace.filter(
                  (s) => s === length
                ).length;
                if (!remainingCount && !shipsToPlace.includes(length)) {
                  return null;
                }
                const isSelected = selectedLength === length;
                const disabled = !shipsToPlace.includes(length);
                return (
                  <button
                    key={`${length}-${index}`}
                    type="button"
                    disabled={disabled}
                    className={[
                      "px-3 py-1 border text-xs uppercase tracking-widest",
                      "transition-colors",
                      disabled
                        ? "border-green-900 text-green-900 cursor-not-allowed"
                        : isSelected
                        ? "border-green-400 bg-green-500/20 text-green-300"
                        : "border-green-700 text-green-400 hover:border-green-400",
                    ].join(" ")}
                    onClick={() => {
                      if (!disabled) {
                        setSelectedLength(length);
                      }
                    }}
                  >
                    L{length} x{remainingCount}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 items-start">
            <p className="text-xs text-green-500 uppercase tracking-widest">
              Orientation
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={[
                  "px-3 py-1 border text-xs uppercase tracking-widest",
                  orientation === "H"
                    ? "border-green-400 bg-green-500/20 text-green-300"
                    : "border-green-700 text-green-400 hover:border-green-400",
                ].join(" ")}
                onClick={() => setOrientation("H")}
              >
                Horizontal
              </button>
              <button
                type="button"
                className={[
                  "px-3 py-1 border text-xs uppercase tracking-widest",
                  orientation === "V"
                    ? "border-green-400 bg-green-500/20 text-green-300"
                    : "border-green-700 text-green-400 hover:border-green-400",
                ].join(" ")}
                onClick={() => setOrientation("V")}
              >
                Vertical
              </button>
            </div>
            <button
              type="button"
              className="retro-button md:ml-4 mt-2 md:mt-0"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="w-full max-w-xs sm:max-w-sm">
          <BoardGrid
            board={board}
            onCellClick={handleCellClick}
            label="Placement Grid"
            interactive
          />
        </div>
        <p className="text-xs text-green-400 mt-1 text-center">{message}</p>
      </div>
    </>
  );
}

export default ShipPlacementPanel;
