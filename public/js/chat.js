$(function () {
    // Sélection des éléments du DOM
    const divMsg = document.querySelector('#messages');
    const form = document.querySelector('#form2');
    const connectedPlayersElement = document.getElementById('connected-players');

    const msgInput = $("#msg");
    const sendButton = $("#sendButton");

    // Ajoutez un gestionnaire d'événements pour le champ de saisie
    msgInput.on("input", function () {
        const messageContent = msgInput.val().trim();
        sendButton.prop("disabled", messageContent === "");
    });

    // Vérifie si l'élément '#messages' existe avant de l'utiliser
    if (divMsg != null) {
        // Ajout du message indiquant que l'utilisateur a rejoint
        appendMessage('<i>Vous avez rejoint le chat</i>');

        // Ajout d'un écouteur d'événement pour le formulaire
        form.addEventListener('submit', e => {
            e.preventDefault();
            const message = $("#msg").val().trim();
            let name2 = player.pseudo;
            
            if (message !== "") { // Vérifie si le message n'est pas vide
                // Ajout du message dans la liste des messages
                appendMessage(`<b class ="youName">You :</b> ${escapeHtml(message)}`);

                // Émission de l'événement 'send-chat-message' au serveur
                socket.emit('send-chat-message', [name2, message]);

                // Effacer le champ de saisie après l'envoi
                $("#msg").val("");
            }
        });
    }

    // Gestionnaire pour l'événement 'chat message'
    socket.on('chat message', data => {
        // Ajout du message reçu dans la liste des messages
        appendMessage(`<b>${data.pseudo[0]} :</b> ${data.pseudo[1]}`);
    });

    // Gestionnaire pour l'événement 'set namePlayer'
    socket.on('set namePlayer', (name) => {
        // Mise à jour de la variable globale 'namePlayer'
        namePlayer = name;
    });

    // Gestionnaire pour l'événement 'connected chat'
    socket.on('connected chat', (connectedPlayers) => {
        // Mise à jour du nombre de joueurs connectés
        updateConnectedPlayers(connectedPlayers);
    });

    // Gestionnaire pour l'événement 'two on chat'
    socket.on('two on chat', (connectedPlayers) => {
        // Mise à jour du nombre de joueurs connectés
        updateConnectedPlayers(connectedPlayers);
    });

    // Gestionnaire pour l'événement 'disconnect chat'
    socket.on('disconnect chat', (connectedPlayers) => {
        // Mise à jour du nombre de joueurs connectés
        updateConnectedPlayers(connectedPlayers);
    });

    // Fonction pour ajouter un message à la liste des messages
    function appendMessage(msg) {
        const messageElement = document.getElementById('messages');
        if (messageElement) {
            // Ajout du message dans la div "messages"
            messageElement.innerHTML += `<li class = "list-msg">${msg}</li>`;

            // Défilement vers le bas pour afficher le dernier message ajouté
            messageElement.scrollTop = messageElement.scrollHeight;
        }
    }

    // Fonction pour échapper les caractères HTML
    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    // Fonction pour mettre à jour le nombre de joueurs connectés
    function updateConnectedPlayers(connectedPlayers) {
        // Affichage du nombre de joueurs connectés
        connectedPlayersElement.textContent = (connectedPlayers < 2) ?
            `Nombre de joueur connecté : ${connectedPlayers}` :
            `Nombre de joueurs connectés : ${connectedPlayers}`;
    }
});