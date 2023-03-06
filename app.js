const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express(); // instanceof express.
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(59111, () => {
      console.log("Server Running at http://localhost:59111/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// API-1 Returns a list of all todos whose status is 'TO DO'

const functionStatus = (object) => {
  return object.status !== undefined;
};

const functionPriority = (object) => {
  return object.priority !== undefined;
};

const functionStatusAndPriority = (object) => {
  return object.priority !== undefined && object.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let sqlQuery = "";
  switch (true) {
    case functionStatusAndPriority(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}'
          AND priority='${priority}';`;
      break;
    case functionPriority(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}'`;
      break;
    case functionStatus(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status LIKE "%${status}%"`;
      break;
    default:
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }

  const queryResponse = await db.all(sqlQuery);
  response.send(queryResponse);
});

// API-2 Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params; // path parameter;
  const query1 = `SELECT * FROM todo WHERE id=${todoId};`;
  const response1 = await db.get(query1); // all(),get(),run(),exec() sqlite methods;
  response.send(response1);
});

// API-3 Create a todo in the todo table,

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const query2 = `INSERT INTO todo(id,todo,priority,status)
    VALUES
    (
    ${id},
    '${todo}',
    '${priority}',
    '${status}');`;
  await db.run(query2);
  response.send("Todo Successfully Added");
});

// API-4 Updates the details of a specific todo based on the todo ID

const updateStatus = (object1) => {
  return object1.status !== undefined;
};

const updatePriority = (object1) => {
  return object1.priority !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;
  let updateQuery = "";
  let updateResponse = null;

  switch (true) {
    case updateStatus(request.body):
      updateQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
      updateResponse = "Status Updated";
      break;
    case updatePriority(request.body):
      updateQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      updateResponse = "Priority Updated";
      break;
    default:
      updateQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
      updateResponse = "Todo Updated";
  }
  await db.run(updateQuery);
  response.send(updateResponse);
});

// API-5 Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params; // path parameter;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
