const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()
const convertDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  }
}
const convertDbObjectToResponseObject2 = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
app.get('/players/', async (request, response) => {
  const getplayers = `
    SELECT
      *
    FROM
      player_details;`
  const playersArray = await db.all(getplayers)
  response.send(
    playersArray.map(eachPlayer => convertDbObjectToResponseObject(eachPlayer)),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getplayerQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`
  const player = await db.get(getplayerQuery)
  const result = convertDbObjectToResponseObject(player)
  response.send(result)
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updateplayerQuery = `
    UPDATE
      player_details
    SET
      player_name = '${playerName}';
    WHERE
      player_id = ${playerId};`
  await db.run(updateplayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getmatchQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`
  const match = await db.get(getmatchQuery)
  const result = convertDbObjectToResponseObject2(match)
  response.send(result)
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getplayermatches = `
   SELECT  match_details.match_id, match_details.match, match_details.year
   FROM player_match_score
    NATURAL JOIN match_details
    WHERE player_match_score.player_id = ${playerId};`
  const playermatches = await db.all(getplayermatches)
  response.send(
    playermatches.map(eachPlayer =>
      convertDbObjectToResponseObject2(eachPlayer),
    ),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getmatchplayer = `
    SELECT
      player_details.player_id , player_details.player_name
    FROM
     player_match_score
      NATURAL JOIN player_details
    WHERE
       player_match_score.match_id = ${matchId};`
  const matchplayers = await db.all(getmatchplayer)
  response.send(
    matchplayers.map(eachPlayer => convertDbObjectToResponseObject(eachPlayer)),
  )
})
const convertDbObjectToResponseObject3 = dbObject => {
  return {
    playerId: dbObject.playerId,
    playerName: dbObject.playerName,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  }
}
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const totalscoreplayerquery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM
      player_details
       JOIN player_match_score ON player_match_score.player_id = player_details.player_id
    WHERE
      player_details.player_id = ${playerId};`
  const resultt = await db.get(totalscoreplayerquery)
  const result = convertDbObjectToResponseObject3(resultt)
  response.send(result)
})
module.exports = app
