import fs from "fs";

const jsonGamers = '../db/gamers.json'

class Filesystem {

  constructor() {
    if (!Filesystem.instance) {
      this.initialize();
    }
  }
  initialize() {}

  getGamers() {
    try {
      let data = fs.readFileSync(jsonGamers);
      return JSON.parse(data);
    } catch (err) {
      console.log(err);
    }
  }

  setGamers(nickname) {
    try {
      let data = JSON.parse(fs.readFileSync(jsonGamers));
      data.gamers.push(nickname)
      fs.writeFileSync(jsonGamers, JSON.stringify(data));
    } catch (err) {
      console.log(err);
    }
  }

  clearGamers(nickname) {
    try {
      let data = JSON.parse(fs.readFileSync(jsonGamers));
      data.gamers = [];
      fs.writeFileSync(jsonGamers, JSON.stringify(data));
    } catch (err) {
      console.log(err);
    }
  }
}

const instance = new Filesystem();
Object.freeze(instance);

export default instance;
