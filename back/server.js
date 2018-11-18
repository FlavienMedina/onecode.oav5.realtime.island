import express from "express";
import socketIo from "socket.io";
import path from "path";
import fs from "fs";
import randomWords from "random-words";

import { createServer } from "http";

import { argv, mlog } from "./libs/utils";
import Filesystem from "./libs/filesystem";

// Instantiate express application
const app = express();
// const gamers = [];

let i = 0;
// Setting the application port depending to environment
const port = parseInt(argv[0], 10) || process.env.PORT;

// Entry point function
const start = async () => {
	try {
		// app is a request handler function that we must pass to http server instance
		const server = createServer(app);

		// socket.io take a server and not an express application
		const io = socketIo(server);

		// ... and finally server listening not the app
		server.listen(port, err => {
			if (err) throw err;

			mlog(`Server is running on port ${port}`);
		});

		io.on("connection", socket => {
			mlog("client connected", "yellow");

			socket.on("disconnect", () => {
				mlog("client disconnected", "yellow");
			});

			socket.on("join", nickname => {
				console.log(`${nickname} has joined the socket`);
				socket.nickname = nickname;

				let data = Filesystem.getGamers();

				let i = data.gamers.length + 1;
				Filesystem.setGamers({ id: i, nickname });
				socket.emit("welcome", "Welcome to the socket gaming platform!");
			});
		});

		let mNumb = io.of("/magicNumber");
		let mNumbScores = { beg: 0, end: 0, players: [] };
		mNumb.on("connection", function(socket) {
			mNumb.emit("welcome", "Welcome in the MagicNumber Room");
			socket.on("join", nickname => {
				socket.nickname = nickname;
				console.log(`${nickname} has joined the MagicNumber Room`);
			});

			socket.on("disconnect", nickname => {
				if(mNumb.nb){
					mNumb.nb--
				}
				mNumb.emit("messageMagic", "Waiting for another player");
				if(mNumb.nb != 2) {
					mNumb.started = false;
				}
				console.log(`${socket.nickname} has leave the quickey Room`);
			});

			socket.on("start", () => {
				mNumb.nb = mNumb.nb || 0;
				mNumb.nb++;
				mNumbScores.players.push({ name: socket.nickname, points: 0 });
				if (mNumb.started) {
					socket.emit(
						"messageMagic",
						"The game is already started wait the end"
					);
				} else if (mNumb.nb == 2) {
					mNumb.started = true;
					// for (var variable in mNumb.server.nsps['/magicNumber'].sockets) {
					// 	console.log(mNumb.server.nsps['/magicNumber'].sockets[variable].nickname);
					// }
					mNumbScores.beg = new Date();
					socket.emit("start", true);
					socket.broadcast.emit("start", true);
					socket.emit(
						"messageMagic",
						"The game is started guess a name between 0 and 1337"
					);
					socket.broadcast.emit(
						"messageMagic",
						"The game is started guess a name between 0 and 1337"
					);
				} else {
					socket.emit("messageMagic", "waiting other player");
				}
				console.log(mNumb.nb);
				console.log(`${socket.nickname} is ready`);
			});

			socket.on("number", nb => {
				socket.round = socket.round || 0;
				let max = 1337;
				let answer = Math.floor(Math.random() * max);
				mNumb.answer = mNumb.answer || answer;
				console.log(mNumb.answer);
				if (nb > mNumb.answer) {
					socket.emit("messageMagic", "Moins");
				} else if (nb < mNumb.answer) {
					socket.emit("messageMagic", "Plus");
				} else if (nb == mNumb.answer) {
					socket.round++;
					let win;
					if (socket.round == 3) {
						let playerIndex = mNumbScores.players.findIndex(
							x => x.name == socket.nickname
						);
						mNumbScores.players[playerIndex].points = socket.round;
						mNumbScores.end = new Date();
						Filesystem.setScores(socket.nsp.name, mNumbScores);
						win = "You win";
					} else {
						let playerIndex = mNumbScores.players.findIndex(
							x => x.name == socket.nickname
						);
						mNumbScores.players[playerIndex].points += 1;
						win = `You win this round, ${3 - socket.round}more win to.... win`;
					}
					const lose = socket.round == 3 ? "You lose" : `You lose this round`;
					socket.emit("messageMagic", win);
					socket.broadcast.emit("messageMagic", lose);
					mNumb.answer = null;
				}
			});
		});

		let quickey = io.of("/quickey");
		let quickeyScores = { beg: 0, end: 0, players: [] };
		quickey.on("connection", function(socket) {
			quickey.emit("welcome", "Welcome in the quickey Room");

			socket.on("join", nickname => {
				socket.nickname = nickname;
				console.log(`${nickname} has joined the quickey Room`);
			});

			socket.on("disconnect", nickname => {
				if(quickey.nb){
					quickey.nb--
				}
				quickey.emit("messageMagic", "Waiting for another player");
				if(quickey.nb != 2) {
					quickey.started = false;
				}
				console.log(`${socket.nickname} has leave the quickey Room`);
			});

			socket.on("start", () => {
				quickey.nb = quickey.nb || 0;
				quickey.nb++;
				quickeyScores.players.push({ name: socket.nickname, points: 0 });

				if (quickey.started) {
					socket.emit(
						"messageMagic",
						"The game is already started wait the end"
					);
				} else if (quickey.nb == 2) {
					quickey.started = true;
					quickeyScores.beg = new Date();

					socket.emit("start", true);
					socket.broadcast.emit("start", true);

					quickey.answer = randomWords();
					socket.emit(
						"messageMagic",
						`The game is to type the word ${quickey.answer} quickly`
					);
					socket.broadcast.emit(
						"messageMagic",
						`The game is to type the word ${quickey.answer} quickly`
					);
				} else {
					socket.emit("messageMagic", "waiting other player");
				}

				console.log(quickey.nb);
				console.log(`${socket.nickname} is ready`);
			});

			socket.on("number", nb => {
				socket.round = socket.round || 0;
				console.log(quickey.answer);
				if (nb > quickey.answer) {
					socket.emit("messageMagic", "typo !");
				} else if (nb == quickey.answer) {
					socket.round++;
					quickey.answer = randomWords();
					let win;
					if (socket.round == 7) {
						let playerIndex = quickeyScores.players.findIndex(
							x => x.name == socket.nickname
						);
						quickeyScores.players[playerIndex].points = socket.round;
						quickeyScores.end = new Date();
						Filesystem.setScores(socket.nsp.name, quickeyScores);
						win = "You win";
					} else {
						let playerIndex = quickeyScores.players.findIndex(
							x => x.name == socket.nickname
						);
						quickeyScores.players[playerIndex].points += 1;
						win = `You win this round, ${7 -
							socket.round} more win to.... win. Here the new key: ${
							quickey.answer
						}`;
					}
					const lose =
						socket.round == 7
							? "You lose"
							: `You lose this round  Here the new key: ${quickey.answer}`;
					socket.emit("messageMagic", win);
					socket.broadcast.emit("messageMagic", lose);
				}
			});
		});
		let fastkey = io.of("/fastkey");
		let fastkeyScores = { beg: 0, end: 0, players: [] };
		fastkey.on("connection", function(socket) {
			fastkey.emit("welcome", "Welcome in the fastkey Room");

			socket.on("join", nickname => {
				socket.nickname = nickname;
				console.log(`${nickname} has joined the fastkey Room`);
			});

			socket.on("disconnect", nickname => {
				if(fastkey.nb){
					fastkey.nb--
				}
				fastkey.emit("messageMagic", "Waiting for another player");
				if(fastkey.nb != 2) {
					fastkey.started = false;
				}
				console.log(`${socket.nickname} has leave the quickey Room`);
			});

			socket.on("start", () => {
				fastkey.nb = fastkey.nb || 0;
				fastkey.nb++;
				fastkeyScores.players.push({ name: socket.nickname, points: 0 });

				if (fastkey.started) {
					socket.emit(
						"messageMagic",
						"The game is already started wait the end"
					);
				} else if (fastkey.nb == 2) {
					fastkeyScores.beg = new Date();
					fastkey.started = true;
					socket.emit("start", true);
					socket.broadcast.emit("start", true);

					fastkey.answer = randomWords();
					socket.emit(
						"messageMagic",
						`The game is to type the word ${fastkey.answer} quickly`
					);
					socket.broadcast.emit(
						"messageMagic",
						`The game is to type the word ${fastkey.answer} quickly`
					);
				} else {
					socket.emit("messageMagic", "waiting other player");
				}
				console.log(fastkey.nb);
				console.log(`${socket.nickname} is ready`);
			});

			socket.on("number", nb => {
				socket.round = socket.round || 0;
				console.log(fastkey.answer);
				if (nb > fastkey.answer) {
					socket.emit("messageMagic", "typo !");
				} else if (nb == fastkey.answer) {
					socket.round++;
					fastkey.answer = randomWords();
					let win;
					if (socket.round == 7) {
						let playerIndex = fastkeyScores.players.findIndex(
							x => x.name == socket.nickname
						);
						fastkeyScores.players[playerIndex].points = socket.round;
						fastkeyScores.end = new Date();
						Filesystem.setScores(socket.nsp.name, fastkeyScores);
						win = "You win";
					} else {
						let playerIndex = fastkeyScores.players.findIndex(
							x => x.name == socket.nickname
						);
						fastkeyScores.players[playerIndex].points += 1;
						win = `You win this round, ${7 -
							socket.round} more win to.... win. Here the new word: ${
							fastkey.answer
						}`;
					}
					const lose =
						socket.round == 7
							? "You lose"
							: `You lose this round  Here the new word to type ${
									fastkey.answer
							  }`;
					socket.emit("messageMagic", win);
					socket.broadcast.emit("messageMagic", lose);
				}
			});
		});

		let hanged = io.of("/hanged");
		let hangedScores = { beg: 0, end: 0, players: [] };
		hanged.on("connection", function(socket) {
			hanged.emit("welcome", "Welcome in the hanged Room");

			socket.on("join", nickname => {
				socket.nickname = nickname;

				console.log(`${nickname} has joined the hanged Room`);
			});

			socket.on("disconnect", nickname => {
				hanged.nb--
				hanged.emit("messageMagic", "Waiting for another player");
				if(hanged.nb != 2) {
					hanged.started = false;
				}
				console.log(`${socket.nickname} has leave the hanged Room`);
			});

			socket.on("start", () => {
				hanged.nb = hanged.nb || 0;
				hanged.nb++;
				hangedScores.players.push({ name: socket.nickname, points: 0 });

				if (hanged.started) {
					socket.emit(
						"messageMagic",
						"The game is already started wait the end"
					);
				} else if (hanged.nb == 2) {
					hanged.started = true;
					hangedScores.beg = new Date();

					socket.emit("start", true);
					socket.broadcast.emit("start", true);

					hanged.answer = randomWords();
					const snake = hanged.answer
						.split("")
						.map(x => "_")
						.join(" ");
					hanged.snake = hanged.answer.split("").map(x => "_");

					socket.emit("messageMagic", `find dat word: ${snake}`);
					socket.broadcast.emit("messageMagic", `find dat word: ${snake}`);
				} else {
					socket.emit("messageMagic", "waiting other player");
				}

				console.log(hanged.nb);
				console.log(`${socket.nickname} is ready`);
			});

			socket.on("number", nb => {
				socket.round = socket.round || 0;
				console.log(hanged.answer);
				const index = getAllIndexes(hanged.answer, nb);
				hanged.snake = hanged.snake.map((x, idx) =>
					index.includes(idx) ? nb : x == "_" ? "_" : x
				);
				const newString = hanged.snake.join(" ");
				socket.emit("messageMagic", newString);
				socket.broadcast.emit("messageMagic", newString);
				if (!hanged.snake.includes("_")) {
					socket.round++;
					hanged.answer = randomWords();
					const snake = hanged.answer
						.split("")
						.map(x => "_")
						.join(" ");
					hanged.snake = hanged.answer.split("").map(x => "_");
					let win;
					if (socket.round == 3) {
						let playerIndex = hangedScores.players.findIndex(
							x => x.name == socket.nickname
						);
						hangedScores.players[playerIndex].points = socket.round;
						hangedScores.end = new Date();
						Filesystem.setScores(socket.nsp.name, hangedScores);
						win = "You win";
					} else {
						let playerIndex = hangedScores.players.findIndex(
							x => x.name == socket.nickname
						);
						hangedScores.players[playerIndex].points += 1;
						win = `You win this round, ${3 -
							socket.round} more win to.... win. Here the new word: ${snake}`;
					}
					const lose =
						socket.round == 3
							? "You lose"
							: `You lose this round  Here the new word: ${snake}`;
					socket.emit("messageMagic", win);
					socket.broadcast.emit("messageMagic", lose);
				}
			});
		});
	} catch (err) {
		mlog(err, "red");
		process.exit(42);
	}
};

function getAllIndexes(arr, val) {
	var indexes = [],
		i;
	for (i = 0; i < arr.length; i++) if (arr[i] === val) indexes.push(i);
	return indexes;
}
// Let's Rock!
start();
