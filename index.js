const express = require("express");

const { fork } = require("child_process");
const { createServer } = require("http");

const child = fork("./job");

const port = 3000;

let status = "STOPPED"; // STOPPED | STARTED

const server = express();

server.get("/healthcheck", (req, res) => {
  console.log("User asked for a health check");
  const healthCheckListener = message => {
    if (message.status === false) res.send(500); // Not healthy
    res.json(message.payload);
    child.removeListener(healthCheckListener);
  };

  child.on("message", healthCheckListener);
  child.send({
    type: "HEALTH_CHECK"
  });
});

server.get("/stop", (req, res) => {
  console.log("User asked process to stop");
  stop();
  res.send({ status });
});

server.get("/start", (req, res) => {
  console.log("User asked process to start");
  start();
  res.send({ status });
});

const stop = () => {
  console.log("Stopping after next job");
  status = "STOPPED";
};

const start = () => {
  console.log("Starting");
  status = "STARTED";
  sendFetchRequest();
};

child.on("message", message => {
  console.log("Message recieved from child");
  if (status === "STARTED") {
    console.log("Process status is started so sending another fetch");
    sendFetchRequest();
  } else {
    console.log("Process status is stopped so not sening another fetch...");
  }
});

const sendFetchRequest = () => {
  console.log("Sending FETCH work order to child");
  child.send({
    type: "FETCH"
  });
};

createServer(server).listen(port, err => {
  if (err) throw err;
  const site = `http://localhost:${port}`;
  console.log(`> Ready on ${site}`);
});
