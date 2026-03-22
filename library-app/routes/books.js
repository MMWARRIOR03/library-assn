const express = require("express");
const router = express.Router();
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../db/dynamo");
const { v4: uuidv4 } = require("uuid");

const TABLE = "Books";

//add a book
router.post("/", async (req, res) => {
  const { title, author, genre, totalCopies } = req.body;
  const item = {
    bookId: uuidv4(),
    title, author, genre,
    totalCopies: Number(totalCopies),
    availableCopies: Number(totalCopies)
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  res.json({ message: "Book added", book: item });
});

//get all books
router.get("/", async (req, res) => {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
  res.json(result.Items);
});

//get single book
router.get("/:id", async (req, res) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { bookId: req.params.id }
  }));
  res.json(result.Item);
});

//delete a book
router.delete("/:id", async (req, res) => {
  await docClient.send(new DeleteCommand({
    TableName: TABLE,
    Key: { bookId: req.params.id }
  }));
  res.json({ message: "Book deleted" });
});

module.exports = router;