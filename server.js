import express from "express";
import session from "express-session";
import { rateLimit } from "express-rate-limit";
import path from "path";
import fs from "fs";
import "dotenv/config";

const __dirname = process.cwd();

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || "secret";

const userRegex = /[^A-Za-z0-9_-]/gm;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: "stop sending so many requests!!!11",
});

if (!fs.existsSync("leaderboard.json")) {
    fs.writeFileSync("leaderboard.json", "[]");
}

const app = express();

app.use(express.static(path.join(__dirname, "/public")));

app.use(
    session({
        secret: SECRET,
        cookie: {
            secure: false,
            sameSite: true,
        },
        resave: false,
        saveUninitialized: true,
    })
);

app.use("/submit", limiter);

app.get("/reset", (req, res) => {
    req.session.money = 100;
    res.send({
        money: req.session.money,
    });
});

app.get("/gamble", (req, res) => {
    const bet = parseInt(req.query.bet) || 1;
    let money = req.session.money ?? 100;

    if (bet < 0 || bet > money) {
        res.sendStatus(400);
        return;
    }

    const win = Math.round(Math.random());

    req.session.money = money + bet * (win ? -1 : 1);

    res.send({
        money: req.session.money,
        win: win === 0,
    });
});

app.get("/submit", (req, res) => {
    const user = req.query.username;
    const money = req.session.money;

    if (userRegex.test(user) || user.length > 20) {
        res.sendStatus(400);
        return;
    }
    if (!money) {
        res.sendStatus(400);
        return;
    }

    try {
        updateLeaderboard({
            username: user,
            money: money,
        });
        req.session.money = 0;
        res.send({
            message: `successfully cashed out $${money} (reload to restart)`,
        });
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get("/leaderboard", (req, res) => {
    try {
        const leaderboard = JSON.parse(
            fs.readFileSync("leaderboard.json", "utf-8")
        );

        res.json(leaderboard);
    } catch (error) {
        console.log(error);
        res.status(500);
    }
});

function updateLeaderboard({ username, money }) {
    const leaderboard = JSON.parse(
        fs.readFileSync("leaderboard.json", "utf-8")
    );

    leaderboard.push({
        username: username,
        money: money,
    });

    leaderboard.sort((a, b) => b.money - a.money);

    if (leaderboard.length > 10) {
        leaderboard.pop();
    }

    fs.writeFileSync("leaderboard.json", JSON.stringify(leaderboard));
}

app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});
