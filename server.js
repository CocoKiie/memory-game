const express = require("express");
const app = express();
const port = 4000; // Port d'écoute du serveur

const path = require("path");

// Gestion des websockets avec Socket.IO
const http = require("http");
const socketIo = require("socket.io");
const { hostname } = require("os");
const server = http.createServer(app);

/**
 * @type {socketIo.Server}
 */
const io = require("socket.io")(server);

let users = {};
let namePlayer = "";
let connectedPlayers = 0;
let rooms = [];

app.use(express.json());

app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use('/socket.io', express.static(path.join(__dirname, 'node_modules/socket.io/client-dist')));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

server.listen(port, () => {
    console.log(`Le serveur écoute sur le port ${port}`);
});

io.on('connection', (socket) => {
    console.log(`[connection] ${socket.id}`);

    socket.on('playerData', (player) => {
        console.log(`[playerData] ${player.pseudo}`);

        // Vérifier si le joueur a déjà créé son objet player
        if (!player.pseudo) {
            io.to(socket.id).emit('redirect', '/');
            return;
        }

        let room = null;

        if (!player.roomId) {
            room = createRoom(player);
            console.log(`[create room] - ${room.id} - ${player.pseudo}`);

            socket.join(room.id);
            connectedPlayers++;
        } else {
            room = rooms.find(r => r.id === player.roomId);

            if (room === undefined) {
                io.to(socket.id).emit('redirect', '/');
                return;
            }

            namePlayer = player.pseudo;
            player.roomId = room.id;
            room.players.push(player);
            socket.join(room.id);
            connectedPlayers++;
        }
        io.to(socket.id).emit('join room', room.id);
        io.to(socket.id).emit('connected chat', connectedPlayers);
        console.log(connectedPlayers);

        io.to(socket.id).emit('set namePlayer', namePlayer);

        if (room.players.length === 2) {
            io.to(room.id).emit('start game', room.players);
            users = room.players;
            connectedPlayers = 2;
            io.emit('two on chat', connectedPlayers);
        }

        updateRoomsList();
    });

    socket.on('get rooms', () => {
        io.to(socket.id).emit('list rooms', rooms);
    });

    socket.on('send-chat-message', (pseudo, message) => {
        socket.broadcast.emit('chat message', { pseudo: pseudo, message: message });
    });

    socket.on('chat message', (message) => {
        const username = users[socket.id];
        io.emit('chat message', {
            username: username,
            message: message,
        });
    });

    socket.on('play', (player) => {
        io.to(player.roomId).emit('play', player);

        if (room === null || room.players.length === 1) {
            // Si la salle n'existe pas ou ne contient qu'un joueur, redirigez l'utilisateur
            io.to(socket.id).emit('redirect', '/');
            return;
        }
    });

    // Gestion de la déconnexion d'un joueur d'un salon spécifique
    socket.on('disconnect', () => {
        console.log(`[disconnect] - ${socket.id}`);
    
        if (connectedPlayers > 0) {
            connectedPlayers--;
        }
    
        io.emit('disconnect chat', connectedPlayers);
        console.log(connectedPlayers);
    
        let disconnectedPlayer = null;
    
        // Recherche du joueur déconnecté dans toutes les salles
        rooms.forEach(room => {
            const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
            if (playerIndex !== -1) {
                disconnectedPlayer = room.players[playerIndex];
                room.players.splice(playerIndex, 1); // Supprime le joueur déconnecté de sa salle
    
                if (disconnectedPlayer.host) {
                    // Si le joueur déconnecté était l'hôte, supprimer la salle uniquement
                    // si la salle est vide maintenant
                    if (room.players.length === 0) {
                        const roomIndex = rooms.findIndex(r => r.id === room.id);
                        if (roomIndex !== -1) {
                            rooms.splice(roomIndex, 1);
                        }
                    }
                }
            }
        });
    
        updateRoomsList();
    });     
});    

function createRoom(player) {
    const room = { id: roomId(), players: [] };
    player.roomId = room.id;
    room.players.push(player);
    rooms.push(room);
    return room;
}

function roomId() {
    return Math.random().toString(36).substr(2, 9);
}

// Fonction pour mettre à jour la liste des salons et l'envoyer à tous les clients
const updateRoomsList = () => {
    io.emit('list rooms', rooms);
};

// Rafraîchissement automatique de la liste des salons
setInterval(() => {
    updateRoomsList();
}, 100);