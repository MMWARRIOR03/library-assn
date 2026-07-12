const express = require("express");
const router = express.Router();
const { PutCommand, ScanCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../db/dynamo");
const crypto = require("crypto");

//issue a book
router.post("/", async (req, res) => {
  const { bookId, memberId, memberName } = req.body;

  //check availability
  const bookResult = await docClient.send(new GetCommand({ TableName: "Books", Key: { bookId } }));
  const book = bookResult.Item;
  if (!book || book.availableCopies < 1)
    return res.status(400).json({ error: "Book not available" });

  //create issue record
  const issue = {
    issueId: crypto.randomUUID(),
    bookId, memberId, memberName,
    bookTitle: book.title,
    issueDate: new Date().toISOString().split("T")[0],
    returnDate: null,
    status: "issued"
  };
  await docClient.send(new PutCommand({ TableName: "IssuedBooks", Item: issue }));

  //decrement available copies
  await docClient.send(new UpdateCommand({
    TableName: "Books",
    Key: { bookId },
    UpdateExpression: "SET availableCopies = availableCopies - :dec",
    ExpressionAttributeValues: { ":dec": 1 }
  }));

  res.json({ message: "Book issued", issue });
});

//return a book
router.put("/return/:issueId", async (req, res) => {
  const { issueId } = req.params;

  const issueResult = await docClient.send(new GetCommand({ TableName: "IssuedBooks", Key: { issueId } }));
  const issue = issueResult.Item;
  if (!issue || issue.status === "returned")
    return res.status(400).json({ error: "Invalid issue record" });

  //update issue status
  await docClient.send(new UpdateCommand({
    TableName: "IssuedBooks",
    Key: { issueId },
    UpdateExpression: "SET #s = :s, returnDate = :rd",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":s": "returned", ":rd": new Date().toISOString().split("T")[0] }
  }));

  //increment available copy
  await docClient.send(new UpdateCommand({
    TableName: "Books",
    Key: { bookId: issue.bookId },
    UpdateExpression: "SET availableCopies = availableCopies + :inc",
    ExpressionAttributeValues: { ":inc": 1 }
  }));

  res.json({ message: "Book returned successfully" });
});

//get all issued records
router.get("/", async (req, res) => {
  const result = await docClient.send(new ScanCommand({ TableName: "IssuedBooks" }));
  res.json(result.Items);
});

module.exports = router;
