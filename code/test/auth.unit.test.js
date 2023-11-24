import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { verifyAuth } from '../controllers/utils'; //  mandatory for logout and login
const bcrypt = require("bcryptjs")
import jwt, { TokenExpiredError } from 'jsonwebtoken';


jest.mock("jsonwebtoken");

import { register,login,logout,registerAdmin } from '../controllers/auth';

jest.mock("bcryptjs")
jest.mock('../models/User.js');
jest.mock("../controllers/utils.js", ()=> ({   // <--- Outside of any describe block , right after jest.mock('../models/User.js');
  verifyAuth: jest.fn()
}))
/* 
 
 
 then in the test mock with the following methods

 verifyAuth.mockReturnValue({authorized: true, cause: "Authorized"})
 OR
 verifyAuth.mockReturnValue({authorized: false, cause: "whateverCause"}) <-- double check this

 Inside each test block. This replaces calling spyOn and It works in the same way */


 describe('register', () => {

    // handler for events that must occur between test in THIS describe block
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 500 erro if some generic error occurs', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'testpassword',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(), //this is necessary because describe method chains status() with json() like this status(1234).json()
        json: jest.fn(),
      };

      bcrypt.hash.mockImplementation(()=>  { throw new Error('Some random error')}) // mock bcrypt, we do not need to test dependencies here

     
      await register(req, res);



      expect(res.json).toHaveBeenCalledWith('Some random error'); //successfully it's spelled with 2 's' btw
    });

    it('should register a new user succesfully', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'testpassword',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(), //this is necessary because describe method chains status() with json() like this status(1234).json()
        json: jest.fn(),
      };

      bcrypt.hash.mockResolvedValue('hashedPassword'); // mock bcrypt, we do not need to test dependencies here

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      await register(req, res);

      expect(User.findOne).toHaveBeenCalledTimes(2); // 1 for username, 1 for email
      expect(User.create).toHaveBeenCalledTimes(1); // chat gpt added these seems fair
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
      });

    // test the final results

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ data: { message: 'User added succesfully' } }); //successfully it's spelled with 2 's' btw
    });

    
    it('should return an error when some attributes are missing', async () => {
      const req = {
        body: {
          // assuming this test when everything is missing, but it should be the same if whatever is missing
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await register(req, res);

      // test for calls that should not be reachable

      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();

     // test the final results

      expect(res.status).toHaveBeenCalledTimes(1);
      //expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({ error: 'Some attributes are missing!' });
    });
  
        //here follow all the tests for unsuccessfull operations
       


    it('should return an error when trying to insert an empty string', async () => {
        const req = {
          body: {
            username: '',
            email: 'test@example.com',
            password: 'testpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        await register(req, res);
    
        expect(User.findOne).not.toHaveBeenCalled(); 
        expect(User.create).not.toHaveBeenCalled(); 
    
        expect(res.status).toHaveBeenCalledTimes(1); 
        expect(res.status).toHaveBeenCalledWith(400); 
    
        expect(res.json).toHaveBeenCalledTimes(1); 
        expect(res.json).toHaveBeenCalledWith({ error: 'Cannot insert an empty string!' }); 
      }); 
    

       it('should return an error when the email format is not valid', async () => {
        const req = {
          body: {
            username: 'testuser',
            email: 'invalidemail',
            password: 'testpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        await register(req, res);
    
        expect(User.findOne).not.toHaveBeenCalled(); 
        expect(User.create).not.toHaveBeenCalled(); 
    
        expect(res.status).toHaveBeenCalledTimes(1); 
        expect(res.status).toHaveBeenCalledWith(400); 
        expect(res.json).toHaveBeenCalledTimes(1); 
        expect(res.json).toHaveBeenCalledWith({ error: 'Email not valid' }); 
      }); 
    
       it('should return an error when the email is already used', async () => {

        User.findOne.mockResolvedValueOnce({}); // this time i mock the User.findOne method to return an actual object, so there will be an existing user
    
        const req = {
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        await register(req, res);
    
        expect(User.findOne).toHaveBeenCalledTimes(1); 
        expect(User.create).not.toHaveBeenCalled(); 
    
        expect(res.status).toHaveBeenCalledTimes(1); 
        expect(res.status).toHaveBeenCalledWith(400); 
    
        expect(res.json).toHaveBeenCalledTimes(1); 
        expect(res.json).toHaveBeenCalledWith({ error: 'Email is already used' }); 
      }); 
    
     it('should return an error when the username is already used', async () => {

        User.findOne.mockResolvedValueOnce(null); //the first mock of User.findOne method to return null? (no existing user) so we can procide to evaluate the user name
        User.findOne.mockResolvedValueOnce({}); // mock the remaining times (expect one more time only) to return an existing username
    
        const req = {
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        await register(req, res);
    
        expect(User.findOne).toHaveBeenCalledTimes(2); 
        expect(User.create).not.toHaveBeenCalled(); 
    
        expect(res.status).toHaveBeenCalledTimes(1); 
        expect(res.status).toHaveBeenCalledWith(400); 
    
        expect(res.json).toHaveBeenCalledTimes(1); 
        expect(res.json).toHaveBeenCalledWith({ error: 'Username is already used' }); 
      });

    
      
    });
 
    describe('registerAdmin', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });
    
      it('should return an error if attributes are missing in the request body', async () => {
        const req = {
          body: {
            username: 'admin',
            password: 'adminpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        await registerAdmin(req, res);
    
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({ error: 'Some attributes are missing!' });
      });
    
     
    
      it('should return an error if any attribute is an empty string', async () => {
        const req = {
          body: {
            username: '',
            email: 'admin@example.com',
            password: 'adminpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        await registerAdmin(req, res);
    
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({ error: 'Cannot insert an empty string!' });
      });
    
      it('should return an error if the email is not valid', async () => {
        const req = {
          body: {
            username: 'admin',
            email: 'invalidemail',
            password: 'adminpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        await registerAdmin(req, res);
    
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email not valid' });
      });
    
      it('should return an error if the email is already used', async () => {
        const req = {
          body: {
            username: 'admin',
            email: 'admin@example.com',
            password: 'adminpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        User.findOne.mockResolvedValue({ email: 'admin@example.com' });
    
        await registerAdmin(req, res);
    
        expect(User.findOne).toHaveBeenCalledTimes(1);
        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email is already used' });
      });
    
      it('should return an error if the username is already used', async () => {
        const req = {
          body: {
            username: 'admin',
            email: 'admin@example.com',
            password: 'adminpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        User.findOne.mockResolvedValueOnce(null);
        User.findOne.mockResolvedValueOnce({ username: 'admin' });
    
        await registerAdmin(req, res);
    
        expect(User.findOne).toHaveBeenCalledTimes(2);
        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(User.findOne).toHaveBeenCalledWith({ username: 'admin' });
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({ error: 'Username is already used' });
      });
    
      it('should register a new admin user successfully', async () => {
        const req = {
          body: {
            username: 'admin',
            email: 'admin@example.com',
            password: 'adminpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        bcrypt.hash.mockResolvedValue('hashedPassword');
    
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
          username: 'admin',
          email: 'admin@example.com',
          password: 'hashedPassword',
          role: 'Admin',
        });
    
        await registerAdmin(req, res);
    
        expect(User.findOne).toHaveBeenCalledTimes(2);
        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(User.findOne).toHaveBeenCalledWith({ username: 'admin' });
    
        expect(User.create).toHaveBeenCalledTimes(1);
        expect(User.create).toHaveBeenCalledWith({
          username: 'admin',
          email: 'admin@example.com',
          password: 'hashedPassword',
          role: 'Admin',
        });
    
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({ data:{ message: 'Admin added successfully' }});
      });
    
      it('should return a server error if an exception is thrown', async () => {
        const req = {
          body: {
            username: 'admin',
            email: 'admin@example.com',
            password: 'adminpassword',
          },
        };
    
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        bcrypt.hash.mockRejectedValue(new Error('Some error'));
    
        await registerAdmin(req, res);
    
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith(('Some error'));
      });
    });

    //login
    
describe('login', () => { 

  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('should return a 400 response if the username deos not correspond to a registered user', async () => {
    const req = {
      body: {
        email: 'example@example.com',
        password: 'password123',
      },
      cookies: {},
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  
    // Mocking the User.findOne function to throw an error
    User.findOne.mockResolvedValue(null);
    await login(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: 'Please you need to register'});
  });


  test('should return a 500 response with an error message', async () => {
    const req = {
      body: {
        email: 'example@example.com',
        password: 'password123',
      },
      cookies: {},
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  
    // Mocking the User.findOne function to throw an error
    User.findOne.mockImplementation(()=> { throw new Error('Database generic error')});
  
    await login(req, res);
  
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith('Database generic error');
  });

 
  
  it('should return an error when some attributes are missing', async () => {
    const req = {
      body: {
        // assuming this test when everything is missing, but it should be the same if whatever is missing
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await login(req, res);

    // test for calls that should not be reachable

    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();

   // test the final results

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ error: 'Some attributes are missing!' });
  });

      //here follow all the tests for unsuccessfull operations
     

    
  it('should return an error when trying to insert an empty string', async () => {
      const req = {
        body: {
         
          email: '',
          password: 'testpassword',
        },
      };
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      await login(req, res);
  
      expect(User.findOne).not.toHaveBeenCalled(); 
      expect(User.create).not.toHaveBeenCalled(); 
  
      expect(res.status).toHaveBeenCalledTimes(1); 
      expect(res.status).toHaveBeenCalledWith(400); 
  
      expect(res.json).toHaveBeenCalledTimes(1); 
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot insert an empty string!' }); 
    }); 
  

     it('should return an error when the email format is not valid', async () => {
      const req = {
        body: {
         
          email: 'invalidemail',
          password: 'testpassword',
        },
      };
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      await login(req, res);
  
      expect(User.findOne).not.toHaveBeenCalled(); 
      expect(User.create).not.toHaveBeenCalled(); 
  
      expect(res.status).toHaveBeenCalledTimes(1); 
      expect(res.status).toHaveBeenCalledWith(400); 
      expect(res.json).toHaveBeenCalledTimes(1); 
      expect(res.json).toHaveBeenCalledWith({ error: 'Email not valid' }); 
    }); 

    test('should return a 400 response if the passwrod provided is wrong', async () => {
      const req = {
        body: {
          email: 'example@example.com',
          password: 'password123',
        },
        cookies: {},
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };
    
      // Mocking the User.findOne function to throw an error
      User.findOne.mockResolvedValue({});
      bcrypt.compare.mockResolvedValue(false);
      await login(req, res);
    
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({error: 'Wrong Password!'});
    });

    test('should return a 200 response with access and refresh tokens', async () => {
      const existingUser = {
        email: 'example@example.com',
        password: 'password123',
        id: 'user123',
        username: 'example',
        role: 'user',
        refreshToken: 'refreshToken123',
        save: jest.fn().mockResolvedValueOnce(),
      };
    
    const req = {
      body: {
        email: 'example@example.com',
        password: 'password123',
      },
      cookies: {},
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  
    // Mocking the User.findOne and bcrypt.compare functions
    User.findOne = jest.fn().mockResolvedValueOnce(existingUser);
    bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
    jwt.sign = jest
      .fn()
      .mockReturnValueOnce('accessToken123')
      .mockReturnValueOnce('refreshToken123');
  
    await login(req, res);
  
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        accessToken: 'accessToken123',
        refreshToken: 'refreshToken123',
      },
    });
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'accessToken123', {
      httpOnly: true,
      domain: 'localhost',
      path: '/api',
      maxAge: 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refreshToken123', {
      httpOnly: true,
      domain: 'localhost',
      path: '/api',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
  });

   
});

describe('logout', () => { 

  beforeEach(() => {
    jest.clearAllMocks();
  });
    

  it('should return an error when the refresh token is missing', async () => {
    const req = {
      cookies: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
        
    await logout(req, res);

    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ error: 'Refresh Token not found' });
  });
  
  it('should return an error when the user is not found', async () => {
    const req = {
      cookies: {
        refreshToken: 'sampleRefreshToken',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findOne.mockResolvedValue(null);
   // verifyAuth.mockImplementation(() => ({ flag: true, cause: "Authorized" }));

    await logout(req, res);

    expect(User.findOne).toHaveBeenCalledTimes(1);
    expect(User.findOne).toHaveBeenCalledWith({ refreshToken: 'sampleRefreshToken' });

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('should logout a user successfully', async () => {
    const req = {
      cookies: {
        refreshToken: 'test-refresh-token',
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  
    const user = new User();
    user.refreshToken = 'validRefreshToken';
  
    const saveMock = jest.spyOn(user, 'save');
    saveMock.mockReturnValue(Promise.resolve(user));
    User.findOne.mockResolvedValue(user);
  
    await logout(req, res);
  
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'User logged out' } });
  
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.cookie).toHaveBeenCalledWith('accessToken', '', {
      path: '/api',
      expires: '',
      sameSite: 'None',
      secure: true,
      httpOnly: true,
    });
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', '', {
      path: '/api',
      expires: '',
      sameSite: 'None',
      secure: true,
      httpOnly: true,
    });
  });

  it('should return error 500 if error during save', async () => {
    const req = {
      cookies: {
        refreshToken: 'test-refresh-token',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  
    const user = new User();
    user.refreshToken = 'validRefreshToken';
  
    const saveMock = jest.spyOn(user, 'save');
    
    saveMock.mockRejectedValue(new Error('Some error'));
    User.findOne.mockResolvedValue(user);


    await logout(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith('Some error');

    expect(res.cookie).toHaveBeenCalledTimes(0);

});
});