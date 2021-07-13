/*
 * Hash Game's script
 * 
 * Contains all the functions to the game work
 * 
 * Some of this functions will be separeted in a module,
 * so they can be used for general use
 *
 * The players's data is handled by the server and has the following formatting in .txt files:
 * 		nine first chars: game's table ["x", "o", "_"]
 *		10º char: game's turn ["x", "o"]
 *		11º char: host's symbol ["x", "o"] exclusive
 *		12º char: guest's symbol ["x", "o"] exclusive
 *
 * The 11º and 12º chars are still to be implemented
 * The host will be the seletected player and the guest can be another player or the machine.
 * This way of save data will be changed to .JSON files and (different backends) a Data Bank yet to be choosen.
 */

// ################################# DOM elements #######################################
let restartButton = document.getElementById("restart");
let deleteButton = document.getElementById("delete");
let createButton = document.getElementById("create");
let turn = document.getElementById("turn");
let host = document.getElementById("host");
let select = document.querySelector("select");
let menu = document.getElementById("menu");
let game = document.getElementById("game");
let buttons = document.getElementById("buttons");
let title = document.querySelector("title");

// Select element with options X and O to temporary be used in the Reset and newPlayer functions
let newPlayerSymbol = document.createElement("select");
let xSymbol = document.createElement("option");
xSymbol.setAttribute("value", 'x');
xSymbol.innerHTML = "x";
let oSymbol = document.createElement("option");
oSymbol.setAttribute("value", 'o');
oSymbol.innerHTML = "o";
newPlayerSymbol.appendChild(xSymbol);
newPlayerSymbol.appendChild(oSymbol);

// ################################## Other global bindings ####################################
let symbol, cell, match, player, playerSymbol;
let playerName = new RegExp('\\w+.txt', 'g');
let newPlayer;

// To be check if is necessary
select.value = "default";


// #################################### Functions #######################################

// Loads a game from the server according to the current player selected
function loadGame() {
    // If the game has not yet started, makes the necessary alterations
	// This condition is checked by the value of the DOM game's class
    if (game.getAttribute("class") === "invisible") {
        document.getElementById("default").remove();
        restartButton.addEventListener("click", restart);
        deleteButton.addEventListener("click", deletePlayer);
        game.setAttribute("class", "visible");
    }
	// Fetches the selected player's information
    fetch('/players/' + player).then(resp => resp.text())
        .then(text => {
            console.log("teste do [text] em loadGame:", text);
            for (let i = 0; i < 9; i++) {
                let cell = document.getElementById(String(i));
                cell.textContent = text[i];
                if (text[i] === '_') {
					// !!! Must confirm if the event handlers can be add always,
					// once their callback function check the state (class) of the space
					// That being the case, they can very well be added at the page's loading
                    cell.addEventListener("click", marked);
                    cell.addEventListener("mousemove", markPreview);
                    cell.addEventListener("mouseleave", cleanPreview);
                    cell.setAttribute("class", "empty");
                }
                else
                    cell.setAttribute("class", "full");
            }
            symbol = text[9];
            //playerSymbol = text[10];
            turn.textContent = symbol;
            //host.textContent = player.slice(0,-4) + " - " + playerSymbol;
            host.textContent = player.slice(0,-4);
			title.innerHTML = symbol.toUpperCase() + " Hash Game";
            console.log("Game loaded - this turn:", symbol);
        });
}

// Shows the symbol that would be selected in an empty space of the table as the mouse move above it
function markPreview(event) {
    if (event.target.getAttribute("class") === 'empty') event.target.textContent = symbol;
}

// Cleans the symbol that would be selected in an empty space of the table as the mouse leaves it
function cleanPreview(event) {
    if (event.target.getAttribute("class") === 'empty') event.target.textContent = '_';
}

// Marks the symbol in the selected place, according to the current turn
// The change at each time this function is called is saved in the player's file by the server
function marked(event) {
	if (event.target.getAttribute("class") === 'empty') {
		    event.target.setAttribute("class", "full");
		    fetch("mark", {
		        method: "POST",
		        headers: {"Content-Type": "application/json"},
		        body: JSON.stringify({
		            pos: event.target.getAttribute("id"),
		            name: player
		        })
		    }).then(resp => resp.text()).then(text => {
		            try {
		                if (text !== 'e') {
                		    console.log("next turn -", text);
                		    symbol = text;
		                    turn.textContent = symbol;
							title.innerHTML = symbol.toUpperCase() + " Hash Game";
	                	}	
        		        else throw "file corrupted";
		            } catch(error) {
		                console.log(error);
                		symbol = 'e';
		                turn.textContent = "File corrupted, please try restart game";
		            }		
        		});
	}
}

// Restart the game of the current player
// This change is saved in the player's file by the server
function restart() {
	restartButton.removeEventListener("click", restart);
	restartButton.innerHTML = "Confirm";
	restartButton.addEventListener("click", confirmRestart);
	deleteButton.removeEventListener("click", deletePlayer);
	deleteButton.innerHTML = "Cancel";
	deleteButton.addEventListener("click", cancelRestart);

	// Insert option to chose symbol
	buttons.appendChild(newPlayerSymbol);

	function confirmRestart() {
		fetch("restart", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				name: player,
				symbol: newPlayerSymbol.value
			})
		}).then(resp => {
			for (let i = 0; i < 9; i++) {
				cell = document.getElementById(String(i));
				cell.textContent = '_';
				cell.addEventListener("click", marked);
				cell.addEventListener("mousemove", markPreview);
				cell.addEventListener("mouseleave", cleanPreview);
				cell.setAttribute("class", "empty");
			}
			symbol = newPlayerSymbol.value;
			turn.textContent = symbol;
			title.innerHTML = symbol.toUpperCase() + " Hash Game";
			console.log("Game restarted");
			cancelRestart();
		});
	}

	function cancelRestart() {
		restartButton.removeEventListener("click", confirmRestart);
		restartButton.innerHTML = "Restart";
		restartButton.addEventListener("click", restart);
		deleteButton.removeEventListener("click", cancelRestart);
		deleteButton.innerHTML = "Delete";
		deleteButton.addEventListener("click", deletePlayer);
		buttons.removeChild(newPlayerSymbol);
	}
}

// Gets from server the list of players saved
function getPlayers() {
    fetch("players").then(resp => resp.text())
        .then(text => {
            console.log("Players fetched:\n", text);
            match = text.match(playerName);
            if(match) {
                match.forEach(name => {
                    // name -> .txt
                    // onlyName -> without extension part
                    let onlyName = name.slice(0,-4); 
                    let player = document.createElement("option");
                    player.innerHTML = onlyName;
                    player.setAttribute("value", name); 
                    player.setAttribute("id", name);
                    select.appendChild(player);
                });
            }
            else {
                console.log("There is no players so far :(");
            }
        });	
}

// Sends to the server a requisition to create a new player, with the name and symbol of choice
// After created, automatically select this player
function createPlayer() {
    createButton.removeEventListener("click", createPlayer);
    createButton.innerHTML = "Confirm new player";
    createButton.addEventListener("click", confirmNewPlayer);

    let newPlayerField = document.createElement("input");
	newPlayerField.focus(); // Not working
    newPlayerField.type = "text";
    newPlayerField.placeholder = "Blank to cancel operation";
    menu.appendChild(newPlayerField);
    menu.appendChild(newPlayerSymbol);
    
    function confirmNewPlayer() {
        let match = newPlayerField.value.match(new RegExp('\\w+'));
        // If a valid name was chosen
        if (match) {
            console.log("New player:", match[0]);
            fetch("create", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: match[0],
                    symbol: newPlayerSymbol.value
                })
            }).then(resp => {
                console.log("Status", resp.status);
                if (resp.status == 201) {
                    console.log(match[0], "created");
                    player = match[0] + ".txt";
                    let newPlayer = document.createElement("option");
                    newPlayer.innerHTML = match[0];
                    newPlayer.setAttribute("value", player);
                    newPlayer.setAttribute("id", player);
                    select.appendChild(newPlayer);
                    // After adding the new player, his/her game is loaded
                    select.value = player;
                    loadGame();
                    cancelNewPlayer();
                }
                else if (resp.status == 200) {
                    console.log(match[0], "Player already present");
                    newPlayerField.placeholder = "Player already present";
                    newPlayerField.value = "";
                }
                else if (resp.status == 403) {
                    console.log("Number maximum of players reached");
                    cancelNewPlayer();
                }
            })
        }
        else {
            console.log("No name chosen");
            cancelNewPlayer();
        }
    }

    function cancelNewPlayer() {
        createButton.removeEventListener("click", confirmNewPlayer);
        createButton.innerHTML = "Create new player";
        createButton.addEventListener("click", createPlayer);
        menu.removeChild(newPlayerField);
        menu.removeChild(newPlayerSymbol);
    }    
}

// Sends requisition to server to delete a player, this is, the server delete the player's file
function deletePlayer() {
    fetch('delete', {
        method: 'DELETE',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name: player
        })
    }).then(resp => resp.text()).then(text => {
        console.log(text);
        console.log(player);
        document.getElementById(player).remove();
        player = select.value;

        // If there is players, loads the game of the one catched, that is, the first option DOM element
        if (player) 
			loadGame();

        // If there is no more players, returns the page to its initial state, without a present game
        else {
            let def = document.createElement("option");
            def.setAttribute("id", "default");
            def.innerHTML = "-";
            select.appendChild(def);
            game.setAttribute("class", "invisible");
            restartButton.removeEventListener("click", restart);
           	deleteButton.removeEventListener("click", deletePlayer);
			title.innerHTML = "# Hash Game";
        }
    });
}

// Calls loadGame function after a player is chosen
function chosePlayer(event) {
    player = event.target.value;
    console.log(player, "selected");
    loadGame();
}

// ################################## Starting Game ####################################
createButton.addEventListener("click", createPlayer);
getPlayers();
select.addEventListener("change", chosePlayer);
title.innerHTML = "# Hash Game";
