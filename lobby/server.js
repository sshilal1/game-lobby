var express = require("express");
var app = express();
var expressWs = require("express-ws")(app);
var bodyParser = require("body-parser");
const RedisStore = require("./redis-store");

app.use(function(req, res, next) {
  // insert middleware here, as you see
  // it adds the "testing" part to the req
  console.log("middleware");
  req.testing = "testing";
  return next();
});

app.use(bodyParser.json());

const store = new RedisStore({
  host: "127.0.0.1",
  port: "6379"
});

// - [X] Create Room
// - [ ] Join Room
// - [ ] Leave Room
// - [ ] Change Position
// - [X] Get Rooms
// - [ ] Start Game

app.get("/rooms", async function(req, res, next) {
  console.log("Getting rooms...");
  const rooms = await store.getAllRooms();
  res.send(rooms);
});

app.post("/rooms/create", async function(req, res, next) {
  const { player } = req.body;
  console.log("Creating new room with player", player);
  await store.addRoom(player);
  const rooms = await store.getAllRooms();
  res.send(rooms);
});

app.post("/rooms/join/:roomId", async function(req, res, next) {
  const { roomId } = req.params;
  const { player, position } = req.body;

  await store.joinRoom(roomId, position, player);
  const rooms = await store.getAllRooms().catch(err => {
    console.log("hey an err", err);
    res.send({ message: "Error joining room", err });
  });
  res.send(rooms);
});

app.get("/", function(req, res, next) {
  console.log("get route", req.testing);
  res.send("Hello, homepage!");
  //   res.end();
});

app.ws("/", function(ws, req) {
  ws.on("message", function(msg) {
    console.log(msg);
    ws.send(msg + " woah!");
  });
  console.log("socket", req.testing);
});

app.listen(3000);
