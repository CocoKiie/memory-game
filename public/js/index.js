// Création de l'objet player
const player = {
  host: false, // Hôte de la partie ou non
  roomId: null, // Identifiant du salon
  pseudo: "",
  socketId: "",
  turn: false, // Est-ce son tour ?
  win: false, // A-t-il gagné ?
};

// Connexion au serveur WebSocket avec Socket.io
const socket = io();
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('room');
const start = document.getElementById('start');
const create = document.getElementById('create');

// Configuration des boutons en fonction de la présence ou non d'un roomId
if (roomId) {
  create.innerText = `Rejoindre un salon`;
  start.value = "Rejoindre";
} else {
  start.value = "Jouer";
}

// Sélection des éléments du DOM
const pseudoInput = document.getElementById('pseudo');
const userCard = document.getElementById('user-card');
const waitingArea = document.getElementById('waiting-area');
const roomsList = document.getElementById('rooms-list');
const game = document.getElementById('game');
const turnMessage = document.getElementById('message');
const linkToShare = document.getElementById('link-to-share');
const messageDiv = document.getElementById('message');
const url = "http://localhost:4000/";
let ennemyPseudo = "";
let selectedColor = null;

// Demander les salons disponibles au serveur
socket.emit('get rooms');

socket.on('redirect', (url) => {
  window.location.href = url;
});

// Écoute de l'événement "list rooms" pour afficher les salons disponibles
socket.on('list rooms', (rooms) => {
  let html = "";

  if (rooms.length > 0) {
    rooms.forEach(room => {
      if (room.players.length !== 2) {
        // Affichage des salons incomplets sur l'accueil
        html += `<div><p>Salon de ${room.players[0].pseudo} - ${room.id}</p><button class="join-room" onclick="location.href='${url}?room=${room.players[0].roomId}'" data-room="${room.id}">Rejoindre</button></div>`;
      }
    });
  }

  if (html !== "") {
    roomsList.innerHTML = html;

    // Ajout d'un écouteur d'événement pour chaque bouton "Rejoindre"
    for (const element of document.getElementsByClassName('join-room')) {
      element.addEventListener('click', joinRoom, true);
    }
  }
});

// Gestion de la soumission du formulaire
$("#form1").on('submit', function (e) {
  e.preventDefault();

  // Vérifier si le pseudo a été saisi
  if (pseudoInput.value !== "") {
    player.pseudo = pseudoInput.value;
    if (roomId) {
      player.roomId = roomId;
    } else {
      player.host = true;
      player.turn = true;
    }

    player.socketId = socket.id;
    console.log(player);

    // Cacher le formulaire
    userCard.hidden = true;

    // Afficher l'écran d'attente lorsque le joueur crée sa salle
    waitingArea.classList.remove('invisible');

    // Envoyer l'événement au serveur
    socket.emit('playerData', player);
  }
});

// Gestion de l'événement "join room" pour rejoindre un salon
socket.on('join room', (roomId) => {
  player.roomId = roomId;
  linkToShare.innerHTML = `<a href="${url}?room=${player.roomId}" target="_blank"> ${window.location.href}?room=${player.roomId}</a>`;
  isPopupVisible = false;
});

// Gestion de l'événement "start game" pour démarrer le jeu
socket.on('start game', (players) => {
  startGame(players);
});

// Fonction pour démarrer le jeu
function startGame(players) {
  // Rendre invisible l'écran d'attente
  waitingArea.classList.add('invisible');

  // Afficher le jeu une fois les deux joueurs qui ont rejoint
  game.classList.remove('invisible');
  turnMessage.classList.remove('invisible');

  // Recherche du socketID du joueur ennemi (contraire au socketId du joueur actuel)
  const ennemyPlayer = players.find(p => p.socketId !== player.socketId);
  ennemyPseudo = ennemyPlayer.pseudo;
  console.log('ennemy : ' + ennemyPseudo);

  if (player.host && player.turn) {
    setTurnMessage('alert-info', 'alert-success', "C'est ton tour de jouer !");
  } else {
    setTurnMessage('alert-success', 'alert-info', `C'est au tour de <b>${ennemyPseudo}</b> de jouer !`);
  }

  if (messageDiv) {
    setTurnMessage('alert-info', 'alert-success', `Deux joueurs ont rejoint le salon !`);
  }
}

// Variables pour le compte à rebours
let countdownTimer;
let isPopupVisible = false;

// Fonction pour afficher la pop-up avec le compte à rebours
function showCountdownPopup() {
  // Affichage de la pop-up uniquement si elle n'est pas déjà visible
  if (isPopupVisible) {
    const popup = document.createElement('div');
    popup.innerHTML = `<div style="text-align: center; padding: 20px;">
                        <p>Vous êtes seul dans ce salon...
                        </br> nous allons vous rediriger à l'accueil dans <span id="countdown">5</span> secondes...</p>
                      </div>`;
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.border = '1px solid #ccc';
    popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    popup.style.zIndex = '9999';
    document.body.appendChild(popup);

    // Désactiver le formulaire pendant la pop-up
    $("#form1 input, #form1 button").prop("disabled", true);

    // Compte à rebours de 5 secondes
    let countdown = 5;
    const countdownElement = document.getElementById('countdown');

    countdownTimer = setInterval(() => {
      countdown--;
      countdownElement.innerText = countdown;

      if (countdown === 0) {
        clearInterval(countdownTimer);
        window.location.href = url; // Redirection vers la page principale
        // Réactiver le formulaire après la redirection
        $("#form1 input, #form1 button").prop("disabled", false);
        isPopupVisible = false;
      }
    }, 1000);
  }
}

// Gestion de l'événement "disconnect chat" pour la déconnexion de l'adversaire
socket.on('disconnect chat', (playersCount) => {
  if (playersCount > 0 && player.host) {
    setTurnMessage('alert-success', 'alert-danger', `Votre adversaire a quitté le salon :(`);
  }
});

// Fonction pour définir le message de tour
function setTurnMessage(classToRemove, classToAdd, html) {
  turnMessage.classList.remove(classToRemove);
  turnMessage.classList.add(classToAdd);
  turnMessage.innerHTML = html;
}

// Vérification de l'existence de la salle au chargement de la page
window.addEventListener('load', () => {
  if (roomId) {
    // Demande des salons disponibles au serveur
    socket.emit('get rooms');

    // Attente de la réponse du serveur sur les salons disponibles
    socket.once('list rooms', (rooms) => {
      const roomExists = rooms.some(room => room.id === roomId);
      if (!roomExists) {
        window.location.href = url; // Redirection vers la page principale
        $("#form1 input, #form1 button").prop("disabled", true);
      } else {
        // Réactivation du formulaire après la redirection
        $("#form1 input, #form1 button").prop("disabled", false);
      }
    });
  }
});