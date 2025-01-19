let theCollegeFund = 100;
let gambling = false;

const usernameRegex = /[^a-zA-Z0-9_]/gm;

window.addEventListener("load", async () => {
    document.getElementById("bet").focus();

    fetch("/reset")
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.money) {
                updateMoney(data.money);
            }
        });

    await loadLeaderboard();
});

document.getElementById("gamble").addEventListener("click", gamble);

document.getElementById("bet").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        gamble();
    }
});

document.getElementById("cash-out").addEventListener("click", () => {
    const username = document.getElementById("username").value;

    if (username.length === 0 || usernameRegex.test(username)) {
        showMessage("enter an actually valid username pls");
        return;
    }
    if (username.length > 20) {
        showMessage("username is too long idriot");
        return;
    }
    fetch(`/submit?username=${username}`)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.message) {
                showMessage(data.message);
                updateMoney(0);
                loadLeaderboard();
            }
        })
        .catch(() => {
            showMessage("something went wrong");
        });
});

function gamble() {
    const bet = parseInt(document.getElementById("bet").value);
    if (!bet) {
        showMessage("invalid input :(");
        return;
    }
    if (bet > theCollegeFund) {
        showMessage("the bet is too high");
        return;
    }
    if (theCollegeFund == 0) {
        showMessage("youre out of money");
        return;
    }
    if (bet < 0) {
        showMessage("you cant bet in the negatives idiort");
        return;
    }
    if (gambling) return;

    gambling = true;

    showMessage("gambling...");

    fetch(`/gamble?bet=${bet}`)
        .then((response) => {
            return response.json();
        })
        .then(({ win, money }) => {
            if (money || money === 0) {
                updateMoney(money);
                showMessage(`you ${win ? "win" : "lost"} $${formatMoney(bet)}`);
                gambling = false;
            }
        })
        .catch(() => {
            showMessage("something went wrong :(");
        });
}

async function loadLeaderboard() {
    fetch("/leaderboard")
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            const leaderboard = document.getElementById("leaderboard");

            leaderboard.innerHTML = data
                .map(({ username, money }) => {
                    return `<li>${username}: $${formatMoney(money)}</li>`;
                })
                .join("");
        });
}

function formatMoney(int) {
    return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateMoney(money) {
    theCollegeFund = money;
    document.getElementById("money").innerHTML = `you have $${formatMoney(
        money
    )}`;
}

function showMessage(message) {
    document.getElementById("info").innerHTML = message;
}
