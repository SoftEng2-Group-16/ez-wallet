import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import { User,Group } from '../models/User';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseController";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });



});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  const hashedPassword = await bcrypt.hash("secure_password", 12);


  await categories.deleteMany({});
  await transactions.deleteMany({});
  await User.deleteMany({});
  await Group.deleteMany({})

  await User.create({
    username: "admin",
    email: "admin@email.com",
    password: hashedPassword,
    role: "Admin",
  });
  
  await User.create({
    email: "tester@test.com",
    username: "tester",
    password: hashedPassword,
    role: "Regular"
  });

});

const adminAccessTokenValid = jwt.sign({
    email: "admin@email.com",
    //id: existingUser.id, The id field is not required in any check, so it can be omitted
    username: "admin",
    role: "Admin"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

const testerAccessTokenValid = jwt.sign({
    email: "tester@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

//These tokens can be used in order to test the specific authentication error scenarios inside verifyAuth (no need to have multiple authentication error tests for the same route)
const testerAccessTokenExpired = jwt.sign({
    email: "tester@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '0s' })

const testerAccessTokenEmpty = jwt.sign({}, process.env.ACCESS_KEY, { expiresIn: "1y" })

describe("createCategory", () => { 
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
  
  
    await categories.deleteMany({});
    await transactions.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({})
  
    await User.create({
      username: "admin",
      email: "admin@email.com",
      password: hashedPassword,
      role: "Admin",
    });
    
    await User.create({
      email: "tester@test.com",
      username: "tester",
      password: hashedPassword,
      role: "Regular"
    });
  });
      test("should create a new category when called by an admin", async () => {
        const req = { type: "food", color: "red" };
    
        const response = await request(app)
          .post("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("type", "food");
        expect(response.body.data).toHaveProperty("color", "red");
      });
    

    test("should return 401 if user is not an admin", async () => {
        const response = await request(app)
          .post("/api/categories")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send({
            type: "Test Category",
            color: "red",
          });
    
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
      });
    
      test("should return 400 if type or color parameters are missing", async () => {
        const response = await request(app)
          .post("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({
            color: "red",
          });
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("not enough parameters");
      });
    
      test("should return 400 if type or color are empty", async () => {
        const response = await request(app)
          .post("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({
            type: "",
            color: "red",
          });
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Type or color are invalid");
      });
    
      test("should return 400 if category already exists", async () => {
        // Create a category with the same type as the one we are testing
        await categories.create({
          type: "Test Category",
          color: "blue",
        });
    
        const response = await request(app)
          .post("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({
            type: "Test Category",
            color: "red",
          });
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("This category already exists");
      });
})

describe("updateCategory", () => {
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
  
  
    await categories.deleteMany({});
    await transactions.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({})
  
    await User.create({
      username: "admin",
      email: "admin@email.com",
      password: hashedPassword,
      role: "Admin",
    });
    
    await User.create({
      email: "tester@test.com",
      username: "tester",
      password: hashedPassword,
      role: "Regular"
    });
  });

      test("should update an existing category", async () => {
        // Create a category to update
        await categories.create({
          type: "Old Category",
          color: "blue",
        });

        await transactions.create({username:'random', amount:50, type:"Old Category"});
    
        const response = await request(app)
          .patch("/api/categories/Old%20Category")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({
            type: "New Category",
            color: "red",
          });
    
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual({
          message: "Category updated successfully",
          count: 1,
        });
    
        const updatedCategory = await categories.findOne({
          type: "New Category",
        });
        expect(updatedCategory).not.toBeNull();
        expect(updatedCategory.type).toBe("New Category");
        expect(updatedCategory.color).toBe("red");
      });
    
      test("should return 401 if user is not an admin", async () => {
        const response = await request(app)
          .patch("/api/categories/Old%20Category")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send({
            type: "New Category",
            color: "red",
          });
    
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
      });
    
      test("should return 400 if type or color parameters are missing", async () => {
        const response = await request(app)
          .patch("/api/categories/Old%20Category")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({
            color: "red",
          });
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("not enough parameters");
      });
    
      test("should return 400 if type or color are empty", async () => {
        const response = await request(app)
          .patch("/api/categories/Old%20Category")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({
            type: "",
            color: "red",
          });
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Type or color are invalid");
      });
    
      test("should return 400 if category to update does not exist", async () => {
        const response = await request(app)
          .patch("/api/categories/Nonexistent%20Category")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({
            type: "New Category",
            color: "red",
          });
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category not found");
      });
    
      test("should return 400 if new category already exists", async () => {
        // Create the category to update
        await categories.create({
          type: "Old Category",
          color: "blue",
        });
    
        // Create a category with the same type as the new one
        await categories.create({
          type: "New Category",
          color: "green",
        });
    
        const response = await request(app)
          .patch("/api/categories/Old%20Category")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({
            type: "New Category",
            color: "red",
          });
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category already exists");
      });
  });

describe("deleteCategory", () => { 
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
  
  
    await categories.deleteMany({});
    await transactions.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({})
  
    await User.create({
      username: "admin",
      email: "admin@email.com",
      password: hashedPassword,
      role: "Admin",
    });
    
    await User.create({
      email: "tester@test.com",
      username: "tester",
      password: hashedPassword,
      role: "Regular"
    });
  });
      test("should delete categories and update transactions", async () => {
        // Create some test categories
        await categories.create({ type: "category1", color: "red" });
        await categories.create({ type: "category2", color: "blue" });
        await categories.create({ type: "category3", color: "green" });
    
        // Create some test transactions with the categories
        await transactions.create({ type: "category1", amount: 100 });
        await transactions.create({ type: "category2", amount: 200 });
        await transactions.create({ type: "category3", amount: 300 });
    
        // Request body with the categories to delete
        const requestBody = {
          types: ["category1", "category3"],
        };
    
        const response = await request(app)
          .delete("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(requestBody);
    
        expect(response.status).toBe(200);
        expect(response.body.data.message).toBe("Category deleted successfully");
        expect(response.body.data.count).toBe(2);
    
        // Check that the deleted categories are no longer in the database
        const deletedCategories = await categories.find({
          type: { $in: requestBody.types },
        });
        expect(deletedCategories).toHaveLength(0);
    
        // Check that the transactions have been updated with the new category
        const updatedTransactions = await transactions.find({});
        expect(updatedTransactions).toHaveLength(3);
        expect(updatedTransactions[0].type).toBe("category2");
        expect(updatedTransactions[1].type).toBe("category2");
        expect(updatedTransactions[2].type).toBe("category2");
      });
      test("should delete categories and update transactions, case n= ec", async () => {
        // Create some test categories
        await categories.create({ type: "category1", color: "red" });
        await categories.create({ type: "category2", color: "blue" });
        await categories.create({ type: "category3", color: "green" });
    
        // Create some test transactions with the categories
        await transactions.create({ type: "category1", amount: 100 });
        await transactions.create({ type: "category2", amount: 200 });
        await transactions.create({ type: "category3", amount: 300 });
    
        // Request body with the categories to delete
        const requestBody = {
          types: ["category1", "category2", "category3"],
        };
    
        const response = await request(app)
          .delete("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(requestBody);
    
        expect(response.status).toBe(200);
        expect(response.body.data.message).toBe("Category deleted successfully");
        expect(response.body.data.count).toBe(2);
    
        // Check that the deleted categories are no longer in the database
        const deletedCategories = await categories.find({
          type: { $in: requestBody.types },
        });
        expect(deletedCategories).toHaveLength(1);
    
    
      });
    
      test("should return a 400 error if the request body is missing attributes", async () => {
        const response = await request(app)
          .delete("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send({});
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Some attributes are missing");
      });
    
      test("should return a 400 error if there is only one category in the database", async () => {
        await categories.create({ type: "category1", color: "red" });
    
        const requestBody = {
          types: ["category1"],
        };
    
        const response = await request(app)
          .delete("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(requestBody);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Cannot delete the last category");
      });
    
      test("should return a 400 error if any type in the array is an empty string", async () => {
        await categories.create({ type: "category1", color: "red" });
        await categories.create({ type: "category2", color: "blue" });
    
        const requestBody = {
          types: ["category1", ""],
        };
    
        const response = await request(app)
          .delete("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(requestBody);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("One or more category type are not valid");
      });
    
      test("should return a 400 error if the array in the request body is empty", async () => {
        const requestBody = {
          types: [],
        };
    
        const response = await request(app)
          .delete("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(requestBody);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category list is empty");
      });
    
      test("should return a 400 error if any type in the array does not represent a category in the database", async () => {
        await categories.create({ type: "category1", color: "red" });
    
        const requestBody = {
          types: ["category1", "category2"],
        };
    
        const response = await request(app)
          .delete("/api/categories")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(requestBody);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("One or more category type are not valid");
      });
    
      test("should return a 401 error if called by an authenticated user who is not an admin", async () => {
        const requestBody = {
          types: ["category1"],
        };
    
        const response = await request(app)
          .delete("/api/categories")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(requestBody);
    
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
      });
    
})

describe("getCategories", () => { 
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
  
  
    await categories.deleteMany({});
    await transactions.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({})
  
    await User.create({
      username: "admin",
      email: "admin@email.com",
      password: hashedPassword,
      role: "Admin",
    });
    
    await User.create({
      email: "tester@test.com",
      username: "tester",
      password: hashedPassword,
      role: "Regular"
    });
  });
    
    test("should return categories when called by an authenticated use", async () => {
        // Create some test categories
        await categories.create({ type: "food", color: "red" });
        await categories.create({ type: "health", color: "green" });
    
        const response = await request(app)
          .get("/api/categories")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ]);
    
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0]).toHaveProperty("type", "food");
        expect(response.body.data[0]).toHaveProperty("color", "red");
        expect(response.body.data[1]).toHaveProperty("type", "health");
        expect(response.body.data[1]).toHaveProperty("color", "green");      
      });
    /*   test("should return empty array when called by an authenticated user and there are no categories yet", async () => {
        
        shouldn't be possibile to have 0 categories anyway
    
        const response = await request(app)
          .get("/api/categories")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ]);
    
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(0);
        expect(response.body.data).toBe([])
      
      });
     */
    
      test("should return a 401 error if called by an unauthenticated user", async () => {
        const response = await request(app).get("/api/categories");
    
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
      });
})

describe("createTransaction", () => { 

    test("should create a new transaction when called by an authenticated user", async () => {
        //first create the category
        await categories.create({ type: "food", color: "red" });
        //this route require a request to send
        const req= {username: "tester", amount: 100, type: "food" }
        const response = await request(app)
          .post("/api/users/tester/transactions")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("username", "tester");
        expect(response.body.data).toHaveProperty("amount", 100);
        expect(response.body.data).toHaveProperty("type", "food");
        expect(response.body.data).toHaveProperty("date");
      });
    
      test("should return a 400 error if the request body does not contain all the necessary attributes", async () => {
        const req = { username: "tester", amount: 100 }; // Missing the 'type' attribute
        const response = await request(app)
          .post("/api/users/tester/transactions")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "not enough parameters");
      });

      //! if we pass username empty  it fails at auth with 401
    
      test("should return a 400 error if at least one of the parameters in the request body is an empty string", async () => {
        const req = { username: "tester", amount: 100, type: "" }; // Empty 'username'
        const response = await request(app)
          .post("/api/users/tester/transactions")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "username, amount or type are invalid");
      });
    
      test("should return a 400 error if the type of category passed in the request body does not represent a category in the database", async () => {
        const req = { username: "tester", amount: 100, type: "invalidCategory" };
        const response = await request(app)
          .post("/api/users/tester/transactions")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "Username or category type does not exist");
      });
      test("should return a 400 error if the amount passed in the request body cannot be parsed as a floating value", async () => {
        const req = { username: "tester", amount: "invalidAmount", type: "food" };
        const response = await request(app)
          .post("/api/users/tester/transactions")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "amount is not a number");
      });

      test("should return a 401 error if called by an authenticated user who is not the same user as the one in the route parameter", async () => {
        const req = { username: "tester", amount: 100, type: "food" };
        const response = await request(app)
          .post("/api/users/anotherUser/transactions")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(401);
        expect(response.body.error).toBe( "Unauthorized");
      });


})

describe("getAllTransactions", () => {
    
    test("should return all transactions with categories when called by an admin", async () => {
      const transaction1 = await transactions.create({ username: "Mario", amount: 100, type: "food"});
      const transaction2 = await transactions.create({ username: "Mario", amount: 70, type: "health"});
      const transaction3 = await transactions.create({ username: "Luigi", amount: 20, type: "food" });
  
      const category1 = await categories.create({ type: "food", color: "red" });
      const category2 = await categories.create({ type: "health", color: "green" });
  
      const response = await request(app)
        .get("/api/transactions")
        .set("Cookie", [
          `accessToken=${adminAccessTokenValid}`,
          `refreshToken=${adminAccessTokenValid}`,
        ]);
  
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: expect.any(String),
            username: "Mario",
            amount: 100,
            type: "food",
            date: expect.any(String),
            color: "red",
          }),
          expect.objectContaining({
            _id: expect.any(String),
            username: "Mario",
            amount: 70,
            type: "health",
            date: expect.any(String),
            color: "green",
          }),
          expect.objectContaining({
            _id: expect.any(String),
            username: "Luigi",
            amount: 20,
            type: "food",
            date: expect.any(String),
            color: "red",
          }),
        ])
      );
    });
  
    test("should return a 401 error if called by an authenticated user who is not an admin", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .set("Cookie", [
          `accessToken=${testerAccessTokenValid}`,
          `refreshToken=${testerAccessTokenValid}`,
        ]);
  
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

describe("getTransactionsByUser", () => { 
   
  test('User is Admin and he can see all transactions for this user', async () => {
    const user=await User.create({username:"Mario",email:"mario@prova.com",password:"prova"})
    
    const transaction1 = await transactions.create({ username: "Mario", amount: 100, type: "food" });
    const transaction2 = await transactions.create({ username: "Mario", amount: 70, type: "health"});
    const transaction3 = await transactions.create({ username: "Mario", amount: 20, type: "food"});
  
    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({ type: "health", color: "green" });
    const response = await request(app)
    .get("/api/transactions/users/Mario")
    .set("Cookie", [
      `accessToken=${adminAccessTokenValid}`,
      `refreshToken=${adminAccessTokenValid}`,
    ]);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data).toEqual(
            [{
            username: "Mario",
            amount: 100,
            type: "food",
            date: expect.any(String),
            color: "red",
          },
          {
            username: "Mario",
            amount: 70,
            type: "health",
            date: expect.any(String),
            color: "green",
          },
          {
            username: "Mario",
            amount: 20,
            type: "food",
            date: expect.any(String),
            color: "red",
          }
        ])
      })

  test('User has admin route, but he isn\'t a Admin', async () => {
    const response = await request(app)
      .get("/api/transactions/users/Mario")
      .set("Cookie",[
                      `accessToken=${testerAccessTokenValid}`,
                      `refreshToken=${testerAccessTokenValid}`,
                    ]);
      
    expect(response.status).toBe(401);
    expect(response.body).toEqual({"error":"Unauthorized"});
  });

  test('User has admin route, but username isn\'t in the db', async () => {
    const response = await request(app)
      .get("/api/transactions/users/Giorgio")
      .set("Cookie",[
                      `accessToken=${adminAccessTokenValid}`,
                      `refreshToken=${adminAccessTokenValid}`,
                    ]);
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({"error":"User passed as a route parameter not found"});
  });

  test('User is Regular and he can see its transactions', async () => {
    const user=await User.create({username:"Mario",email:"mario@prova.com",password:"prova"})
    const MarioAccessTokenValid = jwt.sign({
      email: "mario@prova.com",
      username: "Mario",
      role: "Regular"
  }, process.env.ACCESS_KEY, { expiresIn: '1y' })

    const transaction1 = await transactions.create({ username: "Mario", amount: 100, type: "food" });
    const transaction2 = await transactions.create({ username: "Mario", amount: 70, type: "health"});
    const transaction3 = await transactions.create({ username: "Mario", amount: 20, type: "food"});
  
    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({ type: "health", color: "green" });
    const response = await request(app)
    .get("/api/users/Mario/transactions?from=2020-02-10&upTo=2024-06-05&min=0&max=100")
    .set("Cookie", [
      `accessToken=${MarioAccessTokenValid}`,
      `refreshToken=${MarioAccessTokenValid}`,
    ]);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data).toEqual(
            [{
            username: "Mario",
            amount: 100,
            type: "food",
            date: expect.any(String),
            color: "red",
          },
          {
            username: "Mario",
            amount: 70,
            type: "health",
            date: expect.any(String),
            color: "green",
          },
          {
            username: "Mario",
            amount: 20,
            type: "food",
            date: expect.any(String),
            color: "red",
          }
        ])
      })

      test('User has Regular route, but username isn\'t in the db', async () => {
        const MarioAccessTokenValid = jwt.sign({
          email: "mario@prova.com",
          username: "Mario",
          role: "Regular"
      }, process.env.ACCESS_KEY, { expiresIn: '1y' })
        const response = await request(app)
          .get("/api/users/Mario/transactions")
          .set("Cookie",[
                          `accessToken=${MarioAccessTokenValid}`,
                          `refreshToken=${MarioAccessTokenValid}`,
                        ]);
          
        expect(response.status).toBe(400);
        expect(response.body).toEqual({"error":"User passed as a route parameter not found"});
      });
    
  test('User is different between route', async () => {
    const response = await request(app)
      .get("/api/users/Mario/transactions")
      .set("Cookie",[
                          `accessToken=${testerAccessTokenValid}`,
                          `refreshToken=${testerAccessTokenValid}`,
                        ]);
          
      expect(response.status).toBe(401);
      expect(response.body).toEqual({"error":"User's username is different from the request"});
      });
})

describe("getTransactionsByUserByCategory", () => { 

  test("Should return 200 if the user is an admin with the path for admin", async () => {
    const user = await User.create({
      username: "Mario",
      email: "mario@prova.com",
      password: "prova",
      role: "Regular",
    });
    
    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({
      type: "health",
      color: "green",
    });

    const transaction1 = await transactions.create({
      username: "Mario",
      amount: 100,
      type: "food",
    });
    const transaction2 = await transactions.create({
      username: "Mario",
      amount: 70,
      type: "health",
    });
    const transaction3 = await transactions.create({
      username: "Mario",
      amount: 20,
      type: "food",
    });

    const response = await request(app)
      .get("/api/transactions/users/Mario/category/food")
      .set("Cookie", [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ]);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toEqual([
      {
        username: "Mario",
        amount: 100,
        type: "food",
        date: expect.any(String),
        color: "red",
      },
      {
        username: "Mario",
        amount: 20,
        type: "food",
        date: expect.any(String),
        color: "red",
      },
    ]);
    //expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("Should return 200 if the user search transactions for himself with the path for user", async () => {
    

    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({
      type: "health",
      color: "green",
    });

    const transaction1 = await transactions.create({
      username: "tester",
      amount: 100,
      type: "food",
    });
    const transaction2 = await transactions.create({
      username: "tester",
      amount: 70,
      type: "health",
    });
    const transaction3 = await transactions.create({
      username: "tester",
      amount: 20,
      type: "food",
    });

    
    const response = await request(app)
      .get("/api/users/tester/transactions/category/food")
      .set("Cookie", [
        `accessToken=${testerAccessTokenValid}`,
        `refreshToken=${testerAccessTokenValid}`,
      ]);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toEqual([
      {
        username: "tester",
        amount: 100,
        type: "food",
        date: expect.any(String),
        color: "red",
      },
      {
        username: "tester",
        amount: 20,
        type: "food",
        date: expect.any(String),
        color: "red",
      },
    ]);
    //expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("should return 401 if the user is not an admin with the route for admin", async () => {
    
    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({
      type: "health",
      color: "green",
    });
    const transaction1 = await transactions.create({
      username: "tester",
      amount: 100,
      type: "food",
    });
    const transaction2 = await transactions.create({
      username: "tester",
      amount: 70,
      type: "health",
    });
    const transaction3 = await transactions.create({
      username: "tester",
      amount: 20,
      type: "food",
    });

    const response = await request(app)
      .get("/api/transactions/users/Mario/category/food")
      .set("Cookie", [
        `accessToken=${testerAccessTokenValid}`,
        `refreshToken=${testerAccessTokenValid}`,
      ]);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized" );
  });

  test("should return 401 if the user is not the user in the params with the route for users", async () => {
   
    const user = await User.create({
      username: "Mario",
      email: "mario@prova.com",
      password: "prova",
      role: "Regular",
    });

    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({
      type: "health",
      color: "green",
    });

    const transaction1 = await transactions.create({
      username: "Mario",
      amount: 100,
      type: "food",
    });
    const transaction2 = await transactions.create({
      username: "Mario",
      amount: 70,
      type: "health",
    });
    const transaction3 = await transactions.create({
      username: "Mario",
      amount: 20,
      type: "food",
    });

    const response = await request(app)
      .get("/api/users/Mario/transactions/category/food")
      .set("Cookie", [
        `accessToken=${testerAccessTokenValid}`,
        `refreshToken=${testerAccessTokenValid}`,
      ]);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("User's username is different from the request" );
  });

  test("Should return 400 if the category not exist", async () => {
    const user = await User.create({
      username: "Mario",
      email: "mario@prova.com",
      password: "prova",
      role: "Regular",
    });

    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({
      type: "health",
      color: "green",
    });

    const transaction1 = await transactions.create({
      username: "Mario",
      amount: 100,
      type: "food",
    });
    const transaction2 = await transactions.create({
      username: "Mario",
      amount: 70,
      type: "health",
    });
    const transaction3 = await transactions.create({
      username: "Mario",
      amount: 20,
      type: "food",
    });

    const response = await request(app)
      .get("/api/transactions/users/Mario/category/game")
      .set("Cookie", [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ]);

      expect(response.body.error).toBe("Category not found" );
  });

  test("Should return 400 if the user not exist", async () => {
    const user = await User.create({
      username: "Mario",
      email: "mario@prova.com",
      password: "prova",
      role: "Regular",
    });

    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({
      type: "health",
      color: "green",
    });

    const transaction1 = await transactions.create({
      username: "Mario",
      amount: 100,
      type: "food",
    });
    const transaction2 = await transactions.create({
      username: "Mario",
      amount: 70,
      type: "health",
    });
    const transaction3 = await transactions.create({
      username: "Mario",
      amount: 20,
      type: "food",
    });

    const response = await request(app)
      .get("/api/transactions/users/User0/category/game")
      .set("Cookie", [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ]);

      expect(response.body.error).toBe("User not found" );
  });

  test("Should return 500 if there is an internal server error", async () => {

    const category1 = await categories.create({ type: "food", color: "red" });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const response = await request(app)
      .get("/api/transactions/users/admin/category/food")
      .set("Cookie", [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ]);

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
   
})

describe("getTransactionsByGroup", () => { 
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */


  test("should return a 401 error if an authenticated user is not an admin accessing admin route", async () => {


    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: "hashedPassword",
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: "hashedPassword",
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "email0@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })

    const response = await request(app)
      .get(`/api/transactions/groups/${group.name}`)
      .set('Cookie', [
        `accessToken=${testerAccessTokenValid}`,
        `refreshToken=${testerAccessTokenValid}`,
      ])
  
    expect(response.status).toBe(401);
    expect(response.body.error).toEqual("Unauthorized");
    
  });

  test("should return a 400 error if an authenticated user is an admin searching for a group that does not exist", async () => {


    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: "hashedPassword",
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: "hashedPassword",
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "email0@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })

    const response = await request(app)
      .get(`/api/transactions/groups/NonExistingGroup`)
      .set('Cookie', [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ])
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("Group not found");
    
  });

  test("should return a 200 status if the admin search for an existing group", async () => {

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: "hashedPassword",
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: "hashedPassword",
      role: "Regular",
    });


    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "email0@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })


    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({ type: "health", color: "blue" });

    const transaction1 = await transactions.create({ username: user0.username, amount: 100, type: category1.type });
    const transaction2 = await transactions.create({ username: user1.username, amount: 70, type: category2.type });
    const transaction3 = await transactions.create({ username: user0.username, amount: 20, type: category1.type });


    const response = await request(app)
      .get(`/api/transactions/groups/${group.name}`)
      .set('Cookie', [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ])
      
  
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual( expect.arrayContaining( [
      {
        username: user0.username,
        type: transaction1.type,
        amount: transaction1.amount, 
        date: expect.any(String), 
        color: category1.color,
      },
      {
        username: user1.username,
        type: transaction2.type,
        amount: transaction2.amount, 
        date: expect.any(String), 
        color:category2.color,
      },
      {
        username: user0.username,
        type: transaction3.type,
        amount: transaction3.amount, 
        date: expect.any(String), 
        color: category1.color,
      },
    ]));

   // expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  
  test("should return a 400 error if the user is not an admin and the requested group does not exist", async () => {


    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: "password",
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: "password",
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "admin@test.it",
        },
        {
          email: "email0@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })


    const response = await request(app)
      .get(`/api/groups/NonExistingGroup/transactions`)
      .set('Cookie', [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ])
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("Group not found");
    
  });

  test("should return a 401 error if an authenticated user is not part of the group", async () => {

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: "hashedPassword",
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: "hashedPassword",
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "email0@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })

    const response = await request(app)
    .get(`/api/groups/${group.name}/transactions`)
      .set('Cookie', [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ])
  
    expect(response.status).toBe(401);
    expect(response.body.error).toEqual("Unauthorized");
    
  });

  test("should return a 200 status if the user search for its group", async () => {

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: "hashedPassword",
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: "hashedPassword",
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "tester@test.com",
        },
        {
          email: "email0@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })


    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({ type: "health", color: "blue" });

    const transaction1 = await transactions.create({ username: user0.username, amount: 100, type: category1.type });
    const transaction2 = await transactions.create({ username: user1.username, amount: 70, type: category2.type });
    const transaction3 = await transactions.create({ username: user0.username, amount: 20, type: category1.type });

    const response = await request(app)
      .get(`/api/groups/${group.name}/transactions`)
      .set('Cookie', [
        `accessToken=${testerAccessTokenValid}`,
        `refreshToken=${testerAccessTokenValid}`,
      ])
      
  
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual( expect.arrayContaining( [
      {
        username: user0.username,
        type: transaction1.type,
        amount: transaction1.amount, 
        date: expect.any(String), 
        color: category1.color,
      },
      {
        username: user1.username,
        type: transaction2.type,
        amount: transaction2.amount, 
        date: expect.any(String), 
        color:category2.color,
      },
      {
        username: user0.username,
        type: transaction3.type,
        amount: transaction3.amount, 
        date: expect.any(String), 
        color: category1.color,
      },
    ]));

    //expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  
})

describe("getTransactionsByGroupByCategory", () => { 

  test('User is Admin and can see transactions for a single category in a group', async () => {
    
    const user1=await User.create({username:"user1",email:"user1@prova.com",password:"prova", role:"regular"})
    const user2=await User.create({username:"user2",email:"user2@prova.com",password:"prova", role:"regular"})
  
    const group = await Group.create({ name: "Group1", members: [{ email: "user1@prova.com" }, { email: "user2@prova.com" }] });

    const category1 = await categories.create({ type: "food", color: "red" });
    const category2 = await categories.create({ type: "health", color: "blue" });

    const transaction1 = await transactions.create({ username: "user1", amount: 100, type: "food" });
    const transaction2 = await transactions.create({ username: "user2", amount: 70, type: "health" });
    const transaction3 = await transactions.create({ username: "user1", amount: 20, type: "food" });

    const response = await request(app)
      .get("/api/transactions/groups/Group1/category/food")
      .set("Cookie", [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ]);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toEqual([
      {
        username: "user1",
        amount: 100,
        type: "food",
        date: expect.any(String),
        color: "red",
      },
      {
        username: "user1",
        amount: 20,
        type: "food",
        date: expect.any(String),
        color: "red",
      }
    ]);
  });

  test('User is Group member and can see transactions for a single category in the group', async () => {
   
  

    const MarioAccessTokenValid = jwt.sign({
      email: "mario@prova.com",
      username: "Mario",
      role: "Regular"
  }, process.env.ACCESS_KEY, { expiresIn: '1y' })


    const user1=await User.create({username:"Mario",email:"mario@prova.com",password:"prova"})
    const user2=await User.create({username:"Luigi",email:"luigi@prova.com",password:"prova"})
   
    const group = await Group.create({ name: "Family", members: [{ email: "mario@prova.com" ,}, { email: "luigi@prova.com" ,}] });
    const category = await categories.create({ type: "food", color: "red" });

    const transaction1 = await transactions.create({ username: "Mario", amount: 100, type: "food" });
    const transaction2 = await transactions.create({ username: "Luigi", amount: 70, type: "health" });
    const transaction3 = await transactions.create({ username: "Luigi", amount: 20, type: "food" });

    const response = await request(app)
      .get("/api/groups/Family/transactions/category/food")
      .set("Cookie", [
        `accessToken=${MarioAccessTokenValid}`,
        `refreshToken=${MarioAccessTokenValid}`,
      ]);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toEqual(expect.arrayContaining([
      {
        username: "Mario",
        amount: 100,
        type: "food",
        date: expect.any(String),
        color: "red",
      },
      {
        username: "Luigi",
        amount: 20,
        type: "food",
        date: expect.any(String),
        color: "red",
      },
    ]));
  });

  test('Unauthorized user trying to access admin route', async () => {
    

    const response = await request(app)
      .get("/api/transactions/groups/Group1/category/food").set("Cookie", [
        `accessToken=${testerAccessTokenValid}`,
        `refreshToken=${testerAccessTokenValid}`,
      ]);;

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ "error": "Unauthorized" });
  });

 

  test('User is Admin, but group does not exist', async () => {
    const response = await request(app)
      .get("/api/transactions/groups/Group1/category/food")
      .set("Cookie", [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ]);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ "error": "Group not found" });
  });

  
  test('User is regular, but group does not exist', async () => {
    
    const MarioAccessTokenValid = jwt.sign({
      email: "mario@prova.com",
      username: "Mario",
      role: "Regular"
  }, process.env.ACCESS_KEY, { expiresIn: '1y' })


    const user1=await User.create({username:"Mario",email:"mario@prova.com",password:"prova"})
    

    const response = await request(app)
    .get("/api/groups/Family/transactions/category/lallana")
    .set("Cookie", [
      `accessToken=${MarioAccessTokenValid}`,
      `refreshToken=${MarioAccessTokenValid}`,
    ]);


    expect(response.status).toBe(400);
    expect(response.body).toEqual({ "error": "Group not found" });
  });


  test('User is Admin, but category does not exist', async () => {
    const admin = await User.create({ username: "Admin", email: "admin@example.com", password: "password", role: "Admin" });

    const group = await Group.create({ name: "Group1", members: [{ email: "user1@example.com" }, { email: "user2@example.com" }] });

    const response = await request(app)
      .get("/api/transactions/groups/Group1/category/food")
      .set("Cookie", [
        `accessToken=${adminAccessTokenValid}`,
        `refreshToken=${adminAccessTokenValid}`,
      ]);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ "error": "Category not found" });
  });

  test('User is Group member, but category does not exist', async () => {
   
    const MarioAccessTokenValid = jwt.sign({
      email: "mario@prova.com",
      username: "Mario",
      role: "Regular"
  }, process.env.ACCESS_KEY, { expiresIn: '1y' })


    const user1=await User.create({username:"Mario",email:"mario@prova.com",password:"prova"})
    const user2=await User.create({username:"Luigi",email:"luigi@prova.com",password:"prova"})
   
    const group = await Group.create({ name: "Family", members: [{ email: "mario@prova.com" ,}, { email: "luigi@prova.com" ,}] });
    const category = await categories.create({ type: "food", color: "red" });

    const transaction1 = await transactions.create({ username: "Mario", amount: 100, type: "food" });
    const transaction2 = await transactions.create({ username: "Luigi", amount: 70, type: "health" });
    const transaction3 = await transactions.create({ username: "Luigi", amount: 20, type: "food" });

    const response = await request(app)
      .get("/api/groups/Family/transactions/category/lallana")
      .set("Cookie", [
        `accessToken=${MarioAccessTokenValid}`,
        `refreshToken=${MarioAccessTokenValid}`,
      ]);



    expect(response.status).toBe(400);
    expect(response.body).toEqual({ "error": "Category not found" });
  });
  test('Unauthorized user trying to access group transactions', async () => {
   
    const MarioAccessTokenValid = jwt.sign({
      email: "mario@prova.com",
      username: "Mario",
      role: "Regular"
  }, process.env.ACCESS_KEY, { expiresIn: '1y' })


    const user1=await User.create({username:"Mario",email:"mario@prova.com",password:"prova"})
    const user2=await User.create({username:"Luigi",email:"luigi@prova.com",password:"prova"})
    const user3=await User.create({username:"Cristo",email:"cristo@prova.com",password:"prova"})
   
    const group = await Group.create({ name: "Family", members: [{ email: "cristo@prova.com" ,}, { email: "luigi@prova.com" ,}] });
    const category = await categories.create({ type: "food", color: "red" });

    const transaction1 = await transactions.create({ username: "Cristo", amount: 100, type: "food" });
    const transaction2 = await transactions.create({ username: "Luigi", amount: 70, type: "health" });
    const transaction3 = await transactions.create({ username: "Luigi", amount: 20, type: "food" });

    const response = await request(app)
      .get("/api/groups/Family/transactions/category/food").set("Cookie", [
        `accessToken=${MarioAccessTokenValid}`,
        `refreshToken=${MarioAccessTokenValid}`,
      ]);

;

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ "error": "Unauthorized" });
  });

})

describe("deleteTransaction", () => { 

    
      test("should delete the transaction when called by an user", async () => {
       
        const transaction = await transactions.create({
          username: 'tester',
          amount: 100,
          type: "food"
        });
    
        const req = { _id: transaction._id };
    
        const response = await request(app)
          .delete(`/api/users/tester/transactions`)
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual({ message: "Transaction deleted" });
      });
      test("should return a 400 error if the request body is missing the _id attribute", async () => {
        const req = {};
    
        const response = await request(app)
          .delete(`/api/users/tester/transactions`)
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("The attribute _id is missing!");
      });
    
      test("should return a 400 error if the _id in the request body is an empty string", async () => {
        const req = { _id: "" };
    
        const response = await request(app)
          .delete(`/api/users/tester/transactions`)
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Id is empty");
      });
    
      /* test("should return a 400 error if the username in the route parameter does not represent a user in the database", async () => {
        const transaction = await transactions.create({
            username: 'dummy',
            amount: 100,
            type: "food"
          });
      
          const req = { _id: transaction._id };
    
        const response = await request(app)
          .delete(`/api/users/nonexistentUser/transactions`)
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Username does not exist");
      }); */
    
      test("should return a 400 error if the _id in the request body does not represent a transaction in the database", async () => {
        const req = { _id: "nonexistentTransactionId" };
    
        const response = await request(app)
          .delete(`/api/users/tester/transactions`)
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Transaction does not exist");
      });
    
      test("should return a 400 error if the _id in the request body represents a transaction made by a different user", async () => {
        const transaction = await transactions.create({
          username: "otherUser",
          amount: 100,
          type: "food"
        });
    
        const req = { _id: transaction._id };
    
        const response = await request(app)
          .delete(`/api/users/tester/transactions`)
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("This is not your transaction!");
      });
    
      test("should return a 401 error if called by an authenticated user who is not the same user as the one in the route", async () => {

        const user1=await User.create({username:"otheruser",email:"otheruser@prova.com",password:"prova"})
        const transaction = 
        await transactions.create({
          username: 'tester',
          amount: 100,
          type: "food"
        });
    
        const req = { _id: transaction._id };
    
        const response = await request(app)
          .delete(`/api/users/otheruser/transactions`)
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
      });
    
})

describe("deleteTransactions", () => { 

    
      test("should delete the transactions when called by an admin", async () => {
        // Create some sample transactions
        const transaction1 = await transactions.create({ username: "user1", amount: 100 });
        const transaction2 = await transactions.create({ username: "user2", amount: 200 });
        const transaction3 = await transactions.create({ username: "user1", amount: 300 });
    
        const req = { _ids: [transaction1._id, transaction2._id] };
    
        const response = await request(app)
          .delete("/api/transactions")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(200);
        expect(response.body.data.message).toBe("Transactions deleted");
      });
    
      test("should return a 401 error if called by an authenticated user who is not an admin", async () => {
        // Create a regular user and get their access token

        const transaction1 = await transactions.create({ username: "user1", amount: 100 });

        const req = { _ids: transaction1._id };
    
        const response = await request(app)
          .delete("/api/transactions")
          .set("Cookie", [
            `accessToken=${testerAccessTokenValid}`,
            `refreshToken=${testerAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
      });
    
      test("should return a 400 error if the request body does not contain all the necessary attributes", async () => {
        const req = {}; // Empty request body
    
        const response = await request(app)
          .delete("/api/transactions")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("The attribute is missing!");
      });
    
      test("should return a 400 error if at least one of the ids in the array is an empty string", async () => {
       
        const transaction1 = await transactions.create({ username: "user1", amount: 100 });
        const transaction2 = await transactions.create({ username: "user2", amount: 200 });
        const req = { _ids: [transaction1._id,''] }; // Empty string as one of the ids
    
        const response = await request(app)
          .delete("/api/transactions")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("One or more IDs are empty strings!");
      });
    
      test("should return a 400 error if at least one of the ids in the array does not represent a transaction in the database", async () => {
     
        const transaction1 = await transactions.create({ username: "user1", amount: 100 });
        const transaction2 = await transactions.create({ username: "user2", amount: 200 });
      
        const req = { _ids: [ transaction1._id, "6595da83280b44b0c84296d33"] }; // Non-existent ids
    
        const response = await request(app)
          .delete("/api/transactions")
          .set("Cookie", [
            `accessToken=${adminAccessTokenValid}`,
            `refreshToken=${adminAccessTokenValid}`,
          ])
          .send(req);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("One or more id not found");
      });
})
