import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
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


describe("register", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should return 400 if some attributes are missing", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        username: "testuser",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Some attributes are missing!");
  });

  test("should return 400 if any attribute is an empty string", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        username: "",
        email: "test@test.com",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Cannot insert an empty string!");
  });

  test("should return 400 if email is not valid", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        username: "testuser",
        email: "invalidemail",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Email not valid");
  });

  test("should return 400 if email is already used", async () => {
    // Create a user with the same email
    await User.create({
      username: "existinguser",
      email: "test@test.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/register")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Email is already used");
  });

  test("should return 400 if username is already used", async () => {
    // Create a user with the same username
    await User.create({
      username: "testuser",
      email: "existing@test.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/register")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Username is already used");
  });

  test("should register a new user and return 200", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe("User added succesfully");
  });
});

describe('registerAdmin', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('should return 400 if some attributes are missing', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({
        username: 'testuser',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Some attributes are missing!');
  });

  test('should return 400 if any attribute is an empty string', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({
        username: '',
        email: 'test@test.com',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot insert an empty string!');
  });

  test('should return 400 if email is not valid', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({
        username: 'testuser',
        email: 'invalidemail',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email not valid');
  });

  test('should return 400 if email is already used', async () => {
    // Create a user with the same email
    await User.create({
      username: 'existinguser',
      email: 'test@test.com',
      password: 'password123',
    });

    const response = await request(app)
      .post('/api/admin')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email is already used');
  });

  test('should return 400 if username is already used', async () => {
    // Create a user with the same username
    await User.create({
      username: 'testuser',
      email: 'existing@test.com',
      password: 'password123',
    });

    const response = await request(app)
      .post('/api/admin')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Username is already used');
  });

  test('should register a new admin user and return 200', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe('Admin added successfully');
  });
});

describe("login", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should return 400 if some attributes are missing", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Some attributes are missing!");
  });

  test("should return 400 if any attribute is an empty string", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({
        email: "",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Cannot insert an empty string!");
  });

  test("should return 400 if email is not valid", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({
        email: "invalidemail",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Email not valid");
  });

  test("should return 400 if user does not exist", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({
        email: "nonexistent@test.com",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Please you need to register");
  });

  test("should return 400 if password is incorrect", async () => {
    await User.create({
      username: "testuser",
      email: "test@test.com",
      password: "password123", //should return error even if the 2 passeword are equal because we store hashed password
    });

    const response = await request(app)
      .post("/api/login")
      .send({
        email: "test@test.com",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Wrong Password!");
  });

  test("should login user and return access token and refresh token", async () => {

    const user= await User.create({
      username: "testuser",
      email: "test@test.com",
      password: bcrypt.hashSync("password123", 12),
    });

    await user.save();

    const response = await request(app)
      .post("/api/login")
      .send({
        email: "test@test.com",
        password: "password123",
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
    
  });
});

describe("logout", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should return 400 if Refresh Token is not provided", async () => {
    const response = await request(app).get("/api/logout");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Refresh Token not found");
  });

  test("should return 400 if user with Refresh Token is not found", async () => {
    const refreshToken = "nonexistentToken";

    const response = await request(app)
      .get("/api/logout")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("User not found");
  });

  test("should logout user and clear access token and refresh token cookies", async () => {
    const user = await User.create({
      username: "testuser",
      email: "test@test.com",
      password: "password123",
      refreshToken: "validRefreshToken",
      accessToken:"validAccessToken"
    });

    const response = await request(app)
      .get("/api/logout")
      .set("Cookie", ["refreshToken=validRefreshToken"]);

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe("User logged out");
    
    const cookies = response.headers["set-cookie"];
    expect(cookies).toHaveLength(2);
  
    const cookieNames = cookies.map((cookie) => cookie.split(";")[0].trim());
    expect(cookieNames).toContain("accessToken=");
    expect(cookieNames).toContain("refreshToken=");
  
    const accessTokenCookie = cookies.find((cookie) => cookie.startsWith("accessToken="));
    expect(accessTokenCookie).toContain("Path=/api");
    expect(accessTokenCookie).toContain("SameSite=None");
    expect(accessTokenCookie).toContain("Secure");
    expect(accessTokenCookie).toContain("HttpOnly");
  
    const refreshTokenCookie = cookies.find((cookie) => cookie.startsWith("refreshToken="));
    expect(refreshTokenCookie).toContain("Path=/api");
    expect(refreshTokenCookie).toContain("SameSite=None");
    expect(refreshTokenCookie).toContain("Secure");
    expect(refreshTokenCookie).toContain("HttpOnly");
  
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.refreshToken).toBeNull();
});
});