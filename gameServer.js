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

// The restart function can only be used in games against the machine.
app.post('/restart', (req, res) => {
	console.log("Received data (file name, host symbol):");
	console.log(req.body);
	fs.readFile(path.join(__dirname, "players", req.body.fileName), "utf-8", (err, data) => {
		if (err) console.log("Error reading file", err);
		else {
			const playerObj = JSON.parse(data);
			playerObj.table = "_________";
			// The host is this way always the first player. This must be changed to be random
			playerObj.symbol = req.body.symbol;
			playerObj.turn = req.body.symbol;
			const playerData = JSON.stringify(playerObj);
			fs.writeFile(path.join(__dirname, "players", req.body.fileName), playerData, err => {
				if (err) console.log("Create error:", err);
				else {
					console.log(req.body.fileName, "restarted");
					res.status(201).send();
				}
			})	
		}
	})
});

app.post('/create', (req, res) => {
	console.log("Received data:");
	console.log(req.body);
	// Change to check JSON files instead
	let fileName = req.body.name + '.txt';
	fs.readdir(path.join(__dirname, "players"), (err, files) => {
		if (err) console.log("Unable to scan directory:", err);
		else {
			if (numberOfPlayers === maxPlayers) {
				console.log("Maximum number of players");
				res.status(403).send();
			}
			// Change to check JSON files instead
			else if (files.includes(fileName)) {
				console.log(req.body.name, "already included");
				res.status(200).send();
			}
			else {
				const playerFile = {
					"name": req.body.name,
					"symbol": req.body.symbol, // Will be deleted when the act of create a player is independent of a game start
					"turn": req.body.symbol, // For now, the host is always the first player. This must be changed to be random
					"table": "_________"
				}
				const data = JSON.stringify(playerFile);
				fs.writeFile(path.join(__dirname, "players", req.body.name + ".json"), data, err => {
					if (err) console.log("Create error:", err);
					else {
						numberOfPlayers++;
						console.log(req.body.name, "created");
						res.status(201).send();
					}
				})	
			}
		}
	})
});

app.delete('/delete', (req, res) => {
	let name = req.body.name;
	console.log("Deleting player", name);
	namePath = path.join(__dirname, "players", name);
	fs.unlink(namePath, (err) => {
		if (err) console.log(err);
		else {
			if (numberOfPlayers) numberOfPlayers--;
			console.log(numberOfPlayers, "players");
			res.send("Server here: Player " + name + " deleted");
		}
	})
});

app.post('/mark', (req, res) => {
	console.log("POST /mark:", req.body);
	const pos = parseInt(req.body.pos);
	const namePath = path.join(__dirname, "players", req.body.name);
	fs.readFile(namePath, "utf8", (err, data) => {
		if (err) console.log(err);
		else {
			try {
				const player = JSON.parse(data);
				console.log(player);
				let newSymbol;
				if (player.turn === "x") newSymbol = 'o';
				else if (player.turn === "o") newSymbol = 'x';
				else throw "file corrupted";
				let table = player.table.slice(0, pos) + player.turn + player.table.slice(pos + 1, 9);
				player.table = table;
				player.turn = newSymbol;
				console.log("Player data to be saved:", player);
				const updatedPlayer = JSON.stringify(player);
				fs.writeFile(namePath, updatedPlayer, (err) => {
					if (err) {
						console.log("Write file error:", err);
						// Include the status in the response of the server, not only the text sent
						// Test res.status(500?).send("e") or verify if needs the send function at all
						res.send("e");
					}
					else {
						res.send(newSymbol);
						console.log("Data sent:", newSymbol);
					}
				});
			} catch(error) {
				console.log(error);
				// add the status sent here
				res.send("e");
			}
		}
	});
});

app.get('/players', (req, res) => {
	console.log('List of players saved:');
	fs.readdir(path.join(__dirname, 'players'), (err, files) => {
		if (err) console.log("Unable to scan directory:", err);
		else {
			numberOfPlayers = files.length;
			console.log(numberOfPlayers, "players:");
			files.forEach(file => console.log(file));
			res.send(files);
		}
	});
});

app.get('/players/:player', (req, res) => {
	console.log("Loading player", req.params.player);
	namePath = path.join(__dirname, "players", req.params.player);
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

app.get('/index.html', (req, res) => {
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