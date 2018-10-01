process.on("message", function(message) {
  console.log("Child recieved message with type", message.type);
  switch (message.type) {
    case "HEALTH_CHECK": {
      process.send({
        type: "HEALTH_CHECK",
        mysql: true, // check connection to mysql is working
        jobProcess: true // assume a response means this service is healthy
        // ...other processes
      });
      return;
    }
    case "FETCH": {
      Promise.all([timeout(), request()]).then(() => {
        process.send({
          type: "FETCH",
          success: true
        });
      });
      return;
    }
    default: {
      console.log("child process doesn't know how to handle", message.type);
    }
  }
});

const timeout = () =>
  new Promise(resolve => {
    setTimeout(() => {
      console.log("Child process timeout complete");
      resolve();
    }, 3000);
  });

const request = () =>
  new Promise(resolve => {
    setTimeout(() => {
      console.log("Child process fake request complete");
      resolve();
    }, Math.random() * 5000); // It will take between 0 and 5 seconds to complete
  });
