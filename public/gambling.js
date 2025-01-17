let theCollegeFund = 100;
let gambling = false
const usernameRegex = /[^a-zA-Z0-9_]/gm;

window.onload = () => {
    fetch("/reset").then((response) => {
	return response.json();
    }).then((data) => {
	if (data.money) {
	    updateMoney(data.money);
	}
    })
    loadLeaderboard()
    document.getElementById("bet").focus();
}

document.getElementById("gamble").addEventListener("click", gamble);

document.getElementById("bet").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
	gamble();
    }
})

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
    fetch(`/submit?username=${username}`).then(response => {
	return response.json();
    }).then(data => {
	if (data.message) {
	    showMessage(data.message)
	    updateMoney(0)
	    loadLeaderboard()
	}
    }).catch(() => {
    	showMessage("something went wrong")
    })
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
    if (gambling) return
    gambling = true
    showMessage("gambling...");
    fetch(`/gamble?bet=${bet}`)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.money || data.money === 0) {
                updateMoney(data.money);
                showMessage(`you ${data.win ? "win" : "lost"} $${bet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
		gambling = false
            }
        })
        .catch(() => {
            showMessage("something went wrong :(");
        });
}

function loadLeaderboard() {
    fetch("/leaderboard").then((response) => {
	return response.json();
    }).then((data) => {
	const leaderboard = document.getElementById("leaderboard")
	leaderboard.innerHTML = data.map(({ username, money }) => {
	    return `<li>${username}: $${money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</li>`
	}).join("")
    })
}

function updateMoney(money) {
    theCollegeFund = money
    document.getElementById("money").innerHTML = `you have $${money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function showMessage(message) {
    document.getElementById("info").innerHTML = message;
}
