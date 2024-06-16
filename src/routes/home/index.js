import { h } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import games from "../../assets/games.json";

const GUESSES = [0, 1, 2, 3, 4];

function Home() {
  const dayId = useMemo(() => {
    const startDate = new Date("2024-06-17").toString();
    const today = new Date().toString();
    return Math.max(
      1,
      Math.min(
        327,
        Math.ceil((Date.parse(today) - Date.parse(startDate)) / 86400000) % 327
      )
    );
  }, []);

  const gameId = `game-${dayId}`;
  const game = games[gameId];
  const [guesses, setGuesses] = useState([]);

  useEffect(() => {
    setGuesses(JSON.parse(localStorage.getItem(gameId) ?? "[]"));
  }, [gameId]);

  const [input, setInput] = useState("");

  const performGuess = useCallback(
    (guessValue) => {
      const guessNum = Number(guessValue);
      const actualNum = Number(game.price);

      const offBy = actualNum - guessNum;

      const offByPercentage =
        Math.abs((actualNum - guessNum) / actualNum) * 100;

      const isCorrect = offByPercentage <= 0.5;

      const proximity = isCorrect
        ? "correct"
        : guessNum > actualNum
        ? "above"
        : "below";

      const color = isCorrect
        ? "green"
        : offByPercentage < 15
        ? "orange"
        : "red";

      const guess = {
        offBy,
        round: guesses.length,
        value: guessNum,
        color,
        proximity,
      };

      setGuesses((arr) => {
        const newArr = [...arr, guess];
        localStorage.setItem(gameId, JSON.stringify(newArr));
        return newArr;
      });

      setInput("");
    },
    [game.price, gameId]
  );

  const correctGuess = useMemo(() => {
    return !!guesses.find((g) => g.proximity === "correct");
  }, [guesses]);
  const game_fin = guesses.length >= 5 || correctGuess;
  const loss = game_fin && !correctGuess;
  const win = game_fin && !loss;

  return (
    <>
      <header>
        <h1>
          <svg viewBox="0 7.77 32 16.449" width="48px">
            <path
              fill="#e13205"
              d="M0 8.208h3.986v15.726H0V8.208m23.042-.438L32 23.934h-4.534l-.986-1.752h-4.512l1.577-2.848h1.358l-1.862-3.373-1.949 3.504a13.904 13.904 0 01-.92 1.446 8.172 8.172 0 01-6.571 3.308c-4.49 0-8.148-3.658-8.148-8.148s3.658-8.148 8.148-8.148c1.533 0 2.913.416 4.118 1.117l-1.927 3.482a4.265 4.265 0 00-2.19-.613c-2.3 0-4.161 1.862-4.161 4.162s1.862 4.162 4.161 4.162c1.249 0 2.278-.526 3.023-1.292.328-.329.701-.876.81-1.073l5.607-10.097"
            ></path>
          </svg>
          -priset?
        </h1>
      </header>
      <main>
        <div className="image-container">
          <img src={game.image} alt={game.name} />
          <span>{game.name}</span>
        </div>
        <div className="result-container">
          <span>
            {loss
              ? "Du fick slut på gissningar."
              : win
              ? "Du gissade rätt!"
              : ""}
          </span>
          <h2>{game_fin && `Pris: ${game.price} kr`}</h2>
        </div>
        <div className="content">
          <div className="guesses">
            {GUESSES.map((i) => (
              <GuessContainer key={i} guess={guesses[i]} />
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performGuess(input);
            }}
          >
            <div className="price-input">
              <input
                disabled={game_fin}
                type="number"
                value={input}
                onInput={(e) => {
                  setInput(e.currentTarget.value);
                }}
                min="0"
                step="any"
                autoFocus
                placeholder="0.00"
                inputmode="decimal"
              />
              <span className="currency">kr</span>
            </div>
            <StampButton disabled={game_fin || input === ""} text="Gissa" />
          </form>
        </div>
      </main>
      <footer>
        Skapat av{" "}
        <mark>
          <a href="https://github.com/RobertZetterlund">Robert</a>
        </mark>
        , inspirerat av <a href="https://costcodle.com/">Kerm</a>
      </footer>
    </>
  );
}

const proximityToSymbol = {
  above: "↓",
  below: "↑",
  correct: "✓",
};

function GuessContainer({ guess }) {
  if (!guess) {
    return <div className="guess-container" />;
  }

  return (
    <div className="guess-container">
      <div>{guess.value} kr</div>
      <div className={`guess-result ` + guess.color}>
        {proximityToSymbol[guess.proximity]}
      </div>
    </div>
  );
}

function StampButton({ disabled, text }) {
  const [pressed, setPressed] = useState(false);

  const handleOnClick = useCallback(() => {
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
    }, 200);
  }, []);

  return (
    <button
      className="stamp-button"
      onClick={handleOnClick}
      type="submit"
      disabled={disabled}
    >
      <span className={"button-span " + (pressed ? "press" : "")}>{text}</span>
    </button>
  );
}
export default Home;
