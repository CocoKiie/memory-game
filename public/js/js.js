// Sélection des éléments du DOM en utilisant des sélecteurs CSS
const selectors = {
    boardContainer: document.querySelector('.board-container'),
    board: document.querySelector('.board'),
    moves: document.querySelector('.moves'),
    timer: document.querySelector('.timer'),
    start: document.querySelector('button'),
    win: document.querySelector('.win')
}

// Création d'un objet pour stocker l'état du jeu
const state = {
    gameStarted: false,
    flippedCards: 0,
    totalFlips: 0,
    totalTime: 0,
    loop: null
}

// Fonction pour mélanger un tableau
const shuffle = array => {
    const clonedArray = [...array]

    for (let index = clonedArray.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        const original = clonedArray[index]

        clonedArray[index] = clonedArray[randomIndex]
        clonedArray[randomIndex] = original
    }

    return clonedArray
}

// Fonction pour choisir des éléments aléatoires d'un tableau
const pickRandom = (array, items) => {
    const clonedArray = [...array]
    const randomPicks = []

    for (let index = 0; index < items; index++) {
        const randomIndex = Math.floor(Math.random() * clonedArray.length)

        randomPicks.push(clonedArray[randomIndex])
        clonedArray.splice(randomIndex, 1)
    }

    return randomPicks
}

// Fonction pour générer le jeu de mémoire
const generateGame = () => {
    const dimensions = selectors.board.getAttribute('data-dimension')

    if (dimensions % 2 !== 0) {
        throw new Error("La dimension du plateau doit être un nombre pair.")
    }

    // Liste des emojis possibles pour les cartes
    const emojis = ['🥔', '🍒', '🥑', '🌽', '🥕', '🍇', '🍉', '🍌', '🥭', '🍍']

    // Sélection de paires d'emojis aléatoires pour le jeu
    const picks = pickRandom(emojis, (dimensions * dimensions) / 2)
    const items = shuffle([...picks, ...picks])

    // Génération du code HTML pour les cartes du jeu
    const cards = `
        <div class="board" style="grid-template-columns: repeat(${dimensions}, auto)">
            ${items.map(item => `
                <div class="card">
                    <div class="card-front"></div>
                    <div class="card-back">${item}</div>
                </div>
            `).join('')}
       </div>
    `

    // Utilisation d'un parseur DOM pour convertir le code HTML en éléments DOM
    const parser = new DOMParser().parseFromString(cards, 'text/html')

    // Remplacement du contenu de la carte par le jeu généré
    selectors.board.replaceWith(parser.querySelector('.board'))
}

// Fonction pour démarrer le jeu
const startMemory = () => {
    state.gameStarted = true
    selectors.start.classList.add('disabled')

    // Commencez à compter le temps et les mouvements
    state.loop = setInterval(() => {
        state.totalTime++
        selectors.moves.innerText = `${state.totalFlips} moves`
        selectors.timer.innerText = `time: ${state.totalTime} sec`
    }, 500)
}

// Fonction pour retourner les cartes non appariées
const flipBackCards = () => {
    document.querySelectorAll('.card:not(.matched)').forEach(card => {
        card.classList.remove('flipped')
    })

    state.flippedCards = 0
}

// Fonction pour retourner une carte et gérer le jeu
const flipCard = card => {
    state.flippedCards++
    state.totalFlips++

    if (!state.gameStarted) {
        startMemory()
    }

    if (state.flippedCards <= 2) {
        card.classList.add('flipped')
    }

    if (state.flippedCards === 2) {
        const flippedCards = document.querySelectorAll('.flipped:not(.matched)')

        if (flippedCards[0].innerText === flippedCards[1].innerText) {
            // Les cartes correspondent, marquez-les comme appariées
            flippedCards[0].classList.add('matched')
            flippedCards[1].classList.add('matched')
        }

        // Retournez les cartes après un court délai
        setTimeout(() => {
            flipBackCards()
        }, 500)
    }

    // Si toutes les cartes sont appariées, affichez un message de victoire
    if (!document.querySelectorAll('.card:not(.flipped)').length) {
        setTimeout(() => {
            selectors.boardContainer.classList.add('flipped')
            selectors.win.innerHTML = `
                <span class="win-text">
                    Vous avez gagné!<br />
                    avec <span class="highlight">${state.totalFlips}</span> mouvements<br />
                    en <span class="highlight">${state.totalTime}</span> secondes
                </span>
            `

            clearInterval(state.loop)
        }, 500)
    }
}

// Fonction pour attacher des écouteurs d'événements aux éléments du jeu
const attachEventListeners = () => {
    document.addEventListener('click', event => {
        const eventTarget = event.target
        const eventParent = eventTarget.parentElement

        if (eventTarget.className.includes('card') && !eventParent.className.includes('flipped')) {
            flipCard(eventParent)
        } else if (eventTarget.nodeName === 'BUTTON' && !eventTarget.className.includes('disabled')) {
            startMemory()
        }
    })
}

// Fonction pour réinitialiser le jeu
const resetGame = () => {
    // Arrêtez le chronomètre s'il est en cours
    clearInterval(state.loop);

    // Réinitialisez l'état du jeu
    state.gameStarted = false;
    state.flippedCards = 0;
    state.totalFlips = 0;
    state.totalTime = 0;
    state.loop = null;

    // Retirez les classes "flipped" et "matched" de toutes les cartes
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('flipped', 'matched');
    });

    // Réinitialisez le contenu du tableau
    selectors.board.innerHTML = "";

    // Générez un nouveau jeu
    generateGame();

    // Réinitialisez le texte des mouvements et du chronomètre
    selectors.moves.innerText = "0 moves";
    selectors.timer.innerText = "time: 0 sec";
    
    // Réinitialisez les classes du conteneur du tableau
    selectors.boardContainer.classList.remove('flipped');
    
    // Réinitialisez le contenu du message de victoire
    selectors.win.innerHTML = "";

    // Réactivez le bouton de démarrage
    selectors.start.classList.remove('disabled');
};

// écouter l'événement click du bouton reset
const resetButton = document.getElementById('resetButton');
resetButton.addEventListener('click', resetGame);

// Génération du jeu au chargement de la page et attachement des écouteurs d'événements
generateGame()
attachEventListeners()