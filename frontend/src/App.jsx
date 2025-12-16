import React from 'react'
import './App.css'
import ShipPlacementPanel from './components/ShipPlacementPanel.jsx'
import BoardGrid from './components/BoardGrid.jsx'
import { createGame, joinGame, placeShips, makeMove, fetchState } from './api/client.js'

function App() {
  const screens = {
    home: 'home',
    lobby: 'lobby',
    placing: 'placing',
    playing: 'playing',
    finished: 'finished',
  }

  const [currentScreen, setCurrentScreen] = React.useState(screens.home)
  const [gameId, setGameId] = React.useState('')
  const [playerId, setPlayerId] = React.useState('')
  const [joinCodeInput, setJoinCodeInput] = React.useState('')
  const [statusMessage, setStatusMessage] = React.useState('')
  const [playerBoard, setPlayerBoard] = React.useState(null)
  const [trackingBoard, setTrackingBoard] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleCreateGame = () => {
    setIsLoading(true)
    setError('')
    createGame()
      .then((data) => {
        setGameId(data.gameId)
        setPlayerId(data.playerId)
        setStatusMessage('Share this code with Player 2 to join your game.')
        setCurrentScreen(screens.lobby)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }

  const handleJoinGame = (e) => {
    e.preventDefault()
    if (!joinCodeInput.trim()) {
      return
    }
    setIsLoading(true)
    setError('')
    joinGame(joinCodeInput.trim().toUpperCase())
      .then((data) => {
        setGameId(joinCodeInput.trim().toUpperCase())
        setPlayerId(data.playerId)
        setStatusMessage('Joined game. Place your ships.')
        setCurrentScreen(screens.placing)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }

  const renderHome = () => (
    <div className="flex flex-col gap-6 items-center">
      <h1 className="retro-heading text-2xl">Retro Battleships</h1>
      <p className="text-xs text-green-500 uppercase tracking-widest">
        Two Player · Online · Terminal Vibes
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <button className="retro-button" onClick={handleCreateGame}>
          Create Game
        </button>
        <form onSubmit={handleJoinGame} className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            className="retro-input"
            placeholder="Enter game code"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
          />
          <button type="submit" className="retro-button">
            Join Game
          </button>
        </form>
      </div>
    </div>
  )

  const renderLobby = () => (
    <div className="flex flex-col gap-4 items-center">
      <h2 className="retro-heading">Lobby</h2>
      <div className="retro-border px-4 py-3 bg-black/80">
        <p className="text-xs text-green-500 mb-1">Game code</p>
        <p className="text-2xl tracking-[0.3em]">{gameId}</p>
      </div>
      <p className="text-xs text-green-400 text-center max-w-md">{statusMessage}</p>
      <button
        className="retro-button mt-2"
        onClick={() => setCurrentScreen(screens.placing)}
      >
        Continue to Ship Placement
      </button>
    </div>
  )

  const handlePlacementComplete = ({ board }) => {
    if (!gameId || !playerId) {
      setPlayerBoard(board)
      setStatusMessage('Fleet locked in locally.')
      setCurrentScreen(screens.playing)
      return
    }

    setIsLoading(true)
    setError('')
    const placements = [] // frontend board already enforces placement; backend will accept full layouts later
    placeShips(gameId, playerId, placements)
      .then((state) => {
        setPlayerBoard(board)
        setTrackingBoard(state.boards?.tracking ?? null)
        setStatusMessage('Fleet locked in. Waiting for battle.')
        setCurrentScreen(screens.playing)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }

  const renderPlacing = () => (
    <div className="flex flex-col gap-4">
      <h2 className="retro-heading">Ship Placement</h2>
      <p className="text-xs text-green-400">
        Place your fleet on the grid. This will later sync with the backend for online play.
      </p>
      <ShipPlacementPanel onComplete={handlePlacementComplete} />
    </div>
  )

  const renderPlaying = () => (
    <div className="flex flex-col gap-4">
      <h2 className="retro-heading">Battle</h2>
      <p className="text-xs text-green-400">
        Take turns firing shots. This screen will later show two boards and live updates.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="retro-border p-3 min-h-[200px]">
          <p className="text-xs text-green-500 mb-2">Your Board</p>
          {playerBoard ? (
            <BoardGrid board={playerBoard} interactive={false} />
          ) : (
            <div className="h-full flex items-center justify-center text-green-700 text-xs">
              Place your ships first to see your board.
            </div>
          )}
        </div>
        <div className="retro-border p-3 min-h-[200px]">
          <p className="text-xs text-green-500 mb-2">Targeting Board</p>
          {trackingBoard ? (
            <BoardGrid board={trackingBoard} interactive={false} />
          ) : (
            <div className="h-full flex items-center justify-center text-green-700 text-xs">
              Targeting UI will appear here once backend integration is complete.
            </div>
          )}
        </div>
      </div>
      <div className="retro-border p-3 mt-2 text-xs text-green-400 bg-black/80">
        <p className="mb-1">Log</p>
        {error && <p className="text-red-500 mb-1">Error: {error}</p>}
        {isLoading && <p className="text-green-500">Working...</p>}
        {!error && !isLoading && (
          <p className="text-green-700">No events yet. Fire a shot to begin.</p>
        )}
      </div>
    </div>
  )

  let content = null
  if (currentScreen === screens.home) {
    content = renderHome()
  } else if (currentScreen === screens.lobby) {
    content = renderLobby()
  } else if (currentScreen === screens.placing) {
    content = renderPlacing()
  } else if (currentScreen === screens.playing) {
    content = renderPlaying()
  } else {
    content = renderHome()
  }

  return (
    <div className="crt min-h-screen flex flex-col">
      <div className="scanlines" />
      <div className="relative z-10 flex-1 flex flex-col">
        <header className="retro-border m-4 px-4 py-3 bg-black/80 flex items-center justify-between">
          <div>
            <h1 className="retro-heading">Retro Battleships</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-green-600">
              NetLink Naval Warfare Console
            </p>
          </div>
          <div className="text-[10px] text-green-600 text-right">
            <p>GAME ID: {gameId || '----'}</p>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center px-4 pb-8">
          <div className="retro-border w-full max-w-4xl bg-black/80 p-6 min-h-[420px] flex flex-col justify-between">
            {content}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
