import express from 'express'
import socketIo from 'socket.io'
import path from 'path'
import fs from 'fs'

import { createServer } from 'http'

import { argv, mlog } from './libs/utils'
import Filesystem from './libs/filesystem'

// Instantiate express application
const app = express()
// const gamers = [];

let i = 0;
// Setting the application port depending to environment
const port = parseInt(argv[0], 10) || process.env.PORT

// Entry point function
const start = async () => {
  try {
    // app is a request handler function that we must pass to http server instance
    const server = createServer(app)

    // socket.io take a server and not an express application
    const io = socketIo(server)

    // ... and finally server listening not the app
    server.listen(port, (err) => {
      if (err) throw err

      mlog(`Server is running on port ${port}`)
    })

    io.on('connection', (socket) => {
      mlog('client connected', 'yellow')

      let gamers = Filesystem.getGamers();
      mlog('List of gamers:', 'cyan');
      mlog(JSON.stringify(gamers), 'cyan');

      socket.on('disconnect', () => {
        mlog('client disconnected', 'yellow')
      })

      socket.on('join', (nickname) => {
        console.log(`${nickname} has joined the socket`)
        socket.nickname = nickname

        let data = Filesystem.getGamers();
        let i = data.gamers.length + 1;

        Filesystem.setGamers({id:i, nickname});
        socket.emit('welcome', 'Welcome to the socket gaming platform!')
      })
    })

    let mNumb = io.of('/magicNumber');
    mNumb.on('connection', function(socket) {
      mNumb.emit('welcome', 'Welcome in the MagicNumber Room');

      socket.on('join', (nickname) => {
        socket.nickname = nickname
        console.log(`${nickname} has joined the MagicNumber Room`)
      })

      socket.on('start', () => {
        mNumb.emit('ready', 'The game is started guess a name between 0 and 1337');
      })

      socket.on('number', (nb) => {
        mNumb.emit('ready', 'The game is started guess a name between 0 and 1337');
          let max = 1337;
          let answer = Math.floor(Math.random() * max)
            if (nb > answer) {
              mNumb.emit('message', 'Moins');
            } else if (nb < answer) {
              mNumb.emit('message', 'Plus');
            } else {
              mNumb.emit('message', 'Your win');
            }
      })
    });

  } catch (err) {
    mlog(err, 'red')
    process.exit(42)
  }
}

// Let's Rock!
start()
