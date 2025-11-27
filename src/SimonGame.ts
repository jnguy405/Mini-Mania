export class SimonGame {
    overlay: HTMLDivElement;
    msgDisplay: HTMLDivElement;
    buttons: HTMLButtonElement[] = [];
    
    // Game state
    sequence: number[] = [];
    playerStep: number = 0;
    isInputBlocked: boolean = false;
    
    // Game configuration
    colors = ['red', 'blue', 'green'];
    targetColor: string = '';
    
    // Callback functions
    onWin: (color: string) => void;
    onClose: () => void;

    constructor(onWin: (color: string) => void, onClose: () => void) {
        this.onWin = onWin;
        this.onClose = onClose;
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'minigame-overlay';
        
        // ========== UI CREATION ==========
        this.msgDisplay = document.createElement('div');
        this.msgDisplay.id = 'game-msg';
        this.overlay.appendChild(this.msgDisplay);

        const btnContainer = document.createElement('div');
        btnContainer.className = 'simon-buttons';
        
        // Create color buttons
        this.colors.forEach((color, index) => {
            const btn = document.createElement('button');
            btn.className = `simon-btn`;
            btn.style.backgroundColor = color;
            btn.onclick = () => this.handleInput(index);
            this.buttons.push(btn);
            btnContainer.appendChild(btn);
        });
        this.overlay.appendChild(btnContainer);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.id = 'close-btn';
        closeBtn.innerText = 'Give Up (Close)';
        closeBtn.onclick = () => this.hide();
        this.overlay.appendChild(closeBtn);

        document.body.appendChild(this.overlay);
    }

    // ========== GAME VISIBILITY CONTROL ==========
    show(rewardColor: string) {
        this.targetColor = rewardColor;
        this.overlay.style.display = 'flex';
        this.msgDisplay.innerText = "Watch the sequence...";
        this.startGame();
    }

    hide() {
        this.overlay.style.display = 'none';
        this.onClose(); // Return control to main game
    }

    // ========== GAME LOGIC ==========
    startGame() {
        this.sequence = [];
        this.playerStep = 0;
        this.nextRound();
    }

    nextRound() {
        this.playerStep = 0;
        this.isInputBlocked = true;
        
        // Generate sequence of 3 random colors
        const length = 3; 
        this.sequence = [];
        for(let i = 0; i < length; i++) {
            this.sequence.push(Math.floor(Math.random() * 3));
        }

        this.playSequence();
    }

    playSequence() {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= this.sequence.length) {
                clearInterval(interval);
                this.isInputBlocked = false;
                this.msgDisplay.innerText = "Your Turn!";
                return;
            }
            this.flashButton(this.sequence[i]);
            i++;
        }, 600); // Button flash timing
    }

    flashButton(index: number) {
        const btn = this.buttons[index];
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 300);
    }

    // ========== PLAYER INPUT HANDLING ==========
    handleInput(index: number) {
        if (this.isInputBlocked) return;

        this.flashButton(index);

        // Check if input matches sequence
        if (index !== this.sequence[this.playerStep]) {
            this.msgDisplay.innerText = "Wrong! Try Again.";
            this.isInputBlocked = true;
            setTimeout(() => this.startGame(), 500); // Restart on failure
            return;
        }

        this.playerStep++;

        // Check for round completion
        if (this.playerStep >= this.sequence.length) {
            this.onWin(this.targetColor); // Award item
            this.hide(); // Close minigame
        }
    }
}