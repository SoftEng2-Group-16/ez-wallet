import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */

dotenv.config();
beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe("getUsers", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test("should return 401 if the user is not an admin", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get("/api/users")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized");
  });

  test("should return empty list if there are no users", async () => {
    const token = jwt.sign(
      {
        email: "user@test.it",
        id: 0,
        username: "User",
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get("/api/users")
      .set('Cookie', cookieHeader)
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
   // expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("should retrieve list of all users", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "tester",
      email: "test@test.com",
      password: "tester",
    });

    const response = await request(app)
      .get("/api/users")
      .set("Cookie", cookieHeader);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].username).toEqual("User");
    expect(response.body.data[0].email).toEqual("user@test.it");
    expect(response.body.data[0].role).toEqual("Admin");
    expect(response.body.data[1].username).toEqual("tester");
    expect(response.body.data[1].email).toEqual("test@test.com");
    expect(response.body.data[1].role).toEqual("Regular");
    //expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const response = await request(app)
      .get("/api/users")
      .set("Cookie", cookieHeader);

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

})

describe("getUser", () => { 

  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test("should return 401 if user is not an admin and not searching for their own info", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get("/api/users/otherUser")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("User's username is different from the request");
    
  });

  test("should return 400 if user does not exist", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
  
    const token = jwt.sign(
      {
        email: "user@test.it",
        id: 0,
        username: "User",
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get("/api/users/User")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("User not found");
    
  });

  test("should retrieve user information if user is an admin", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: "admin@test.it",
        id: 0,
        username: "admin",
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get(`/api/users/${user.username}`)
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe(user.username);
    expect(response.body.data.email).toBe(user.email);
    expect(response.body.data.role).toBe(user.role);
    //expect(response.body.refreshedTokenMessage).toBeDefined();

  });

  test("should retrieve user information if user is searching for their own info", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get(`/api/users/${user.username}`)
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe(user.username);
    expect(response.body.data.email).toBe(user.email);
    expect(response.body.data.role).toBe(user.role);
    //expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const response = await request(app)
      .get("/api/users/User")
      .set("Cookie", cookieHeader);
    

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });


})

describe("createGroup", () => { 
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await Group.deleteMany({})
    await User.deleteMany({})
  })

  test("should return status 401 if the user does not pass the simple authentication", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: "",
      refreshToken: ""
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(401);
    expect(response.body.error).toEqual("Unauthorized");
  
  });

  test("should return status 400 if the attribute memberEmails is missing in the body ", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"newGroup"})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("Name or MemberEmails are missing!");
    
  });

  test("should return status 400 if the attribute name is missing in the body ", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({memberEmails:[]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("Name or MemberEmails are missing!");
    
  });

  test("should return status 400 if the name group is a whitespace", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:" ", memberEmails:[]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("Group name is empty!");
   
  });

  test("should return status 400 if the there are not mail in member emails", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"newGroup", memberEmails:[]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("List of email is empty");
  
  });

  test("should return status 400 if there is already a group with the provided name", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"TestGroup", memberEmails:["admin@test.it", "email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("Group exist!");
  
  });

  test("should return status 400 if there are one or more mail in invalid format", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"newGroup", memberEmails:["admintest.it", "email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("One or more emails are invalid!");
  
  });

  test("should return status 400 if there are one or more empty mail", async () => {
   const hashedPassword = await bcrypt.hash("secure_password", 12);
   const user = await User.create({
     username: "admin",
     email: "admin@test.it",
     password: hashedPassword,
     role: "Admin",
   });
 
   const token = jwt.sign(
     {
       email: user.email,
       id: user._id,
       username: user.username,
       role: user.role,
     },
     process.env.ACCESS_KEY,
     { expiresIn: "365d" }
   );
 
   user.refreshToken = token;
   await user.save();

   const user0 = await User.create({
     username: "User0",
     email: "email0@test.it",
     password: hashedPassword,
     role: "Admin",
   });

   const user1 = await User.create({
     username: "User1",
     email: "email1@test.it",
     password: hashedPassword,
     role: "Regular",
   });


   const cookies = {
     accessToken: token,
     refreshToken: token
   };
   
   let cookieHeader = "";
   Object.entries(cookies).forEach(([name, value]) => {
     cookieHeader += `${name}=${value}; `;
   });

   const response = await request(app)
     .post("/api/groups")
     .set('Cookie', cookieHeader)
     .send({name:"newGroup", memberEmails:["admin@test.it", "", "email1@test.it"]})
 
   expect(response.status).toBe(400);
   expect(response.body.error).toEqual("One or more emails are invalid!");
  
  });

  test("should return status 400 if the user who wants to create the group is already in one", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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
          email: "email1@test.it",
        }
      ]
    })

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"newGroup", memberEmails:["admin@test.it", "email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("The creator is already in a group!");
  
  });

  test("should return status 400 if all the email in membersEmail does not exist", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"newGroup", memberEmails:["adm@test.it", "ema@test.it", "em@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("All members not exist!");
    
  
  });

  test("should return status 400 if all the email in members email are already in a group", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"newGroup", memberEmails:["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("All members are already in group!");
  
  });

  test("should return status 400 if all the email in members email are already in a group or not exist", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "email0@test.it",
        }
      ]
    })

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"newGroup", memberEmails:["email0@test.it", "ema@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual("All members not exist or are already in a group!");
    
  
  });

  test("should return status 200 even if the creator does not insert himself in the members email", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
     username: "admin",
     email: "admin@test.it",
     password: hashedPassword,
     role: "Admin",
   });
 
   const token = jwt.sign(
     {
       email: user.email,
       id: user._id,
       username: user.username,
       role: user.role,
     },
     process.env.ACCESS_KEY,
     { expiresIn: "365d" }
   );
 
   user.refreshToken = token;
   await user.save();

   const user0 = await User.create({
     username: "User0",
     email: "email0@test.it",
     password: hashedPassword,
     role: "Admin",
   });

   const user1 = await User.create({
     username: "User1",
     email: "email1@test.it",
     password: hashedPassword,
     role: "Regular",
   });

   const cookies = {
     accessToken: token,
     refreshToken: token
   };
   
   let cookieHeader = "";
   Object.entries(cookies).forEach(([name, value]) => {
     cookieHeader += `${name}=${value}; `;
   });

   const response = await request(app)
     .post("/api/groups")
     .set('Cookie', cookieHeader)
     .send({name:"newGroup", memberEmails:["email0@test.it", "email1@test.it"]})
 
   expect(response.status).toBe(200);
   expect(response.body.data.group.name).toEqual("newGroup")
   expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email0@test.it"}, {email: "email1@test.it"},{email: "admin@test.it"}]))
   expect(response.body.data.alreadyInGroup).toEqual(expect.arrayContaining([]))
   expect(response.body.data.membersNotFound).toEqual(expect.arrayContaining([]))

  });

  test("should return status 200 with creation of the group", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
     username: "admin",
     email: "admin@test.it",
     password: hashedPassword,
     role: "Admin",
    });
 
   const token = jwt.sign(
     {
       email: user.email,
       id: user._id,
       username: user.username,
       role: user.role,
     },
     process.env.ACCESS_KEY,
     { expiresIn: "365d" }
   );
 
   user.refreshToken = token;
   await user.save();

   const user0 = await User.create({
     username: "User0",
     email: "email0@test.it",
     password: hashedPassword,
     role: "Admin",
   });

   const user1 = await User.create({
     username: "User1",
     email: "email1@test.it",
     password: hashedPassword,
     role: "Regular",
   });

   const cookies = {
     accessToken: token,
     refreshToken: token
   };
   
   let cookieHeader = "";
   Object.entries(cookies).forEach(([name, value]) => {
     cookieHeader += `${name}=${value}; `;
   });

   const response = await request(app)
     .post("/api/groups")
     .set('Cookie', cookieHeader)
     .send({name:"newGroup", memberEmails:["admin@test.it","email0@test.it", "email1@test.it"]})
 
   expect(response.status).toBe(200);
   expect(response.body.data.group.name).toEqual("newGroup")
   expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email0@test.it"}, {email: "email1@test.it"},{email: "admin@test.it"}]))
   expect(response.body.data.alreadyInGroup).toEqual(expect.arrayContaining([]))
   expect(response.body.data.membersNotFound).toEqual(expect.arrayContaining([]))
  
  });

  test("Should create a group with alreadyInGroup as an empty array", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
     username: "admin",
     email: "admin@test.it",
     password: hashedPassword,
     role: "Admin",
    });
 
   const token = jwt.sign(
     {
       email: user.email,
       id: user._id,
       username: user.username,
       role: user.role,
     },
     process.env.ACCESS_KEY,
     { expiresIn: "365d" }
   );
 
   user.refreshToken = token;
   await user.save();

   const user0 = await User.create({
     username: "User0",
     email: "email0@test.it",
     password: hashedPassword,
     role: "Admin",
   });

   const user1 = await User.create({
     username: "User1",
     email: "email1@test.it",
     password: hashedPassword,
     role: "Regular",
   });

   const cookies = {
     accessToken: token,
     refreshToken: token
   };
   
   let cookieHeader = "";
   Object.entries(cookies).forEach(([name, value]) => {
     cookieHeader += `${name}=${value}; `;
   });

   const response = await request(app)
     .post("/api/groups")
     .set('Cookie', cookieHeader)
     .send({name:"newGroup", memberEmails:["admin@test.it","email0@test.it", "email1@test.it"]})
 
   expect(response.status).toBe(200);
   expect(response.body.data.group.name).toEqual("newGroup")
   expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email0@test.it"}, {email: "email1@test.it"},{email: "admin@test.it"}]))
   expect(response.body.data.alreadyInGroup).toEqual(expect.arrayContaining([]))
   expect(response.body.data.membersNotFound).toEqual(expect.arrayContaining([]))
  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const response = await request(app)
      .post("/api/groups")
      .set('Cookie', cookieHeader)
      .send({name:"newGroup", memberEmails:["admin@test.it","email0@test.it", "email1@test.it"]})

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }); 


})

describe("getGroups", () => { 
  
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await Group.deleteMany({})
    await User.deleteMany({})
  })
  
  test("should return error 401 if the user is not an admin", async () => {
    
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get("/api/groups")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized");


  });

  test("should return success with the status 200 even though there are no groups", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get("/api/groups")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(200);
    expect(response.body.data.groups).toEqual(expect.arrayContaining([]));
  //  expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("should return success with the status 200 showing all the groups", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user3 = await User.create({
      username: "User3",
      email: "email3@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
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
          email: "email2@test.it",
        }
      ]
    })

    const group1 = await Group.create({
      name: "TestGroup1",
      members:
      [
        {
          email: "email1@test.it",
        },
        {
          email: "email3@test.it",
        }
      ]

    })


    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get("/api/groups")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(200);
    expect(response.body.data[0].name).toEqual(group.name) 
    expect(response.body.data[0].members).toEqual(expect.arrayContaining( [{email: group.members[0].email}, {email: group.members[1].email}] ))
    expect(response.body.data[1].name).toEqual(group1.name)
    expect(response.body.data[1].members).toEqual(expect.arrayContaining([{email: group1.members[0].email}, {email: group1.members[1].email}]))
   // expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const response = await request(app)
      .get("/api/groups")
      .set('Cookie', cookieHeader)

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }); 

})

describe("getGroup", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await Group.deleteMany({})
    await User.deleteMany({})
  }) 

  test("should return error with status 400 if the group does not exist", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
  
    const token = jwt.sign(
      {
        email: "user@test.it",
        id: 0,
        username: "User",
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const groupName = "nonExistingGroup"

    const response = await request(app)
      .get(`/api/groups/${groupName}`)
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Group does not exist!");

  });
  
  
  test("should return error 401 if the user is not an admin and not a member of the group", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get(`/api/groups/${group.name}`)
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("the user is not part of this group");

  });

  test("should return status 200 showing the group if the user is an admin", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "admin",
      email: "admin@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get(`/api/groups/${group.name}`)
      .set('Cookie', cookieHeader)
  
      expect(response.status).toBe(200);
      expect(response.body.data.group.name).toEqual(group.name) 
      expect(response.body.data.group.members).toEqual(expect.arrayContaining( [{email: group.members[0].email}, {email: group.members[1].email}] ))
      //expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("should return status 200 showing the group if the user is not an admin but a member of the group", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "user",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "user@test.it",
        },
        {
          email: "email0@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })

    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .get(`/api/groups/${group.name}`)
      .set('Cookie', cookieHeader)
  
      expect(response.status).toBe(200);
      expect(response.body.data.group.name).toEqual(group.name) 
      expect(response.body.data.group.members).toEqual(expect.arrayContaining( [{email: group.members[0].email}, {email: group.members[1].email},{email: group.members[2].email}] ))
      //expect(response.body.refreshedTokenMessage).toBeDefined();
    

  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const name = "TestGroup"
    const response = await request(app)
      .get(`/api/groups/${name}`)
      .set('Cookie', cookieHeader)

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }); 

})

describe("addToGroup", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
  })

  test("should return 400 if the attribute email is not defined", async () => {
    const name = "GroupTest"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Attribute emails is missing!");
  });

  test("should return 400 if the group not exist", async () => {
    const name = "GroupTest"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Group not exist" );
  });

  test("should return 401 if the user is not an admin with the route for admin", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized" );
  });

  test("should return 401 if the user is not in the group with the route for users", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/add`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("the user is not part of this group" );
  });

  test("should return 400 if the list of emails is empty", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: []})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Members list is empty!" );
  });

  test("should return 400 if the list of emails has at least one invalid email", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email@test.it", "email1test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("One or more emails are invalid!" );
  });

  test("should return 400 if the list of emails has at least one email as an empty string", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email@test.it", ""]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("One or more emails are invalid!" );
  });

  test("should return 400 if all the emails are not in the database", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email2@test.it", "email3@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All members not exist!" );
  });

  test("should return 400 if all members are already in a group", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user3 = await User.create({
      username: "User3",
      email: "email3@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
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
          email: "email2@test.it",
        }
      ]
    })

    const group1 = await Group.create({
      name: "TestGroup1",
      members:
      [
        {
          email: "email1@test.it",
        },
        {
          email: "email3@test.it",
        }
      ]

    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All members are already in group!" );
  });

  test("should return 400 if all members are already in a group or not exist", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user3 = await User.create({
      username: "User3",
      email: "email3@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
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
          email: "email2@test.it",
        }
      ]
    })

    const group1 = await Group.create({
      name: "TestGroup1",
      members:
      [
        {
          email: "email1@test.it",
        },
        {
          email: "email3@test.it",
        }
      ]

    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it", "email5@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All members not exist or are already in a group!" );
  });

  test("should return 200 if there are some valid members in the list(is an admin)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user3 = await User.create({
      username: "User3",
      email: "email3@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
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
          email: "email2@test.it",
        }
      ]
    })

    const group1 = await Group.create({
      name: "TestGroup1",
      members:
      [
        {
          email: "email1@test.it",
        },
        {
          email: "email3@test.it",
        }
      ]

    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it", "email5@test.it", "user@test.it"]})
    expect(response.status).toBe(200);
    expect(response.body.data.group.name).toBe(name)
    expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email0@test.it"}, {email: "email2@test.it"}, {email: "user@test.it"}]))
    expect(response.body.data.alreadyInGroup).toEqual(expect.arrayContaining(["email0@test.it", "email1@test.it"]))
    expect(response.body.data.membersNotFound).toEqual(expect.arrayContaining(["email5@test.it"]))
    //expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("should return 200, there are only valid members in the list(is an admin)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user6 = await User.create({
      username: "User6",
      email: "email6@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user4 = await User.create({
      username: "User4",
      email: "email4@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user3 = await User.create({
      username: "User3",
      email: "email3@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "email6@test.it",
        },
        {
          email: "email2@test.it",
        }
      ]
    })

    const group1 = await Group.create({
      name: "TestGroup1",
      members:
      [
        {
          email: "email4@test.it",
        },
        {
          email: "email3@test.it",
        }
      ]

    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/insert`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it",  "user@test.it"]})
    expect(response.status).toBe(200);
    expect(response.body.data.group.name).toBe(name)
    expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email0@test.it"}, {email: "email1@test.it"}, {email: "user@test.it"}, {email: "email6@test.it"},{email: "email2@test.it"}]))
    expect(response.body.data.alreadyInGroup).toEqual([])
    expect(response.body.data.membersNotFound).toEqual([])
  //  expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("should return 200 if there are some valid members in the list (is a user)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user3 = await User.create({
      username: "User3",
      email: "email3@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "user@test.it",
        },
        {
          email: "email2@test.it",
        }
      ]
    })

    const group1 = await Group.create({
      name: "TestGroup1",
      members:
      [
        {
          email: "email1@test.it",
        },
        {
          email: "email3@test.it",
        }
      ]

    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/add`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it", "email5@test.it", "user@test.it"]})
    expect(response.status).toBe(200);
    expect(response.body.data.group.name).toBe(name)
    expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email0@test.it"}, {email: "email2@test.it"}, {email: "user@test.it"}]))
    expect(response.body.data.alreadyInGroup).toEqual(expect.arrayContaining(["user@test.it", "email1@test.it"]))
    expect(response.body.data.membersNotFound).toEqual(expect.arrayContaining(["email5@test.it"]))
    //expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/add`)
      .set('Cookie', cookieHeader)
      .send({emails:["user@test.it", "email1@test.it"]})

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

 })

describe("removeFromGroup", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
  })

  test("should return 400 if the attribute email is not defined", async () => {
    const name = "GroupTest"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Attribute emails is missing!");
  });

  test("should return 400 if the group not exist", async () => {
    const name = "GroupTest"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Group not exist" );
  });

  test("should return 401 if the user is not an admin with the route for admin", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized" );
  });

  test("should return 401 if the user is not in the group with the route for users", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/remove`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("the user is not part of this group" );
  });

  test("should return 400 if the group has only one member", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "user@test.it",
        }
      ]
    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Only one member in the group!" );
  });

  test("should return 400 if the list of emails is empty", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: []})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Members list is empty!" );
  });

  test("should return 400 if the list of emails has at least one invalid email", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email@test.it", "email1test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("One or more emails are invalid!" );
  });

  test("should return 400 if the list of emails has at least one email as an empty string", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email@test.it", ""]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("One or more emails are invalid!" );
  });

  test("should return 400 if all the emails are not in the database", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "email2@test.it",
        },
        {
          email: "user@test.it",
        }
      ]
    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All members not exist!" );
  });

  test("should return 400 if all members are not in the group", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "user@test.it",
        },
        {
          email: "email2@test.it",
        }
      ]
    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All members are not in the group!" );
  });

  test("should return 400 if all members are not in the group or not exist", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
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
          email: "email2@test.it",
        }
      ]
    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["user@test.it", "email1@test.it", "email5@test.it"]})
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All members cannot be removed!" );
  });

  test("should return 200 if there are some valid members in the list(is an admin)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
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
          email: "email2@test.it",
        }
      ]
    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it", "email5@test.it", "user@test.it"]})
    expect(response.status).toBe(200);
    expect(response.body.data.group.name).toBe(name)
    expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email2@test.it"}]))
    expect(response.body.data.notInGroup).toEqual(expect.arrayContaining(["email1@test.it", "user@test.it"]))
    expect(response.body.data.membersNotFound).toEqual(expect.arrayContaining(["email5@test.it"]))
    //expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("should return 200 if there are some valid members in the list- try to remove all(is an admin)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
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
          email: "email2@test.it",
        }
      ]
    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/pull`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it", "email5@test.it", "user@test.it", "email2@test.it"]})
    expect(response.status).toBe(200);
    expect(response.body.data.group.name).toBe(name)
    expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email0@test.it"}]))
    expect(response.body.data.notInGroup).toEqual(expect.arrayContaining(["email1@test.it", "user@test.it"]))
    expect(response.body.data.membersNotFound).toEqual(expect.arrayContaining(["email5@test.it"]))
    //expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("should return 200 if there are some valid members in the list (is a user)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "user@test.it",
        },
        {
          email: "email2@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/remove`)
      .set('Cookie', cookieHeader)
      .send({emails: ["email0@test.it", "email1@test.it", "email5@test.it"]})
    expect(response.status).toBe(200);
    expect(response.body.data.group.name).toBe(name)
    expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email2@test.it"}, {email: "user@test.it"}]))
    expect(response.body.data.notInGroup).toEqual(expect.arrayContaining(["email0@test.it"]))
    expect(response.body.data.membersNotFound).toEqual(expect.arrayContaining(["email5@test.it"]))
    //expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("should return 200 if there are only valid members in the list (is a user)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "user@test.it",
        },
        {
          email: "email2@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/remove`)
      .set('Cookie', cookieHeader)
      .send({emails: ["user@test.it", "email1@test.it"]})
    expect(response.status).toBe(200);
    expect(response.body.data.group.name).toBe(name)
    expect(response.body.data.group.members).toEqual(expect.arrayContaining([{email: "email2@test.it"}]))
    expect(response.body.data.notInGroup).toEqual([])
    expect(response.body.data.membersNotFound).toEqual([])
    //expect(response.body.refreshedTokenMessage).toBeDefined();
    
  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const name = "TestGroup"
    const response = await request(app)
      .patch(`/api/groups/${name}/remove`)
      .set('Cookie', cookieHeader)
      .send({emails: ["user@test.it", "email1@test.it"]})

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

 })

describe("deleteUser", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
    await transactions.deleteMany({})
    await categories.deleteMany({})
  })

  test("should return 401 if the user is not an admin", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized");
  });

  test("should return 400 if the attribute email is missing", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Attribute email is missing!");
  });

  test("should return 400 if the email is an empty string", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
      .send({ email: "" });
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Email is an empty string!");
  });

  test("should return 400 if the email is an invalid email", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
      .send({ email: "emailtest.it" });
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Email is not valid!");
  });

  test("should return 400 if the user not exist", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
      .send({ email: "email@test.it" });
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("User not found!");
  });

  test("should return 400 if the user is an admin", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
      .send({ email: "user@test.it" });
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Cannot delete other admins");
  });

  test("should return 200 if the user is successfully deleted (no group, no transactions)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const userToDelete = await User.create({
      username: "User1",
      email: "email@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
      .send({ email: "email@test.it" });
  
    expect(response.status).toBe(200);
    expect(response.body.data.deletedTransactions).toBe(0)
    expect(response.body.data.deletedFromGroup).toBe(false)
   // expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("should return 200 if the user is successfully deleted (is in a group, some transactions)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const category= await categories.create({
      type: "category1",
      color: "color1"
    })

    const transaction1= await transactions.create({
      username: "User2",
      amount: 50,
      type: category.type
    })

    const transaction2= await transactions.create({
      username: "User2",
      amount: 500,
      type: category.type
    })

    const transaction3= await transactions.create({
      username: "User0",
      amount: 500,
      type: category.type
    })

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user2 = await User.create({
      username: "User2",
      email: "email2@test.it",
      password: hashedPassword,
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
          email: "email2@test.it",
        }
      ]
    })

    const group1 = await Group.create({
      name: "TestGroup1",
      members:
      [
        {
          email: "user@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
      .send({ email: "email2@test.it" });
    
    expect(response.status).toBe(200);
    expect(response.body.data.deletedTransactions).toBe(2)
    expect(response.body.data.deletedFromGroup).toBe(true)
    //expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("should return 200 if the user is successfully deleted (is in a group and the last member, some transactions)", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const category= await categories.create({
      type: "category1",
      color: "color1"
    })

    const transaction1= await transactions.create({
      username: "User0",
      amount: 50,
      type: category.type
    })

    const transaction2= await transactions.create({
      username: "User1",
      amount: 500,
      type: category.type
    })

    const transaction3= await transactions.create({
      username: "User0",
      amount: 500,
      type: category.type
    })

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Regular",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const group = await Group.create({
      name: "TestGroup",
      members:
      [
        {
          email: "email0@test.it",
        }
      ]
    })

    const group1 = await Group.create({
      name: "TestGroup1",
      members:
      [
        {
          email: "user@test.it",
        },
        {
          email: "email1@test.it",
        }
      ]
    })

    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
      .send({ email: "email0@test.it" });

    expect(response.status).toBe(200);
    expect(response.body.data.deletedTransactions).toBe(2)
    expect(response.body.data.deletedFromGroup).toBe(true)
    //expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const name = "TestGroup"
    const response = await request(app)
      .delete("/api/users")
      .set('Cookie', cookieHeader)
      .send({ email: "email0@test.it" });

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

 })

describe("deleteGroup", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
  })

  test("should return 401 if the user is not an admin", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Regular",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const groupName = "TestGroup";
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/groups")
      .set('Cookie', cookieHeader)
      .send({ name: groupName });
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized");
  });

  test("should return 400 if the attribute name is missing", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/groups")
      .set('Cookie', cookieHeader)
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Attribute name is missing!");
  });

  test("should return 400 if the name is an empty string", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/groups")
      .set('Cookie', cookieHeader)
      .send({ name: "" });
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Name is an empty string");
  });

  test("should return 400 if the group not exist", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const groupName = "TestGroup";
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const response = await request(app)
      .delete("/api/groups")
      .set('Cookie', cookieHeader)
      .send({ name: groupName });
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Group not exist!");
  });

  test("should return 200 if the group successfully deleted", async () => {
    const hashedPassword = await bcrypt.hash("secure_password", 12);
    const user = await User.create({
      username: "User",
      email: "user@test.it",
      password: hashedPassword,
      role: "Admin",
    });
  
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );
  
    user.refreshToken = token;
    await user.save();
  
    const groupName = "TestGroup";
    const cookies = {
      accessToken: token,
      refreshToken: token
    };
    
    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    const user0 = await User.create({
      username: "User0",
      email: "email0@test.it",
      password: hashedPassword,
      role: "Admin",
    });

    const user1 = await User.create({
      username: "User1",
      email: "email1@test.it",
      password: hashedPassword,
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
      .delete("/api/groups")
      .set('Cookie', cookieHeader)
      .send({ name: groupName });
  
    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe("Group deleted successfully");
    //expect(response.body.refreshedTokenMessage).toBeDefined();
  });

  test("Should return 500 if there is an internal server error", async () => {
    const token = jwt.sign(
      {
        username: "User",
        email: "user@test.it",
        id: 0,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "365d" }
    );

    const cookies = {
      accessToken: token,
      refreshToken: token,
    };

    let cookieHeader = "";
    Object.entries(cookies).forEach(([name, value]) => {
      cookieHeader += `${name}=${value}; `;
    });

    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();

    const name = "TestGroup"
    const response = await request(app)
      .delete("/api/groups")
      .set('Cookie', cookieHeader)
      .send({ name: name });

    expect(response.status).toBe(500);

    const dbName = "testingDatabaseUsers";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

 })
