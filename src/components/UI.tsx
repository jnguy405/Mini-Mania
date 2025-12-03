import { useState, useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { ROOM_CONFIGS } from '../config/rooms';

export function UI() {
  const { 
    currentRoom, 
    nearPortal, 
    isLocked, 
    isPlaying,
    isNearMiniGame,
    isRolling,
    diceResult,
    money,
    currentBet,
    betAmount,
    placeBet,
    setCurrentBet,
    setBetAmount,
    isMiniGameActive,
    setIsMiniGameActive,
    setDiceResult,
    addMoney,
    triggerRoll,
    lastBetForResult,
    lastBetAmountForResult,
    isNearBasketball,
    isBasketballActive,
    isHoldingBall,
    throwPower,
    basketballScore,
    basketballBetAmount,
    basketballBetPlaced,
    lastBasketballResult,
    placeBasketballBet,
    resetBasketballGame,
    enterBasketballZone,
    exitBasketballZone,
    isNearSimon,
    isSimonActive,
    simonBetPlaced,
    simonScore,
    simonIsGameOver,
    simonGameMessage,
    startSimonGame,
    exitSimonGame,
  } = useGameStore();
  const roomConfig = ROOM_CONFIGS[currentRoom];
  
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [inputBetAmount, setInputBetAmount] = useState(10);
  const [basketballBetInput, setBasketballBetInput] = useState(10);
  const [simonBetInput, setSimonBetInput] = useState(10);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;

      if (currentRoom === 'minigame1' && isMiniGameActive && diceResult) {
        setDiceResult(null);
        setSelectedBet(null);
        setInputBetAmount(10);
        return;
      }

      if (currentRoom === 'minigame3' && isSimonActive && simonIsGameOver) {
        exitSimonGame();
        setSimonBetInput(10);
        useGameStore.getState().setIsSimonActive(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentRoom,
    isMiniGameActive,
    diceResult,
    isSimonActive,
    simonIsGameOver,
    setDiceResult,
    exitSimonGame,
  ]);

  if (!isPlaying) return null;

  const handlePlaceBet = () => {
    if (selectedBet !== null && inputBetAmount > 0) {
      const success = placeBet(selectedBet, inputBetAmount);
      console.log(success ? 'Bet placed.' : 'Bet failed: not enough money.');
    }
  };
  
  const handleCancelBet = () => {
    if (currentBet !== null && betAmount > 0) {
      addMoney(betAmount);
      setCurrentBet(null);
      setBetAmount(0);
    }
    setSelectedBet(null);
    setInputBetAmount(10);
  };

  const handleRollDice = () => {
    if (currentBet !== null && betAmount > 0 && !isRolling) {
      triggerRoll();
    }
  };

  const handleExitMiniGame = () => {
    if (currentBet !== null && betAmount > 0) {
      addMoney(betAmount);
      setCurrentBet(null);
      setBetAmount(0);
    }
    setIsMiniGameActive(false);
    setSelectedBet(null);
    setInputBetAmount(10);
    setDiceResult(null);
    document.body.requestPointerLock();
  };

  const isWin = diceResult && lastBetForResult === diceResult.total;

  const handleExitBasketball = () => {
    if (basketballBetPlaced && basketballBetAmount > 0) {
      addMoney(basketballBetAmount);
    }
    exitBasketballZone();
    resetBasketballGame();
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.requestPointerLock();
  };

  const handleBasketballBetAndStart = () => {
    if (basketballBetInput > 0 && !basketballBetPlaced) {
      const success = placeBasketballBet(basketballBetInput);
      if (success) {
        enterBasketballZone();
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.requestPointerLock();
      }
    }
  };

  return (
    <div className="ui-overlay">
      {isLocked && !isMiniGameActive && (!isBasketballActive || basketballBetPlaced) && <div className="crosshair" />}

      <div className="room-indicator">
        {roomConfig.name}
      </div>

      <div className="money-display">
        💰 {money.toLocaleString()}
      </div>

      {!isLocked && !isMiniGameActive && (
        <div className="interaction-hint">
          Click the screen to start
        </div>
      )}

      {isLocked && nearPortal && !isNearMiniGame && !isMiniGameActive && (
        <div className="interaction-hint">
          [E] {nearPortal.label}
        </div>
      )}

      {isLocked && isNearMiniGame && currentRoom === 'minigame1' && !isMiniGameActive && (
        <div className="interaction-hint">
          [E] Start Dice Game 🎲
        </div>
      )}

      {isMiniGameActive && currentRoom === 'minigame1' && !isRolling && !diceResult && (
        <div className="betting-panel">
          <div className="panel-header">
            <h3>🎲 Dice Bet</h3>
            <button className="exit-button" onClick={handleExitMiniGame}>
              ✕ Exit (Q)
            </button>
          </div>
          
          {currentBet === null ? (
            <>
              <p>Predict the sum of two dice (2–12)</p>
              
              <div className="bet-numbers">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <button
                    key={num}
                    className={`bet-number ${selectedBet === num ? 'selected' : ''}`}
                    onClick={() => setSelectedBet(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div className="bet-amount-row">
                <label>Bet Amount:</label>
                <div className="bet-amount-controls">
                  <button onClick={() => setInputBetAmount(Math.max(1, inputBetAmount - 10))}>-10</button>
                  <input
                    type="number"
                    value={inputBetAmount}
                    onChange={(e) => setInputBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    min={1}
                    max={money}
                  />
                  <button onClick={() => setInputBetAmount(Math.min(money, inputBetAmount + 10))}>+10</button>
                </div>
              </div>
              
              <div className="quick-bet-buttons">
                <button onClick={() => setInputBetAmount(10)}>10</button>
                <button onClick={() => setInputBetAmount(50)}>50</button>
                <button onClick={() => setInputBetAmount(Math.floor(money / 2))}>Half</button>
                <button onClick={() => setInputBetAmount(money)}>All in</button>
              </div>
              
              <button 
                className="place-bet-button"
                onClick={handlePlaceBet}
                disabled={selectedBet === null || inputBetAmount <= 0 || inputBetAmount > money}
              >
                Place Bet ({inputBetAmount} → {selectedBet || '?'})
              </button>
            </>
          ) : (
            <>
              <div className="current-bet-info">
                <p>Bet placed!</p>
                <p>Predicted sum: <strong>{currentBet}</strong></p>
                <p>Bet amount: <strong>{betAmount}</strong></p>
                <p>If correct: <strong className="win-amount">{betAmount * 2}</strong> won</p>
              </div>
              
              <div className="bet-actions">
                <button className="roll-button" onClick={handleRollDice}>
                  🎲 Roll the dice!
                </button>
                <button className="cancel-button" onClick={handleCancelBet}>
                  Cancel Bet
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {isMiniGameActive && isRolling && (
        <div className="dice-rolling-panel">
          <h3>🎲 Rolling dice...</h3>
          <div className="rolling-animation">⚄ ⚅ ⚃</div>
          <p>Bet: {lastBetForResult} with {lastBetAmountForResult}</p>
        </div>
      )}

      {isMiniGameActive && diceResult && currentRoom === 'minigame1' && (
        <div className={`dice-result-panel ${isWin ? 'win' : 'lose'}`}>
          <h3>{isWin ? '🎉 Win!' : '😢 Lose...'}</h3>
          <div className="result-bet-info">
            Predicted: {lastBetForResult} | Bet: {lastBetAmountForResult}
          </div>
          <div className="dice-values">
            <span className="dice">{diceResult.dice1}</span>
            <span className="plus">+</span>
            <span className="dice">{diceResult.dice2}</span>
            <span className="equals">=</span>
            <span className="total">{diceResult.total}</span>
          </div>
          {isWin && (
            <div className="win-message">
              +{lastBetAmountForResult * 2} won
            </div>
          )}
          {!isWin && (
            <div className="lose-message">
              -{lastBetAmountForResult} lost
            </div>
          )}
          <button className="play-again-button" onClick={() => {
            setDiceResult(null);
            setSelectedBet(null);
            setInputBetAmount(10);
          }}>
            Play Again (E)
          </button>
          <button className="exit-mini-button" onClick={handleExitMiniGame}>
            Exit (Q)
          </button>
        </div>
      )}

      {isLocked && isNearBasketball && currentRoom === 'minigame2' && !isBasketballActive && (
        <div className="interaction-hint">
          [E] Start Basketball Game 🏀
        </div>
      )}

      {isBasketballActive && currentRoom === 'minigame2' && !basketballBetPlaced && !lastBasketballResult && !isLocked && (
        <div className="basketball-panel">
          <div className="panel-header">
            <h3>🏀 Basketball Game</h3>
            <button className="exit-button" onClick={handleExitBasketball}>
              ✕ Exit (Q)
            </button>
          </div>

          <div className="basketball-bet-section">
            <p>Score a basket to earn 2× your bet!</p>
            <div className="bet-amount-row">
              <label>Bet Amount:</label>
              <div className="bet-amount-controls">
                <button onClick={() => setBasketballBetInput(Math.max(1, basketballBetInput - 10))}>-10</button>
                <input
                  type="number"
                  value={basketballBetInput}
                  onChange={(e) => setBasketballBetInput(Math.max(1, parseInt(e.target.value) || 0))}
                  min={1}
                  max={money}
                />
                <button onClick={() => setBasketballBetInput(Math.min(money, basketballBetInput + 10))}>+10</button>
              </div>
            </div>
            <div className="quick-bet-buttons">
              <button onClick={() => setBasketballBetInput(10)}>10</button>
              <button onClick={() => setBasketballBetInput(50)}>50</button>
              <button onClick={() => setBasketballBetInput(Math.floor(money / 2))}>Half</button>
              <button onClick={() => setBasketballBetInput(money)}>All in</button>
            </div>
            <button 
              className="place-bet-button"
              onClick={handleBasketballBetAndStart}
              disabled={basketballBetInput <= 0 || basketballBetInput > money}
            >
              Place Bet & Start ({basketballBetInput})
            </button>
          </div>
        </div>
      )}

      {isBasketballActive && basketballBetPlaced && isLocked && (
        <div className="basketball-hud">
          <div className="basketball-hud-info">
            🏀 Score: {basketballScore} | Bet per round: {basketballBetAmount} | Money: {money} | [Q] Exit
          </div>
          
          {isHoldingBall && (
            <div className="basketball-power-bar">
              <div 
                className="basketball-power-fill" 
                style={{ 
                  width: `${throwPower}%`,
                  backgroundColor: throwPower < 50 ? '#00ff00' : throwPower < 80 ? '#ffff00' : '#ff0000'
                }} 
              />
              <span className="basketball-power-text">{Math.round(throwPower)}%</span>
            </div>
          )}
        </div>
      )}

      {isLocked && isNearSimon && currentRoom === 'minigame3' && !isSimonActive && (
        <div className="interaction-hint">
          [E] Start Simon Game 🎵
        </div>
      )}

      {isSimonActive && !simonBetPlaced && (
        <div className="fullscreen-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="simon-panel">
          <div className="panel-header">
            <h3>🎵 Simon Game</h3>
            <button className="exit-button" onClick={() => {
              exitSimonGame();
              setTimeout(() => {
                const canvas = document.querySelector('canvas');
                canvas?.requestPointerLock();
              }, 100);
            }}>
              ✕ Exit (Q)
            </button>
          </div>

          <div className="simon-rules">
            <p>Memorize and repeat the pattern!</p>
            <p>Each round: bet × round as reward.</p>
          </div>

          <div className="bet-amount-row">
            <label>Bet Amount:</label>
            <div className="bet-amount-controls">
              <button onClick={() => setSimonBetInput(Math.max(1, simonBetInput - 10))}>-10</button>
              <input
                type="number"
                value={simonBetInput}
                onChange={(e) => setSimonBetInput(Math.max(1, parseInt(e.target.value) || 0))}
                min={1}
                max={money}
              />
              <button onClick={() => setSimonBetInput(Math.min(money, simonBetInput + 10))}>+10</button>
            </div>
          </div>
          <div className="quick-bet-buttons">
            <button onClick={() => setSimonBetInput(10)}>10</button>
            <button onClick={() => setSimonBetInput(50)}>50</button>
            <button onClick={() => setSimonBetInput(Math.floor(money / 2))}>Half</button>
            <button onClick={() => setSimonBetInput(money)}>All in</button>
          </div>
          <button 
            className="place-bet-button"
            onClick={() => {
              if (startSimonGame(simonBetInput)) {
                setTimeout(() => {
                  const canvas = document.querySelector('canvas');
                  canvas?.requestPointerLock();
                }, 100);
              }
            }}
            disabled={simonBetInput <= 0 || simonBetInput > money}
          >
            Start Game ({simonBetInput})
          </button>
        </div>
        </div>
      )}

      {isSimonActive && simonBetPlaced && isLocked && !simonIsGameOver && (
        <div className="simon-hud">
          <div className="simon-hud-info">
            🎵 Score: {simonScore} | Money: {money} | [Q] Exit
          </div>
          <div className="simon-message">{simonGameMessage}</div>
        </div>
      )}

      {isSimonActive && simonIsGameOver && (
        <div className="fullscreen-overlay">
        <div className="simon-gameover">
          <h2>{simonScore >= 10 ? '🎉 Clear!' : 'Game Over!'}</h2>
          <p>Final Score: {simonScore}</p>
          <div className="result-buttons">
            <button className="play-again-button" onClick={() => {
              exitSimonGame();
              setSimonBetInput(10);
              useGameStore.getState().setIsSimonActive(true);
            }}>
              Play Again
            </button>
            <button className="exit-button" onClick={() => {
              exitSimonGame();
              setTimeout(() => {
                const canvas = document.querySelector('canvas');
                canvas?.requestPointerLock();
              }, 100);
            }}>
              Exit (Q)
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
