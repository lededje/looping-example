const express = require("express");

const { fork } = require("child_process");
const { createServer } = require("http");

const child = fork("./job");

const port = 3000;

let status = "STOPPED"; // STOPPED | STARTED
let childStatus = "WAITING"; // WAITING | SLEEPING | WORKING

const server = express();

server.get("/healthcheck", (req, res) => {
  console.log("User asked for a health check");
  const healthCheckListener = message => {
    if (message.status === false) res.send(500); // Not healthy
    console.log(message);
    res.json({
      mysql: message.mysql,
      childProcess: message.childProcess,
      processStatus: status,
      childStatus
    });
    child.removeListener("message", healthCheckListener);
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

const timeout = () =>
  new Promise(resolve => {
    setTimeout(() => {
      console.log("Child process timeout complete");
      resolve();
    }, 3000);
  });

child.on("message", message => {
  if (message.type === "FETCH") {
    console.log("Message recieved from child");
    // Check if response was successful
    childStatus = "WAITING";
    if (status === "STARTED") {
      console.log("Process status is started so sending another fetch");
      sendFetchRequest();
    } else {
      console.log("Process status is stopped so not sening another fetch...");
    }
  }
});

const sendFetchRequest = () => {
  switch (childStatus) {
    case "WAITING": {
      childStatus = "SLEEPING";
      timeout().then(() => {
        childStatus = "WORKING";
        child.send({
          type: "FETCH"
        });
      });
      return;
    }
    case "SLEEPING":
    case "WORKING":
    default:
    // do nothing.
  }
};

createServer(server).listen(port, err => {
  if (err) throw err;
  const site = `http://localhost:${port}`;
  console.log(`> Ready on ${site}`);
});
