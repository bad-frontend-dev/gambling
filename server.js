const express = require("express");
const session = require("express-session");
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const DB_USERNAME = process.env.MONGO_USERNAME;
const DB_PASSWORD = process.env.MONGO_PASSWORD;

const userRegex = /[^A-Za-z0-9_-]/gm;

const url = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@localhost:27017/`;
const client = new MongoClient(url);

const app = express();

app.use(express.static(path.join(__dirname, "/public")));

app.use(
    session({
        secret: "meow",
        cookie: {
            secure: false,
            sameSite: true,
        },
        resave: false,
        saveUninitialized: true,
    })
);

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

    updateLeaderboard({
        username: user,
        money: money,
    })
        .then(() => {
            req.session.money = 0;
            res.send({
                message: `successfully cashed out $${money} (reload to restart)`,
            });
        })
        .catch(() => {
            res.sendStatus(400);
        });
});

app.get("/leaderboard", (req, res) => {
    getLeaderboard().then((data) => {
        res.send(data);
    });
});

async function updateLeaderboard({ username, money }) {
    await client.connect();
    const db = client.db("gambling");
    const leaderboard = db.collection("leaderboard");
    leaderboard
        .insertOne({
            username: username,
            money: money,
        })
        .then(() => {
            console.log(`user "${username}" cashed out $${money}`);
        })
        .finally(() => {
            client.close();
        });
}

async function getLeaderboard() {
    await client.connect();
    const db = client.db("gambling");
    const leaderboard = db.collection("leaderboard");
    const results = await leaderboard
        .find()
        .project({ _id: false })
        .sort({
            money: -1,
        })
        .limit(10)
        .toArray();

    return results;
}

app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});
