import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { verifyAuth } from "./utils.js";

/**
 * Register a new user in the system
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */

export const register = async (req, res) => {
  try {

    //Check the correct number of attributes in the request body
   if (!('username'in req.body )|| !('email' in req.body)|| !('password' in req.body)) return res.status(400).json({error: 'Some attributes are missing!'});
    
   const { username, email, password } = req.body;
    //Check for empty string
    if (username.trim()=== '' || email.trim() === '' || password.trim() === '') {
        return res.status(400).json({ error: "Cannot insert an empty string!" });
    }

    //Validate email
    if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
      return res.status(400).json({ error: "Email not valid" });
    }

    //Check for existing email
    let existingUser = await User.findOne({ email: req.body.email });
    if (existingUser)
      return res.status(400).json({ error: "Email is already used" });

    //Check for existing username
    existingUser = await User.findOne({ username: req.body.username });
    if (existingUser)
      return res.status(400).json({ error: "Username is already used" });

    
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    res.status(200).json({ data: { message: "User added succesfully" } });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Register a new user in the system with an Admin role
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const registerAdmin = async (req, res) => {
  try {
    
    //Check the correct number of attributes in the request body
    if (!('username'in req.body )|| !('email' in req.body)|| !('password' in req.body)) return res.status(400).json({error: 'Some attributes are missing!'});
    
  
      const { username, email, password } = req.body;
  
      //Check for empty string
      if (username.trim()=== '' || email.trim() === '' || password.trim() === '') {
        return res.status(400).json({ error: "Cannot insert an empty string!" });
      }
  
      //Validate email
      if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        return res.status(400).json({ error: "Email not valid" });
      }
  
      //Check for existing email
      let existingUser = await User.findOne({ email: req.body.email });
      if (existingUser)
        return res.status(400).json({ error: "Email is already used" });
  
      //Check for existing username
      existingUser = await User.findOne({ username: req.body.username });
      if (existingUser)
        return res.status(400).json({ error: "Username is already used" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "Admin",
    });
    res.status(200).json( {data: { message: "Admin added successfully"}});
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Perform login 
  - Request Body Content: An object having attributes `email` and `password`
  - Response `data` Content: An object with the created accessToken and refreshToken
  - Optional behavior:
    - error 400 is returned if the user does not exist
    - error 400 is returned if the supplied password does not match with the one in the database
 */
export const login = async (req, res) => {
  
  //Check the correct number of attributes in the request body
  if (!('email' in req.body )||! ('password' in req.body)) return res.status(400).json({ error: "Some attributes are missing!" });

  const { email, password } = req.body;

  //Check for empty string
  if (email.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: "Cannot insert an empty string!" });
  }

  //Validate email
  if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    return res.status(400).json({ error: "Email not valid" });
  }
 try {
  const cookie = req.cookies;
  const existingUser = await User.findOne({ email: req.body.email });
  if (!existingUser)
    return res.status(400).json({ error: "Please you need to register" });
 
    const match = await bcrypt.compare(password, existingUser.password);
    if (!match) return res.status(400).json({error: "Wrong Password!"});
    //CREATE ACCESSTOKEN
    const accessToken = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );
    //CREATE REFRESH TOKEN
    const refreshToken = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );
    //SAVE REFRESH TOKEN TO DB
    existingUser.refreshToken = refreshToken;
    const savedUser = await existingUser.save();
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      domain: "localhost",
      path: "/api",
      maxAge: 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      domain: "localhost",
      path: "/api",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    res
      .status(200)
      .json({ data: { accessToken: accessToken, refreshToken: refreshToken } });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Perform logout
  - Auth type: Simple
  - Request Body Content: None
  - Response `data` Content: A message confirming successful logout
  - Optional behavior:
    - error 400 is returned if the user does not exist
 */
export const logout = async (req, res) => {
  
/*   const simpleAuth = verifyAuth(req, res, { authType: "Simple" });
  if (!simpleAuth.flag)
    return res.status(401).json({ error: simpleAuth.cause });
 */
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(400).json({ error: "Refresh Token not found" });

  const user = await User.findOne({ refreshToken: refreshToken });
  if (!user) 
    return res.status(400).json({ error: "User not found" });
  
  try {
    
    user.refreshToken = null;
    const savedUser = await user.save();


    res.cookie("accessToken", "", {
      path: "/api",
      expires: "",
      sameSite: "None",
      secure: true,
      httpOnly: true
      
    });
    
    res.cookie("refreshToken", "", {
      path: "/api",
      expires: "",
      sameSite: "None",
      secure: true,
      httpOnly: true
    });
    
    res.status(200).json({ data: { message: "User logged out" } });

  } catch (error) {
    res.status(500).json(error.message);
  }
};
