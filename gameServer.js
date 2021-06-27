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

const newGame = "_________";

app.post('/restart', (req, res) => {
	let playerSymbol = req.body.symbol;
	fs.writeFile(path.join(__dirname, "players", req.body.name), newGame+playerSymbol, err => {
		if (err) console.log("Restart error:", err);
		else {
			console.log("Game restarted");
			res.send();
		}
	});
});

// Include the status in the response of the server, not only the text sent
// Verify this interaction with game.js
app.post('/create', (req, res) => {
	let fileName = req.body.name + '.txt';
	let playerSymbol = req.body.symbol;
	fs.readdir(path.join(__dirname, "players"), (err, files) => {
		if (err) console.log("Unable to scan directory:", err);
		else {
			if (numberOfPlayers === maxPlayers) {
				console.log("Maximum number of players");
				res.status(403).send();
			}
			else if (files.includes(fileName)) {
				console.log(req.body.name, "already included");
				res.status(200).send();
			}
			else {
				fs.writeFile(path.join(__dirname, "players", fileName), newGame+playerSymbol, err => {
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

let pos, name, newSymbol;
app.post('/mark', (req, res) => {
	console.log("POST /mark:", req.body);
	pos = parseInt(req.body.pos);
	name = req.body.name;
	namePath = path.join(__dirname, "players", name);
		fs.readFile(namePath, "utf8", (err, data) => {
		if (err) console.log(err);
		else {
			console.log("data read:", data, "symbol:", data[9]);
			try {
				if (data[9] === "x") newSymbol = "o";
				else if (data[9] === "o") newSymbol = "x";
				else throw "file currupted";
				data = data.slice(0, pos) + data[9] + data.slice(pos + 1, 9);
				console.log("pre-data", data);
				data = data + newSymbol;
				fs.writeFile(namePath, data, err => {
					if (err) {
						console.log("Write file error:", err);
						// Include the status in the response of the server, not only the text sent
						res.send("e");
					}
					else {
						res.send(newSymbol);
						console.log("data sent:", data);
					}
				});
			} catch(error) {
				console.log(error);
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
			console.log("data read:", data, "symbol:", data[9]);
			try {
				// Think new ways to check the files
				if (data[9] === 'x' || data[9] === 'o') {
					console.log("load method - data sent:", data);
					//res.type('json');
					res.send(data);
				}
				else throw "file corrupted in /load";
			} catch(error) {
				console.log(error);
				console.log("Trying rewrite file, adding this player again");
				//How to procede from here?
				//newPlayer(req.params.player, namePath);
				//res.type('json');
				res.send(newGame);
			}
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
