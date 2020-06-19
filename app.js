const express = require("express");
const redis = require("redis");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const app = express();

const sendREsponse = (username, repos) => {
  return `<h1>${username} has ${repos} Github repos </h1>`;
};

const client = redis.createClient(REDIS_PORT);

//make rrequest to github for data
async function getrepos(req, res, next) {
  try {
    console.log("fetching data");
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();

    const repos = data.public_repos;

    //set data to redis
    client.setex(username, 3600, repos, (success) => {
      if (success) {
        console.log(`set repos to ${username} `);
      }
    });

    //res.send(data);
    res.send(sendREsponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

//cash middleware
const cache = (req, res, next) => {
  const { username } = req.params;
  client.get(username, (err, reply) => {
    if (err) {
      throw err;
    }
    if (reply !== null) {
      res.send(sendREsponse(username, reply));
    } else {
      next();
    }
  });
};

app.get("/repos/:username", cache, getrepos);

app.listen(PORT, (err) => {
  if (!err) {
    console.log(`server started at ${PORT}`);
  }
});
