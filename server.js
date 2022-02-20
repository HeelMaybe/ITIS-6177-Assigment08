const express = require("express");
const app = express();
const port = 3000;
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const Joi = require("joi");

const options = {
  definition: {
    info: {
      title: "Assignment 08",
      version: "1.0.0",
      description: "Rest-like API with Swagger by Graham Helton",
    },
    host: "68.183.133.173:3000",
    basePath: "/",
  },
  apis: ["./server.js"], // files containing annotations as above
};

const specs = swaggerJsdoc(options);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const mariadb = require("mariadb");
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "sample",
  port: 3306,
  connectionLimit: 5,
});

pool
  .getConnection()
  .then((conn) => {
    console.log("connected ! connection id is " + conn.threadId);
    conn.release(); //release to pool
  })
  .catch((err) => {
    console.log("not connected due to error: " + err);
  });

/**
 * @swagger
 * /api/agents:
 *    get:
 *     summary: Returns all agents
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: Array of Agent Objects
 *         400:
 *              description: error
 */
app.get("/api/agents", async function (req, res) {
  //connect to the database
  //perform the request that you need (SQL)
  //define the header
  //res.json(rows);
  try {
    const sqlQuery = "SELECT * FROM agents";
    const rows = await pool.query(sqlQuery);
    res.header("Content-Type", "application/json");
    res.status(200).json(rows);
    console.log(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

/**
 * @swagger
 * /api/companys:
 *    get:
 *     summary: Returns all companys
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: Array of company Objects
 *         400:
 *              description: error
 */
app.get("/api/companys", async function (req, res) {
  //connect to the database
  //perform the request that you need (SQL)
  //define the header
  //res.json(rows);
  try {
    const sqlQuery = "SELECT * FROM company";
    const rows = await pool.query(sqlQuery);
    res.header("Content-Type", "application/json");
    res.status(200).json(rows);
    console.log(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

const idSchema = Joi.object({
  id: Joi.number().min(1).max(20).required(),
});

/**
 * @swagger
 * /api/company/{id}:
 *    get:
 *     summary: Returns a company be ID
 *     parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       type: integer
 *       description: The ID of the company to return.
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: a Company Object
 *         400:
 *              description: error
 */
app.get("/api/company/:id", async function (req, res) {
  //connect to the database
  //perform the request that you need (SQL)
  //define the header
  //res.json(rows);
  try {
    //const validateId = await idSchema.validateAsync(req.params.id);

    const sqlQuery = "SELECT * FROM company WHERE COMPANY_ID=?";
    const rows = await pool.query(sqlQuery, req.params.id);
    res.header("Content-Type", "application/json");
    res.status(200).json(rows);
    console.log(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

const wholeCompanySchema = Joi.object({
  COMPANY_ID: Joi.string().min(1).required(),
  COMPANY_NAME: Joi.string().min(1).required(),
  COMPANY_CITY: Joi.string().min(1).required(),
});

/**
 * @swagger
 * /api/company/:
 *    post:
 *      summary: creates a new company
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: company
 *          desription: The company to create.
 *          schema:
 *            type: object
 *            required: true
 *            properties:
 *              COMPANY_ID:
 *                type: string
 *              COMPANY_NAME:
 *                type: string
 *              COMPANY_CITY:
 *                type: string
 *      responses:
 *        201:
 *          description: Created
 *        422:
 *              description: Unprocessable Entity
 *        400:
 *              description: error
 *        409:
 *              description: Resource already exists with that ID, try another ID
 */
app.post("/api/company", async function (req, res) {
  try {
    const validate = await wholeCompanySchema.validateAsync(req.body);
    console.log(validate);
    const sqlQuery =
      "INSERT INTO company (COMPANY_ID, COMPANY_NAME, COMPANY_CITY) VALUES (?,?,?)";
    const result = await pool.query(sqlQuery, [
      validate.COMPANY_ID,
      validate.COMPANY_NAME,
      validate.COMPANY_CITY,
    ]);
    res.status(201).send({ msg: "Created Company", result: validate });
  } catch (error) {
    if (error.isJoi === true) {
      res.status(422).send(error.message);
    } else if (error.errno == 1062) {
      res
        .status(409)
        .send({ msg: "Resource already exists with that ID, try another ID" });
    } else {
      res.status(400).send(error.message);
    }
  }
});

/**
 * @swagger
 * /api/company/{id}:
 *    delete:
 *     summary: Deletes a company by ID
 *     parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       type: string
 *       description: The ID of the company to delete.
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: Company deleted
 *         404:
 *              description: Resource id ID not found or invalid
 *         400:
 *              description: error
 */
app.delete("/api/company/:id", async function (req, res) {
  //connect to the database
  //perform the request that you need (SQL)
  //define the header
  //res.json(rows);
  try {
    //const validateId = await idSchema.validateAsync(req.params.id);
    const sqlQuery = "DELETE FROM company WHERE COMPANY_ID=?";
    const rows = await pool.query(sqlQuery, req.params.id);
    res.header("Content-Type", "application/json");

    if (
      rows.affectedRows == 0 &&
      rows.insertId == 0 &&
      rows.warningStatus == 0
    ) {
      res.status(404).send("Resource id ID not found or invalid");
    } else {
      res.status(200).json(rows);
      console.log(rows);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});

const CompanyNameSchema = Joi.object({
  COMPANY_NAME: Joi.string().min(1).required(),
});

/**
 * @swagger
 * /api/company/{id}:
 *    patch:
 *     summary: Updates COMPANY_NAME of a company by ID
 *     parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       type: string
 *       description: The ID of the company.
 *     - name: company_name
 *       in: body
 *       desription: The new name of the company.
 *       schema:
 *         type: object
 *         required: true
 *         properties:
 *           COMPANY_NAME:
 *             type: string
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: Company updated
 *         422:
 *              description: Unprocessable Entity
 *         400:
 *              description: error
 */
app.patch("/api/company/:id", async function (req, res) {
  try {
    const validate = await CompanyNameSchema.validateAsync(req.body);
    //const validateId = await idSchema.validateAsync(req.params.id);

    const sqlQuery = "UPDATE company SET COMPANY_NAME=? WHERE COMPANY_ID=?";
    const result = await pool.query(sqlQuery, [
      validate.COMPANY_NAME,
      req.params.id,
    ]);
    res.status(200).json(result);
  } catch (error) {
    if (error.isJoi === true) {
      res.status(422).send(error);
    } else {
      res.status(400).send(error);
    }
  }
});

const CompanySchema = Joi.object({
  COMPANY_NAME: Joi.string().min(1).required(),
  COMPANY_CITY: Joi.string().min(1).required(),
});

/**
 * @swagger
 * /api/company/{id}:
 *    put:
 *      summary: Updates a company by ID
 *      parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: string
 *        description: The ID of the company.
 *      - name: company
 *        in: body
 *        desription: The company to create.
 *        schema:
 *          type: object
 *          required: true
 *          properties:
 *            COMPANY_NAME:
 *              type: string
 *            COMPANY_CITY:
 *              type: string
 *      produces:
 *           -application/json
 *      responses:
 *          200:
 *               description: Company deleted
 *          422:
 *               description: Unprocessable Entity
 *          400:
 *               description: error
 */
app.put("/api/company/:id", async function (req, res) {
  try {
    const validate = await CompanySchema.validateAsync(req.body);
    //const validateId = await idSchema.validateAsync(req.params.id);

    const sqlQuery =
      "UPDATE company SET COMPANY_NAME=?,COMPANY_CITY=? WHERE COMPANY_ID=?";
    const rows = await pool.query(sqlQuery, [
      validate.COMPANY_NAME,
      validate.COMPANY_CITY,
      req.params.id,
    ]);
    res.header("Content-Type", "application/json");
    console.log(rows);
    res.status(200).send({ msg: "Created Company", rows: rows });
  } catch (error) {
    if (error.isJoi === true) {
      res.status(422).send(error.message);
    } else {
      res.status(400).send(error.message);
    }
  }
});

/**
 * @swagger
 * /api/customers:
 *    get:
 *     summary: Returns all customers
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: Array of Customer objects
 *         400:
 *              description: error
 */
app.get("/api/customers", async function (req, res) {
  //connect to the database
  //perform the request that you need (SQL)
  //define the header
  //res.json(rows);
  try {
    const sqlQuery = "SELECT * FROM customer";
    const rows = await pool.query(sqlQuery);
    res.header("Content-Type", "application/json");
    res.status(200).json(rows);
    console.log(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

/**
 * @swagger
 * /api/customers/{country}:
 *    get:
 *     summary: Returns a customer by COUNTRY
 *     parameters:
 *     - name: country
 *     in: path
 *     required: true
 *     type: string
 *     description: The COUNTRY of the customers to return.
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: Array of Customer Object/s
 *         400:
 *              description: error
 */
app.get("/api/customers/:country", async function (req, res) {
  try {
    const sqlQuery = "SELECT * FROM customer WHERE CUST_COUNTRY=?";
    const rows = await pool.query(sqlQuery, req.params.country);
    res.header("Content-Type", "application/json");
    res.status(200).json(rows);
    console.log(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

/**
 * @swagger
 * /api/foods:
 *    get:
 *     summary: Returns all foods
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: Array of food Objects
 *         400:
 *              description: error
 */
app.get("/api/foods", async function (req, res) {
  //connect to the database
  //perform the request that you need (SQL)
  //define the header
  //res.json(rows);
  try {
    const sqlQuery = "SELECT * FROM foods ";
    const rows = await pool.query(sqlQuery);
    res.header("Content-Type", "application/json");
    res.status(200).json(rows);
    console.log(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

/**
 * @swagger
 * /api/foods/id:
 *    get:
 *     summary: Returns a food be ID
 *     parameters:
 *     - name: id
 *     in: path
 *     required: true
 *     type: string
 *     description: The ID of the food to return.
 *     produces:
 *          -application/json
 *     responses:
 *         200:
 *              description: a Food Object
 *         400:
 *              description: error
 */
app.get("/api/foods/:id", async function (req, res) {
  //connect to the database
  //perform the request that you need (SQL)
  //define the header
  //res.json(rows);
  try {
    //const validateId = await idSchema.validateAsync(req.params.id);

    const sqlQuery = "SELECT * FROM foods WHERE ITEM_ID=?";
    const rows = await pool.query(sqlQuery, req.params.id);
    res.header("Content-Type", "application/json");
    res.status(200).json(rows);
    console.log(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
