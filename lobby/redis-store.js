const redis = require("redis");
const { promisify } = require("util");
var shortid = require("shortid");

class RedisStore {
  constructor({ host, port }) {
    console.log("Creating redis client.");
    console.log("\t[redis host]", host);
    console.log("\t[redis port]", port);

    this.client = redis.createClient({ host, port });

    this.client.on("error", function(err) {
      console.log("[Redis Error]", err);
      throw err;
    });

    // STANDARD GET/SET ASYNC
    // this.getAsync = promisify(this.client.get).bind(this.client);
    // this.setAsync = promisify(this.client.set).bind(this.client);
    // this.keysAsync = promisify(this.client.keys).bind(this.client);
    // this.delAsync = promisify(this.client.del).bind(this.client);
    this.hGetAsync = promisify(this.client.hget).bind(this.client);
    this.hSetAsync = promisify(this.client.hset).bind(this.client);
    this.hGetAllAsync = promisify(this.client.hgetall).bind(this.client);
  }

  async getAllRooms() {
    const rooms = await this.hGetAllAsync("rooms");
    if (!rooms) {
      return [];
    }
    const formattedRooms = Object.keys(rooms).map(room =>
      JSON.parse(rooms[room])
    );
    console.log("formattedRooms", formattedRooms);
    return formattedRooms;
  }

  async joinRoom(roomId, pos, player) {
    return new Promise((resolve, reject) => {
      console.log(`Attempting to join 'room-${roomId}' at position '${pos}'`);
      let roomToJoin = await this.hGetAsync("rooms", `room-${roomId}`);
      roomToJoin = JSON.parse(roomToJoin);
      console.log("roomToJoin", roomToJoin);
  
      if (roomToJoin.players[`position${pos}`] === null) {
        roomToJoin.players[`position${pos}`] = player;
      } else {
        reject(`Cant join in position '${pos}', already filled`);
      }
  
      return await this.hSetAsync(
        "rooms",
        `room-${roomId}`,
        JSON.stringify(roomToJoin)
      ).catch(err => {
        console.log("Error joining room", err);
      });
    })
    
  }

  async addRoom(player) {
    const roomId = shortid();
    const newRoom = {
      id: roomId,
      players: {
        position1: player,
        position2: null,
        position3: null,
        position4: null
      }
    };

    return await this.hSetAsync(
      "rooms",
      `room-${roomId}`,
      JSON.stringify(newRoom)
    ).catch(err => {
      console.log("Error adding room", err);
    });
  }

  killConnection() {
    this.client.quit();
  }
}

module.exports = RedisStore;
