import React from 'react'

const CELL_DISPLAY = {
  empty: { char: '~', classes: 'text-green-800' },
  ship: { char: '■', classes: 'text-green-400' },
  hit: { char: 'X', classes: 'text-red-400' },
  miss: { char: '•', classes: 'text-green-700' },
}

function BoardGrid({ board, onCellClick, label, interactive }) {
  const size = board.length

  const handleClick = (rowIndex, colIndex) => {
    if (!interactive || !onCellClick) {
      return
    }
    onCellClick(rowIndex, colIndex)
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-xs text-green-500 uppercase tracking-widest">{label}</p>
      )}
      <div
        className="grid gap-[2px] bg-green-950/60 p-1 retro-border"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`
            const cellState = CELL_DISPLAY[cell] ?? CELL_DISPLAY.empty
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleClick(rowIndex, colIndex)}
                className={[
                  'aspect-square flex items-center justify-center text-xs sm:text-sm',
                  'bg-black/80 hover:bg-green-950 transition-colors',
                  interactive ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                <span className={cellState.classes}>{cellState.char}</span>
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}

export default BoardGrid


