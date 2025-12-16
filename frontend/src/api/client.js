const BASE_URL = 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = await response.json()
      if (data && data.detail) {
        message = data.detail
      }
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function createGame() {
  return request('/games', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function joinGame(gameId) {
  return request('/games/join', {
    method: 'POST',
    body: JSON.stringify({ gameId }),
  })
}

export async function placeShips(gameId, playerId, placements) {
  return request(`/games/${gameId}/place`, {
    method: 'POST',
    body: JSON.stringify({ playerId, placements }),
  })
}

export async function makeMove(gameId, playerId, row, col) {
  return request(`/games/${gameId}/move`, {
    method: 'POST',
    body: JSON.stringify({ playerId, row, col }),
  })
}

export async function fetchState(gameId, playerId) {
  return request(`/games/${gameId}/state?playerId=${encodeURIComponent(playerId)}`)
}


