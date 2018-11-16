import fs from "fs";
import json from '../db/gamers.json'

class Filesystem {

  constructor() {
    if (!Filesystem.instance) {
      this.initialize();
    }
  }
  initialize() {}

  getGamers() {
    try {
      let data = fs.readFileSync('db/gamers.json');
      return JSON.parse(data);
    } catch (err) {
      console.log(err);
    }
  }

  setGamers(nickname) {
    try {
      let data = JSON.parse(fs.readFileSync('db/gamers.json'));
      data.gamers.push(nickname)
      fs.writeFileSync('db/gamers.json', JSON.stringify(data));
    } catch (err) {
      console.log(err);
    }
  }

  clearGamers(nickname) {
    try {
      let data = JSON.parse(fs.readFileSync('db/gamers.json'));
      data.gamers = [];
      fs.writeFileSync('db/gamers.json', JSON.stringify(data));
    } catch (err) {
      console.log(err);
    }
  }
}

const instance = new Filesystem();
Object.freeze(instance);

export default instance;
