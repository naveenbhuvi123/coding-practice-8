const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
        SELECT 
           * 
        FROM 
          todo
        WHERE
           todo LIKE '%${search_q}%'
           AND status = '${status}'
           AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT 
        * 
      FROM 
        todo
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT 
        * 
        FROM 
          todo
        WHERE
           todo LIKE '%${search_q}%'
           AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
        SELECT 
           * 
        FROM 
          todo
        WHERE
           todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//RETURN SPECIFIC TODO
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT 
     * 
  FROM
     todo
  WHERE 
     id = ${todoId};`;
  const dbResponse = await db.get(getTodoQuery);
  response.send(dbResponse);
});

//CREATE TODO API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
    INSERT INTO 
    todo(id, todo, priority, status)
    VALUES 
     (
          ${id},
         '${todo}',
          '${priority}',
          '${status}'
     );`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//UPDATE DETAILS OF TODO API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
   SELECT 
      * 
    FROM 
      todo
    WHERE
       id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todos = previousTodo.todo,
    statuses = previousTodo.status,
    priorities = previousTodo.priority,
  } = request.body;
  const updateTodoQuery = `
    UPDATE todo
    SET 
        todo = '${todos}',
        priority = '${priorities}',
        status = '${statuses}'
    WHERE 
     id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//DELETE TODO FROM TABLE API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  const deleteTodo = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
