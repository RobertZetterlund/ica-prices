import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

import games from "../../assets/games.json";
const GAMES_AMT = Object.keys(games).length;
const GUESSES = [0, 1, 2, 3, 4];

const GUESS_COLOR_EMOJI = {
  red: "🟥",
  orange: "🟧",
  green: "✅",
};

const PROXIMITY_EMOJI = {
  correct: "",
  above: "⬇️",
  below: "⬆️",
};

/** Ica-Priset #1 3/5
 * ⬇️🟥
 * ⬇️🟥
 * ✅
 * https://ica-prices.vercel.app/
 */
function createSharableLink(guesses, day) {
  return `ICA-priset #${day} ${guesses.length}/5 \n${guesses
    .map((guess) => {
      return `${
        PROXIMITY_EMOJI[guess.proximity] +
        (guess.offBy === 0 ? "⭐" : GUESS_COLOR_EMOJI[guess.color])
      }`;
    })
    .join("\n")}`;
}

function Home() {
  const dayId = useMemo(() => {
    // All the prices were grabbed on this date :shrug:
    const startDate = new Date("2024-06-17").toString();
    const today = new Date().toString();
    return Math.max(
      1,
      Math.min(
        GAMES_AMT,
        Math.ceil((Date.parse(today) - Date.parse(startDate)) / 86400000) %
          GAMES_AMT
      )
    );
  }, []);

  const gameId = `game-${dayId}`;
  const game = games[gameId];
  const [guesses, setGuesses] = useState([]);

  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef();

  const handleClickShare = useCallback(() => {
    const text = createSharableLink(guesses, dayId);
    if (isMobile && navigator.canShare) {
      navigator
        .share({
          title: "ICA-priset",
          text: text,
          url: window.location.href,
        })
        .then((err) => {
          console.error("Unable to share: ", err);
        });
    } else {
      navigator.clipboard?.writeText(`${text}\n${window.location.href}`);
      setShowToast(true);
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  }, [guesses, dayId]);

  useEffect(() => {
    setGuesses(JSON.parse(localStorage.getItem(gameId) ?? "[]"));
  }, [gameId]);

  const [input, setInput] = useState("");
  const numericInput = useMemo(() => {
    const normalized = input.replace(/[^0-9.]/, ".");
    return Number(normalized);
  }, [input]);

  const performGuess = useCallback(
    (guessValue) => {
      const guessNum = Number(guessValue);
      const actualNum = Number(game.price);

      const offBy = actualNum - guessNum;

      const offByPercentage =
        Math.abs((actualNum - guessNum) / actualNum) * 100;

      // Correct is regarded to be within 2 percent.
      const isCorrect = offByPercentage <= 2;

      const proximity = isCorrect
        ? "correct"
        : guessNum > actualNum
        ? "above"
        : "below";

      // orange, i.e. close is 15 percent.
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

  const dialogRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.nodeName === "BODY") {
        dialogRef.current.close();
      }
    };

    addEventListener("click", handler);
    return () => removeEventListener("click", handler);
  }, []);

  return (
    <>
      <div className={`share-toast ${showToast ? "show" : ""}`}>
        ✓ Kopierat till Urklipp!
      </div>
      <header>
        <button
          onClick={() =>
            dialogRef.current.open
              ? dialogRef.current.close()
              : dialogRef.current.show()
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <path
              fill-rule="evenodd"
              fill="#e13205"
              d="M16 25a9.01 9.01 0 0 1 0-18 9.01 9.01 0 0 1 0 18m0-20C9.94 5 5 9.94 5 16s4.93 11 11 11 11-4.93 11-11S22.07 5 16 5m-.4 13.79c.65 0 1.16.53 1.16 1.14 0 .62-.5 1.15-1.17 1.15a1.16 1.16 0 0 1-1.16-1.15c0-.61.5-1.14 1.16-1.14m-.9-1.04c0-.95.36-1.43 1.04-2.17.7-.73.94-1.05.94-1.61 0-.5-.33-.91-1.06-.91-.55 0-1.02.3-1.29.56-.07.07-.14.05-.18-.03l-.7-1.57c-.03-.08-.02-.14.04-.2a3.3 3.3 0 0 1 2.2-.76c2.18 0 3.04 1.48 3.04 2.76 0 1.09-.5 1.73-1.32 2.63-.63.7-.88 1.03-.88 1.5v.04c0 .08-.04.14-.14.14h-1.56c-.1 0-.14-.06-.14-.14z"
            />
          </svg>
        </button>
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
        <dialog ref={dialogRef}>
          <p>
            Spelet går ut på att gissa priset på varor från ICA Focus på fem
            försök.
          </p>
          <p>
            Rätt svar erhålles när antalet försök tar slut eller om du gissat
            rätt med en felmarginal på 2%.
          </p>

          <div className="guess-examples">
            <h3>Exempel</h3>
            <div>
              <GuessContainer
                guess={{
                  offBy: 20,
                  round: 1,
                  value: 30,
                  color: "red",
                  proximity: "below",
                }}
              />
              <span>För billigt gissat: mer än 15% ifrån</span>
            </div>
            <div>
              <GuessContainer
                guess={{
                  offBy: 5,
                  round: 1,
                  value: 55,
                  color: "orange",
                  proximity: "above",
                }}
              />
              <span>För dyrt gissat: mindre än 15% ifrån</span>
            </div>
            <div>
              <GuessContainer
                guess={{
                  offBy: 0,
                  round: 1,
                  value: 50,
                  color: "green",
                  proximity: "correct",
                }}
              />
              <span>Gissningen var korrekt!</span>
            </div>
            <StampButton
              text={"Tillbaka"}
              onClick={() => dialogRef.current.close()}
            />
          </div>
        </dialog>
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
          {game_fin && (
            <button className="copy-result" onClick={handleClickShare}>
              Kopiera resultat
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 50 50"
                width="24px"
                height="24px"
                fill="currentColor"
              >
                <path d="M30.3 13.7 25 8.4l-5.3 5.3-1.4-1.4L25 5.6l6.7 6.7z" />
                <path d="M24 7h2v21h-2z" />
                <path d="M35 40H15c-1.7 0-3-1.3-3-3V19c0-1.7 1.3-3 3-3h7v2h-7c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1h20c.6 0 1-.4 1-1V19c0-.6-.4-1-1-1h-7v-2h7c1.7 0 3 1.3 3 3v18c0 1.7-1.3 3-3 3z" />
              </svg>
            </button>
          )}
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
              performGuess(numericInput);
            }}
          >
            <div className="price-input">
              <input
                type={isMobile ? undefined : "number"}
                disabled={game_fin}
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
            <StampButton
              disabled={game_fin || numericInput === NaN || !numericInput}
              text="Gissa"
            />
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
      <div
        className={`guess-result ` + guess.color}
        title={
          guess.proximity === "above"
            ? "Rätt pris är lägre"
            : guess.proximity === "below"
            ? "Rätt pris är högre"
            : ""
        }
      >
        {proximityToSymbol[guess.proximity]}
      </div>
    </div>
  );
}

function StampButton({ disabled, text, onClick }) {
  const [pressed, setPressed] = useState(false);

  const handleOnClick = useCallback(() => {
    setPressed(true);
    setTimeout(() => {
      onClick?.();
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

// iPhone with comma instead of dot causes headache, lets ignore it and put
// this piece of bandage on it
const isMobile = (function (a) {
  return !!(
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
      a
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      a.substr(0, 4)
    )
  );
})(
  (typeof navigator !== "undefined" &&
    (navigator?.userAgent || navigator?.vendor)) ||
    (typeof window !== "undefined" && window?.opera) ||
    ""
);
