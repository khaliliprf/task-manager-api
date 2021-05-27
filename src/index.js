const app = require("./app");

const port = process.env.PORT;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server is up on port ${port}`);
});
