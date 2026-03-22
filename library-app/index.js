const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use("/api/books", require("./routes/books"));
app.use("/api/issues", require("./routes/issues"));

app.listen(3000, () => console.log("Library app running on port 3000"));