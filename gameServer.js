const express = require('express');
const path = require('path');
const app = express();
const cors= require('cors');
const fs = require('fs');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const maxPlayers = 10;
let numberOfPlayers = 0;

// Middleware to verify existence of given player
function verifyIfExists(req, res, next) {
	const {filename} = req.headers;
	
	fs.readdir(path.join(__dirname, 'players'), (err, files) => {
		if (err) {
			console.log("Unable to read directory:", err);
			res.status(400).json({error: "Unable to read directory: " + err.message});
		}
		else {
			const player = files.find(file => file === filename);

			if (!player) {
				console.log("Unable to find player");
				return res.status(404).json({error: "Unable to find player"});
			}

			req.player = player;
			
			return next();
		}
	})
}

// The restart function can only be used in games against the machine.
app.put('/restart', verifyIfExists, (req, res) => {
	console.log("Received data (file name, host symbol):");
	console.log(req.body);

	const {player} = req;
	const {symbol} = req.body;

	fs.readFile(path.join(__dirname, "players", player), "utf-8", (err, data) => {
		if (err) {
			console.log("Error reading file", err);
			res.status(500).json({error: "Unable to read player's file: " + err.message});
		}
		else {
			const playerObj = JSON.parse(data);
			playerObj.table = "_________";
			// The host is this way always the first player. This must be changed to be random
			playerObj.symbol = symbol;
			playerObj.turn = symbol;
			const playerData = JSON.stringify(playerObj);
			fs.writeFile(path.join(__dirname, "players", player), playerData, err => {
				if (err) {
					console.log("Unable to restart player file:", err);
					res.status(500).json({error: "Unable to restart player file: " + err.message});
				}
				else {
					console.log(player, "restarted");
					res.status(201).send();
				}
			})	
		}
	})
});

app.post('/create', (req, res) => {
	console.log("Received data:");
	console.log(req.body);

	const {name, symbol} = req.body;

	// Change to check JSON files instead
	const fileName = name + '.txt';
	fs.readdir(path.join(__dirname, "players"), (err, files) => {
		if (err) {
			console.log("Unable to scan directory:", err);
			res.status(500).json({error: "Unable to scan directory: " + err.message});
		}
		else {
			if (numberOfPlayers === maxPlayers) {
				console.log("Maximum number of players");
				res.status(403).json({error: "Maximum number of players"});
			}
			// Change to check JSON files instead
			else if (files.includes(fileName)) {
				console.log(name, "already included");
				res.status(200).json({note: "Player already present"});
			}
			else {
				const playerFile = {
					"name": name,
					"symbol": symbol, // Will be deleted when the act of create a player is independent of a game start
					"turn": symbol, // For now, the host is always the first player. This must be changed to be random
					"table": "_________"
				}
				const data = JSON.stringify(playerFile);
				fs.writeFile(path.join(__dirname, "players", name + ".json"), data, err => {
					if (err) {
						console.log("Error at writing new player file:", err);
						res.status(500).json({error: "Error at writing new player file: " + err.message});
					}
					else {
						numberOfPlayers++;
						console.log(name, "created");
						res.status(201).send();
					}
				})	
			}
		}
	});
});

app.delete('/delete', verifyIfExists, (req, res) => {
	const {player} = req;

	console.log("Deleting player:", player);
	namePath = path.join(__dirname, "players", player);
	fs.unlink(namePath, (err) => {
		if (err) {
			console.log("Error deleting player file:", err);
			res.status(500).json({error: "Error deleting player file: " + err.message})
		}
		else {
			if (numberOfPlayers) numberOfPlayers--;
			console.log(numberOfPlayers, "players");
			res.status(201).send();
		}
	});
});

app.put('/mark', verifyIfExists, (req, res) => {
	const {player} = req;
	const pos =  parseInt(req.body.pos);
	const namePath = path.join(__dirname, "players", player);

	fs.readFile(namePath, "utf8", (err, data) => {
		if (err) console.log(err);
		else {
			try {
				const playerData = JSON.parse(data);
				console.log(playerData);
				let newSymbol;
				if (playerData.turn === "x") newSymbol = 'o';
				else if (playerData.turn === "o") newSymbol = 'x';
				else throw "file corrupted";

				const table = playerData.table.slice(0, pos) + playerData.turn + playerData.table.slice(pos + 1, 9);
				playerData.table = table;
				playerData.turn = newSymbol;
				console.log("Player data to be saved:", playerData);
				
				const updatedPlayer = JSON.stringify(playerData);
				fs.writeFile(namePath, updatedPlayer, (err) => {
					if (err) {
						console.log("Write file error:", err);
						res.status(500).send("e");
					}
					else {
						console.log("Data sent:", newSymbol);
						res.status(201).send(newSymbol);
					}
				});
			} catch(error) {
				console.log(error);
				res.status(500).send("e");
			}
		}
	});
});

app.get('/players', (req, res) => {
	console.log('List of players saved:');
	fs.readdir(path.join(__dirname, 'players'), (err, files) => {
		if (err) {
			console.log("Unable to scan directory:", err);
			res.status(500).json({error: "Unable to scan directory: " + err});
		}
		else {
			numberOfPlayers = files.length;
			console.log(numberOfPlayers, "players:");
			files.forEach(file => console.log(file));
			res.send(files);
		}
	});
});

app.get('/player', verifyIfExists, (req, res) => {
	const {player} = req;
	console.log("Loading player", player);
	namePath = path.join(__dirname, "players", player);
	fs.readFile(namePath, "utf8", (err, data) => {
		if (err) console.log(err);
		else {
			console.log("Sending player file:");
			console.log(typeof data);
			console.log(data);
			res.send(data);
		}
	});
})

app.get('/index', (req, res) => {
	var options = {
		root: __dirname,
		dotfiles: 'deny',
		headers: {
			'x-timestam': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('index.html', options, (err) => {
		if (err) console.log("Error getting index page", err);
		else console.log('index.html sent');
	});
});

app.get('/game.js', (req, res) => {
	var options = {
		root: __dirname,
		dotfiles: 'deny',
		headers: {
			'x-timestam': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('game.js', options, (err) => {
		if (err) console.log("Error getting index page", err);
		else console.log('game.js sent');
	});
});

app.get('/game.css', (req, res) => {
	var options = {
		root: __dirname,
		dotfiles: 'deny',
		headers: {
			'x-timestam': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('game.css', options, (err) => {
		if (err) console.log("Error getting index page", err);
		else console.log('game.css sent');
	});
});

app.listen(8000 , () => console.log("listening"));