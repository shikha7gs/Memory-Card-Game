class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.gameStarted = false;
        this.gameTime = 0;
        this.timer = null;
        this.difficulty = 'easy';
        this.difficulties = {
            easy: { pairs: 6, timeLimit: 60 },
            medium: { pairs: 12, timeLimit: 120 },
            hard: { pairs: 18, timeLimit: 180 }
        };
        this.achievements = {
            quickMatch: { name: 'Speed Demon', description: 'Match a pair in under 2 seconds', earned: false },
            perfectStart: { name: 'Perfect Start', description: 'Find first pair without mistakes', earned: false },
            comboMaster: { name: 'Combo Master', description: 'Match 3 pairs in a row', earned: false }
        };
        this.combo = 0;

        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        this.gameGrid = document.getElementById('gameGrid');
        this.movesDisplay = document.getElementById('moves');
        this.timeDisplay = document.getElementById('time');
        this.scoreDisplay = document.getElementById('score');
        this.modal = document.getElementById('gameOverModal');
        this.modalText = document.getElementById('modalText');
        this.starsContainer = document.getElementById('starsContainer');
        this.leaderboardList = document.getElementById('leaderboard');
        this.achievementElement = document.getElementById('achievement');
        this.achievementText = document.getElementById('achievementText');

        this.createCards();
        this.updateStats();
        this.loadLeaderboard();
    }

    setupEventListeners() {
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.modal.style.display = 'none';
            this.restartGame();
        });

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficulty(e.target.dataset.difficulty);
            });
        });
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        this.restartGame();
    }

    createCards() {
        const emojis = ['🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢', '🎠', '🎪', '🎭', '🎨', '🎯', '🎲', '🎮', '🎡', '🎢', '🎠'];
        const numberOfPairs = this.difficulties[this.difficulty].pairs;
        const selectedEmojis = emojis.slice(0, numberOfPairs);
        this.cards = [...selectedEmojis, ...selectedEmojis]
            .sort(() => Math.random() - 0.5)
            .map((emoji, index) => ({
                id: index,
                emoji: emoji,
                isFlipped: false,
                isMatched: false
            }));

        this.renderCards();
    }

    renderCards() {
        this.gameGrid.innerHTML = '';
        this.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.id = card.id;

            const front = document.createElement('div');
            front.className = 'card-face card-front';
            front.textContent = card.emoji;

            const back = document.createElement('div');
            back.className = 'card-face card-back';
            back.textContent = '?';

            cardElement.appendChild(front);
            cardElement.appendChild(back);

            cardElement.addEventListener('click', () => this.flipCard(card));
            this.gameGrid.appendChild(cardElement);
        });
    }

    flipCard(card) {
        if (
            this.flippedCards.length === 2 ||
            card.isFlipped ||
            card.isMatched
        ) return;

        if (!this.gameStarted) {
            this.startGame();
        }

        card.isFlipped = true;
        this.flippedCards.push(card);

        const cardElement = document.querySelector(`[data-id="${card.id}"]`);
        cardElement.classList.add('flipped');

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const match = card1.emoji === card2.emoji;

        if (match) {
            this.handleMatch(card1, card2);
        } else {
            this.handleMismatch(card1, card2);
        }

        this.checkAchievements();
    }

    handleMatch(card1, card2) {
        card1.isMatched = true;
        card2.isMatched = true;
        this.matchedPairs++;
        this.combo++;

        const score = Math.floor(100 * (1 + this.combo * 0.5));
        this.score += score;

        document.querySelectorAll(`[data-id="${card1.id}"], [data-id="${card2.id}"]`)
            .forEach(el => el.classList.add('matched'));

        this.flippedCards = [];
        this.updateStats();

        if (this.matchedPairs === this.difficulties[this.difficulty].pairs) {
            this.gameOver();
        }
    }

    handleMismatch(card1, card2) {
        this.combo = 0;
        setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            this.flippedCards = [];
            document.querySelectorAll(`[data-id="${card1.id}"], [data-id="${card2.id}"]`)
                .forEach(el => el.classList.remove('flipped'));
        }, 1000);
    }

    startGame() {
        this.gameStarted = true;
        this.gameTime = 0;
        this.timer = setInterval(() => {
            this.gameTime++;
            this.updateStats();
            if (this.gameTime >= this.difficulties[this.difficulty].timeLimit) {
                this.gameOver();
            }
        }, 1000);
    }

    updateStats() {
        this.movesDisplay.textContent = this.moves;
        this.timeDisplay.textContent = this.formatTime(this.gameTime);
        this.scoreDisplay.textContent = this.score;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    gameOver() {
        clearInterval(this.timer);
        this.gameStarted = false;

        const timeBonus = Math.max(0, this.difficulties[this.difficulty].timeLimit - this.gameTime);
        const finalScore = this.score + timeBonus * 10;
        this.score = finalScore;
        this.updateStats();

        const stars = this.calculateStars();
        this.starsContainer.innerHTML = '⭐'.repeat(stars);

        this.modalText.textContent = `You completed the game in ${this.formatTime(this.gameTime)} with ${this.moves} moves! Final score: ${finalScore}`;
        this.modal.style.display = 'flex';

        this.updateLeaderboard(finalScore);
    }

    calculateStars() {
        const { timeLimit } = this.difficulties[this.difficulty];
        const maxMoves = this.difficulties[this.difficulty].pairs * 2.5;

        if (this.gameTime <= timeLimit * 0.5 && this.moves <= maxMoves * 0.6) return 3;
        if (this.gameTime <= timeLimit * 0.75 && this.moves <= maxMoves * 0.8) return 2;
        return 1;
    }

    restartGame() {
        clearInterval(this.timer);
        this.gameStarted = false;
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.gameTime = 0;
        this.combo = 0;
        this.flippedCards = [];
        Object.keys(this.achievements).forEach(key => {
            this.achievements[key].earned = false;
        });
        this.createCards();
        this.updateStats();
    }

    checkAchievements() {
        const achievements = [];

        if (!this.achievements.quickMatch.earned && this.flippedCards.length === 2) {
            const timeSinceLastFlip = this.gameTime - this.lastFlipTime;
            if (timeSinceLastFlip < 2) {
                this.achievements.quickMatch.earned = true;
                achievements.push(this.achievements.quickMatch);
            }
        }

        if (!this.achievements.perfectStart.earned && this.matchedPairs === 1 && this.moves === 1) {
            this.achievements.perfectStart.earned = true;
            achievements.push(this.achievements.perfectStart);
        }

        if (!this.achievements.comboMaster.earned && this.combo >= 3) {
            this.achievements.comboMaster.earned = true;
            achievements.push(this.achievements.comboMaster);
        }

        achievements.forEach(achievement => this.showAchievement(achievement));
    }

    showAchievement(achievement) {
        this.achievementText.textContent = `🏆 ${achievement.name}: ${achievement.description}`;
        this.achievementElement.classList.add('show');
        setTimeout(() => {
            this.achievementElement.classList.remove('show');
        }, 3000);
    }

    loadLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('memoryGameLeaderboard') || '[]');
        this.renderLeaderboard(leaderboard);
    }

    updateLeaderboard(score) {
        const leaderboard = JSON.parse(localStorage.getItem('memoryGameLeaderboard') || '[]');
        leaderboard.push({
            score,
            difficulty: this.difficulty,
            moves: this.moves,
            time: this.gameTime,
            date: new Date().toISOString()
        });

        const sortedLeaderboard = leaderboard
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        localStorage.setItem('memoryGameLeaderboard', JSON.stringify(sortedLeaderboard));
        this.renderLeaderboard(sortedLeaderboard);
    }

    renderLeaderboard(leaderboard) {
        this.leaderboardList.innerHTML = leaderboard
            .map((entry, index) => `
                        <li class="leaderboard-item">
                            <span>#${index + 1} ${entry.difficulty}</span>
                            <span>${entry.score} pts</span>
                        </li>
                    `)
            .join('');
    }

    createConfetti() {
        const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.opacity = Math.random();
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 5000);
        }
    }
}

new MemoryGame();