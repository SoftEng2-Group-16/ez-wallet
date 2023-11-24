import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Group, User } from "../models/User.js";
jest.mock("jsonwebtoken")



describe("handleDateFilterParams", () => { 
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("empty req", () =>{
    const req = {query:{ }}
    let result=handleDateFilterParams(req);
    expect(result).toEqual({})
  })

  //Test only parameter data
  describe("Date tests", () =>{
    test("correct case", () => {
      const mockedDate = "2000-01-01"
      const formattedDateOne = "2000-01-01T00:00:00.000Z"
      const formattedDateTwo = "2000-01-01T23:59:59.999Z"

      const req = {query:{date : mockedDate}}

      const queryResult = handleDateFilterParams(req)
      expect(queryResult).toEqual({date: {
                                      $gte : expect.any(Date),
                                      $lte : expect.any(Date),
                                      }
                                  })
  })


      test("A000-01-01", () =>{
          const req = {query:{date : "A000-01-01"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error('Format date is not valid'))
      })
    

      test("2000-0A-01", () => {
          const req = {query:{date : "2000-0A-01"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format date is not valid"))
      })

      test("2000-24-01", () => {
          const req = {query:{date : "2000-24-01"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format date is not valid"))
      })

      test("2000-01-B", () => {
          const req =  {query:{date : "2000-01-B"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format date is not valid"))
      })

      test("2000-01-33", () => {
          const req = {query: {date : "2000-01-33"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format date is not valid"))
      })

      test("2000/01/10", () => {
        const req = {query:{date : "2000/01/10"}}
               expect(() => handleDateFilterParams(req)).toThrow(Error("Format date is not valid"))
    })

      test("01-02-2000", () => {
          const req = {query:{date : "01-02-2000"}}         
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format date is not valid"))
      })

      test("2000\\01\\01", () => {
          const req = {query:{date : "2023\\05\\12"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format date is not valid"))
      })

  })

  //Test only parameter from
  describe("From tests", () => {
    test("correct case", () => {
      const mockedDate = "2000-01-01"
      const formattedDate = "2000-01-01T00:00:00.000Z"
      const req = {query: {from : mockedDate }}     
     
      const res = handleDateFilterParams(req)

      expect(res).toEqual({date : {
                              $gte: expect.any(Date),
                              }
                          }) 
  })

  
      
      test("20000-01-01", () => {
          const req = {query: {from : "20000-01-01"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format from is not valid"))
      })


      test("2000-01-K0", () => {
          const req = {query:{from : "2000-01-K0"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format from is not valid"))
      })

      test("2000-01-33", () => {
          const req = {query:{from : "2000-01-33"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format from is not valid"))
      })

      test("2000-20-01", () => {
        const req = {query: {from : "2000-20-01"}}
        expect(() => handleDateFilterParams(req)).toThrow(Error("Format from is not valid"))
    })

      test("10-01-2000", () => {
          const req = {query: {from : "10-01-2000"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format from is not valid"))
      })

      test("2000\\0110", () => {
          const req = {query: {from : "2000\\0110"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format from is not valid"))
      })

      test("2020/01/10", () => {
        const req = {query: {from : "2020/01/10"}}
        expect(() => handleDateFilterParams(req)).toThrow(Error("Format from is not valid"))
    })
  })

  describe("upTo parameter", () => {
    test("correct case", () => {
      const mockedDate = "2023-06-02"
      const formattedDate = "2023-06-02T23:59:59.999Z"
      const req ={query: {upTo : mockedDate}}




      const queryResult = handleDateFilterParams(req)
      expect(queryResult).toEqual({date : {
                                      $lte : expect.any(Date),
                                      }
                                  })
  })


      test("A023-05-21", () =>{
          const req = {query:{upTo : "A023-05-21"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })

      test("20230-05-21", () => {
          const req = {query:{upTo : "20230-05-21"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })

      test("2023-0D-21", () => {
          const req = {query:{upTo : "2023-0D-21"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })

      test("2023-13-21", () => {
          const req = {query:{upTo : "2023-13-21"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })

      test("2023-05-A0", () => {
          const req = {query:{upTo : "2023-05-A0"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })

      test("2023-05-35", () => {
          const req = {query:{upTo : "2023-05-35"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })

      test("12-05-2023", () => {
          const req = {query:{upTo : "12-05-2023"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })

      test("2023/05/12", () => {
          const req = {query:{upTo : "2023/05/21"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })

      test("2023\\05\\12", () => {
          const req = {query:{upTo : "2023\\05\\21"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
      })
  })

  //Test parameter date and upTo togheter or date and from
  describe("Date and upTo or from test", () => {
      test("date and upTo", () => {
          const req = {query:{date : "2023-05-22", 
                                upTo : "2023-05-26"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error('Parameters are not valid'))
      })
      test("date and from", () => {
          const req = {query:{date : "2023-05-22", 
                                from : "2023-05-26"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error('Parameters are not valid'))
      })

  })


    //Test parameter date and upTo togheter or date and from
    describe("Date and upTo or from test", () => {
      test("date and upTo", () => {
          const req = {query:{date : "2023-05-22", 
                                upTo : "2023-05-26"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error('Parameters are not valid'))
      })
      test("date and from", () => {
          const req ={query: {date : "2023-05-22", 
                                from : "2023-05-26"}}
          expect(() => handleDateFilterParams(req)).toThrow(Error('Parameters are not valid'))
      })

  })
   //Test from and upTo togheter
   describe("from and upTo", () => {
    test("both parameter", () => {
        const mockedDateFrom = "2023-05-10"
        const mockedDateUpTo = "2023-05-31"
        const formattedDateFrom = "2023-05-10T00:00:00.000Z"
        const formattedDateUpTo = "2023-05-31T23:59:59.999Z"

        const req={query:{from:mockedDateFrom, upTo:mockedDateUpTo}}
        
        const queryResult = handleDateFilterParams(req)
        expect(queryResult).toEqual({date: {
                                        $gte : expect.any(Date),
                                        $lte : expect.any(Date),
                                        }
                                    })
      })

      test("from correct and upTo wrong", () =>{
        const req = {query : {from : "2023-05-30", 
                              upTo : "202Aò-06-03"}}
        expect(() => handleDateFilterParams(req)).toThrow(Error("Format upTo is not valid"))
    })
    test("from wrong and upTo correct", () =>{
      const req = {query : {from :"2000-1PO-01",
                            upTo :"2000-01-30"}}
      expect(() => handleDateFilterParams(req)).toThrow(Error("Format from is not valid"))
  })


  
    })
  })





describe("verifyAuth", () => {
  
 beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AccessToken is valid", () =>{
  test('should return {flag:false, cause:"Unauthorized"} if accessToken is missing', () => {
    const mockReq = { cookies:{ accessToken:'',
                                refreshToken:'refreshToken'
                              } 
                    };
    const mockRes = {   status: jest.fn().mockReturnThis(),
                        json:jest.fn(),
                        locals:{refreshedTokenMessage:''}
                    };
    const mockInfo = {authType:"Admin"};

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: 'Unauthorized' });
  });

   test('should return {flag:false, cause:"Unauthorized"} if refresToken is missing', () => {
    const mockReq = { cookies:{ accessToken:'accessToken',
                                refreshToken:''
                              } 
                    };
    const mockRes = {   status: jest.fn().mockReturnThis(),
                        json:jest.fn(),
                        locals:{refreshedTokenMessage:''}
                    };
    const mockInfo = {};

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: 'Unauthorized' });
  });
  test('should return {flag:false, cause:"wrong route"} if info.username doesn\'t exist', () => {
    const mockReq = { cookies:{ accessToken:'accessToken',
                                refreshToken:'refreshToken'
                              } 
                    };
    const mockRes = {   status: jest.fn().mockReturnThis(),
                        json:jest.fn(),
                        locals:{refreshedTokenMessage:''}
                    };
    const mockInfo = {authType:'User',
                      username:''};

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({flag:false, cause:"wrong route"});
  });
  test('should return {flag:false, cause:"list of emails are empty"} if info.emails don\'t exist', () => {
    const mockReq = { cookies:{ accessToken:'accessToken',
                                refreshToken:'refreshToken'
                              } 
                    };
    const mockRes = {   status: jest.fn().mockReturnThis(),
                        json:jest.fn(),
                        locals:{refreshedTokenMessage:''}
                    };
    const mockInfo = {authType:'Group'};

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({flag:false, cause:"list of emails are empty"});
  });
  
  test('should return { flag: false, cause: "Token is missing information" } if accessToken is missing information', () => {
    let decodedAccessToken={username:'',
                            email:'',
                            role:''}
    let decodedRefreshToken={username:'',
                            email:'',
                            role:''}
    
    const mockReq = {cookies: { accessToken: 'sampleAccessToken',
                                refreshToken: 'sampleRefreshToken',
                                      }
                    };
                      
    const mockRes = { status: jest.fn().mockReturnThis(),
                      json:jest.fn(),
                      locals:{refreshedTokenMessage:''}
                    };
   
    const mockInfo = { };
    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken); 

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: 'Token is missing information' });
  });
  
  test('should return { flag: false, cause: "Token is missing information" } if refreshToken is missing information', () => {
    let decodedAccessToken={username:'test',
                            email:'test@email.com',
                            role:'regular'}
    let decodedRefreshToken={username:'',
                            email:'',
                            role:''}

    const mockReq = {cookies: { accessToken: 'sampleAccessToken',
                                refreshToken: 'sampleRefreshToken',
                              }
                    };

    const mockRes = { status: jest.fn().mockReturnThis(),
                      json:jest.fn(),
                      locals:{refreshedTokenMessage:''}
                    };

    const mockInfo = { };                       
   
    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: 'Token is missing information' });
    
  });

  test('should return { flag: false, cause: "Mismatched users" } if username, email or role are different between refreshToken and accessToken', () => {
    const mockReq = {
      cookies: {
        accessToken: 'sampleAccessToken',
        refreshToken: 'sampleRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'User',
      username: 'john',
    };

    const decodedAccessToken = {
      username: 'user',
      email: 'user@example.com',
      role: 'User',
    };

    const decodedRefreshToken = {
      username: 'anotherUser',
      email: 'anotherUser@example.com',
      role: 'User',
    };

    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: 'Mismatched users' });
  });

    
  //switch case simple, user, admin
  test('should return { flag: true, cause: "Authorized" } if info.authType is equal to "Simple" ', () => {
    const mockReq = {
      cookies: {
        accessToken: 'simpleAccessToken',
        refreshToken: 'simpleRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'Simple',
      username: 'john',
    };

    const decodedAccessToken = {
      username: 'user',
      email: 'user@example.com',
      role: 'User',
    };

    const decodedRefreshToken = {
      username: 'user',
      email: 'user@example.com',
      role: 'User',
    };

    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: true, cause: 'Authorized' });
  });



  test('should return { flag: false, cause:"User\'s username is different from the request" } if info.authType is equal to "User" and username in the request is different from the username passed to function', () => {
    const mockReq = {
      cookies: {
        accessToken: 'userAccessToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'User',
      username: 'marco',
    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: "User's username is different from the request" });
  });

  test('should return { flag: true, cause:"User\'s username is equal from the request" } if info.authType is equal to "User" and username in the request is equal to the username passed to function', () => {
    const mockReq = {
      cookies: {
        accessToken: 'userAccessToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'User',
      username: 'luca',
    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: true, cause: "User's username is equal from the request" });
  });


  test('should return { flag: false, cause:"Unauthorized"} if info.authType is equal to "Admin" and role in the request is different from the role "Admin"', () => {
    
    const mockReq = {
      cookies: {
        accessToken: 'userAccessToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'Admin'
    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: "Unauthorized" });
  });

  test('should return { flag: true, cause:"Authorized"} if info.authType is equal to "Admin" and role in the request is equal to the role "Admin"', () => {
    const mockReq = {
      cookies: {
        accessToken: 'userAccessToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'Admin'
    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };

    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: true, cause: "Authorized" });
  });



  test('should return {flag:true, cause:"Found user in the group"} if info.authType is equal to "Group" and email in the request is equal to one of the emails in the list', () => {
    const mockReq = {
      cookies: {
        accessToken: 'userAccessToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'Group',
      emails:['luca@example.com','marco@example.com','alessia@example.com']
    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: true, cause: "Found user in the group" });
  });

  test('should return {flag:false, cause:"the user is not part of this group"} if info.authType is equal to "Group" and email in the request is not on the e-mail list', () => {
    const mockReq = {
      cookies: {
        accessToken: 'userAccessToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'Group',
      emails:['lucia@example.com','marco@example.com','alessia@example.com']
    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };

    jwt.verify.mockReturnValueOnce(decodedAccessToken);
    jwt.verify.mockReturnValueOnce(decodedRefreshToken);

    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: "the user is not part of this group" });
  });
});




 describe("AccessToken is expired", () =>{
 
  test("should return { flag: false, cause: 'Perform login again' } if refreshToken and accessToken are expired", () => {
    const req = {
      cookies: {
          accessToken: 'mockAccessToken',
          refreshToken: 'mockRefreshToken',
        }
    }; 
    const res = { locals: {}}; 
    const info = {
      authType : 'User',
      username:'user1'
    }; 

    jwt.verify.mockImplementation(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError('token expired');
  })
    const result = verifyAuth(req, res, info);

    expect(result.flag).toBe(false);
    expect(result.cause).toBe("Perform login again");

  });


  test("should return { flag: false, cause: 'err' } if refreshToken and accessToken are expired", () => {
    const req = {
      cookies: {
          accessToken: 'mockAccessToken',
          refreshToken: 'mockRefreshToken',
        }
    }; 
    const res = { locals: {}}; 
    const info = {
      authType : 'User',
      username:'user1'
    }; 
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError('token expired');
    })

    jwt.verify.mockImplementationOnce(() => {
      throw new Error('Error');
    })

    const result = verifyAuth(req, res, info);

    expect(result.flag).toBe(false);
    expect(result.cause).toBe("Error");

  });

  test("should return { flag: false, cause: 'err' } if refreshToken and accessToken are expired", () => {
    const req = {
      cookies: {
          accessToken: 'mockAccessToken',
          refreshToken: 'mockRefreshToken',
        }
    }; 
    const res = { locals: {}}; 
    const info = {
      authType : 'User',
      username:'user1'
    }; 

    jwt.verify.mockImplementationOnce(() => {
      throw new Error('Error');
  })

    const result = verifyAuth(req, res, info);

    expect(result.flag).toBe(false);
    expect(result.cause).toBe("Error");

  });

  test('should return { flag: false, cause: "Token is missing information" }if the accessToken is expired and in refreshToken are missing some information', () => {
   
    let decodedRefreshToken={username:'luca',
                            email:'',
                            role:''}

    const mockReq = {cookies: { accessToken: 'sampleAccessToken',
                                refreshToken: 'sampleRefreshToken',
                              }
                    };

    const mockRes = { status: jest.fn().mockReturnThis(),
                      json:jest.fn(),
                      locals:{refreshedTokenMessage:''}
                    };

    const mockInfo = {
                      authType : 'User',
                      username:'user1'
                    };                   
   
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError("TokenExpiredError");
    })
    jwt.verify.mockReturnValueOnce(decodedRefreshToken)
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, cause: 'Token is missing information' });
    
  });

  test("return { flag: false, message: 'User\'s username in decodedRefreshToken  is different from the request' } if the accessToken is expired and refreshToken has authType:'User' and the username in info is different from decodedRefreshToken ", () => {
    const mockReq = {
      cookies: {
        accessToken: 'ExpiredToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'User',
      username:'marco'

    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };

    
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError("TokenExpiredError");
    })
    jwt.verify.mockReturnValueOnce(decodedRefreshToken)
    
    
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, message: "User's username in decodedRefreshToken  is different from the request" });
  });

  test("return { flag: false, message: 'User's role in decodedRefreshToken  is different from 'Admin'' } if the accessToken is expired and refreshToken has authType:'Admin' and the role in  decodedRefreshToken is different from 'Admin' ", () => {
    const mockReq = {
      cookies: {
        accessToken: 'ExpiredToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'Admin'

    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError("TokenExpiredError");
    })
    jwt.verify.mockReturnValueOnce(decodedRefreshToken)
    
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, message: "User's role in decodedRefreshToken  is different from 'admin''" });
  });

  test("return { flag: false, message: 'the user is not part of this group' } if the accessToken is expired and refreshToken has authType:'Group' and the email in  decodedRefreshToken isn't in lists of email ", () => {
    const mockReq = {
      cookies: {
        accessToken: 'ExpiredToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json:jest.fn(),
      locals:{refreshedTokenMessage:''}
    };

    const mockInfo = {
      authType: 'Group',
      emails:['lucia@example.com','marco@example.com','alessia@example.com']
    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError("TokenExpiredError");
    })
    jwt.verify.mockReturnValueOnce(decodedRefreshToken)
    
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: false, message: "the user is not part of this group" });
  });

  test("return { flag: true, cause: 'Authorized' } if the accessToken is expired and refreshToken has authType:'Simple' ", () => {
    const mockReq = {
      cookies: {
        accessToken: 'ExpiredToken',
        refreshToken: 'userRefreshToken',
      },
    };

    

    const mockInfo = {
      authType: 'Simple'

    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };


    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };
    const newAccessToken = ({
      username: decodedRefreshToken.username,
      email: decodedRefreshToken.email,
      id: 1,
      role: decodedRefreshToken.role
  },process.env.ACCESS_KEY , { expiresIn: '1h' })

  const mockRes = {
    query: {},
    headers: {},
    data: null,
    json(payload) {
      this.data = JSON.stringify(payload)
    },
    cookie(name, value, options) {
        this.headers[name] = value
    },
    locals:{refreshedTokenMessage:'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'}

  }
    
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError("TokenExpiredError");
    })
    jwt.verify.mockReturnValueOnce(decodedRefreshToken)
    
   

    jwt.sign.mockReturnValueOnce(newAccessToken)
    
    jwt.verify.mockReturnValueOnce(decodedAccessToken)
    jest.spyOn(mockRes,'cookie').mockReturnValueOnce(mockRes)
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: true, cause: "Authorized" });
  });

  test("return { flag: true, cause: 'User\'s username is equal from the request' } if the accessToken is expired, refreshToken has authType:'User' and username in the request is equal to the username passed to function ", () => {
    const mockReq = {
      cookies: {
        accessToken: 'ExpiredToken',
        refreshToken: 'userRefreshToken',
      },
    };

    

    const mockInfo = {
      authType: 'User',
      username:'luca'

    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };


    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };
    const newAccessToken = ({
      username: decodedRefreshToken.username,
      email: decodedRefreshToken.email,
      id: 1,
      role: decodedRefreshToken.role
  },process.env.ACCESS_KEY , { expiresIn: '1h' })

  const mockRes = {
    query: {},
    headers: {},
    data: null,
    json(payload) {
      this.data = JSON.stringify(payload)
    },
    cookie(name, value, options) {
        this.headers[name] = value
    },
    locals:{refreshedTokenMessage:'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'}

  }
    
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError("TokenExpiredError");
    })
    jwt.verify.mockReturnValueOnce(decodedRefreshToken)
    
   

    jwt.sign.mockReturnValueOnce(newAccessToken)
    
    jwt.verify.mockReturnValueOnce(decodedAccessToken)
    jest.spyOn(mockRes,'cookie').mockReturnValueOnce(mockRes)
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({ flag: true, cause: "User's username is equal from the request" });
  });

  test("should return { flag: true, cause:'Authorized'} if the accessToken is expired, info.authType is equal to 'Admin' and role in the request is equal to the role 'Admin' ", () => {
    const mockReq = {
      cookies: {
        accessToken: 'ExpiredToken',
        refreshToken: 'userRefreshToken',
      },
    };

    

    const mockInfo = {
      authType: 'Admin'
      
    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };


    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'Admin',
    };
    const newAccessToken = ({
      username: decodedRefreshToken.username,
      email: decodedRefreshToken.email,
      id: 1,
      role: decodedRefreshToken.role
  },process.env.ACCESS_KEY , { expiresIn: '1h' })

  const mockRes = {
    query: {},
    headers: {},
    data: null,
    json(payload) {
      this.data = JSON.stringify(payload)
    },
    cookie(name, value, options) {
        this.headers[name] = value
    },
    locals:{refreshedTokenMessage:'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'}

  }
    
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError("TokenExpiredError");
    })
    jwt.verify.mockReturnValueOnce(decodedRefreshToken)
    
   

    jwt.sign.mockReturnValueOnce(newAccessToken)
    
    jwt.verify.mockReturnValueOnce(decodedAccessToken)
    jest.spyOn(mockRes,'cookie').mockReturnValueOnce(mockRes)
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({flag:true, cause:"Authorized"});
  });
  test("should return {flag:true, cause:'Found user in the group'} if the accessToken is expired, info.authType is equal to 'Group' and email in the request is equal to one of the emails in the list' ", () => {
    const mockReq = {
      cookies: {
        accessToken: 'ExpiredToken',
        refreshToken: 'userRefreshToken',
      },
    };

    const mockInfo = {
      authType: 'Group',
      emails:['luca@example.com','marco@example.com','alessia@example.com']

    };

    const decodedAccessToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };

    const decodedRefreshToken = {
      username: 'luca',
      email: 'luca@example.com',
      role: 'User',
    };
    const newAccessToken = ({
      username: decodedRefreshToken.username,
      email: decodedRefreshToken.email,
      id: 1,
      role: decodedRefreshToken.role
  },process.env.ACCESS_KEY , { expiresIn: '1h' })

  const mockRes = {
    query: {},
    headers: {},
    data: null,
    json(payload) {
      this.data = JSON.stringify(payload)
    },
    cookie(name, value, options) {
        this.headers[name] = value
    },
    locals:{refreshedTokenMessage:'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'}

  }
    
    jwt.verify.mockImplementationOnce(() => {
      const TokenExpiredError = jest.requireActual('jsonwebtoken').TokenExpiredError;
      throw new TokenExpiredError("TokenExpiredError");
    })
    jwt.verify.mockReturnValueOnce(decodedRefreshToken)
    
   

    jwt.sign.mockReturnValueOnce(newAccessToken)
    
    jwt.verify.mockReturnValueOnce(decodedAccessToken)
    jest.spyOn(mockRes,'cookie').mockReturnValueOnce(mockRes)
    const result = verifyAuth(mockReq, mockRes, mockInfo);

    expect(result).toEqual({flag:true, cause:"Found"});
  });

});

  });

  describe("handleAmountFilterParams", () => {
   
    describe("Test on min", () =>{ 
        test("min params", () => {
            const req = {query:{min: 60}};
            const queryResult = handleAmountFilterParams(req);
            expect(queryResult).toEqual({amount : { $gte: 60 }});
        })
        test("min is a space",() => {
          const req = {query:{min: " "}};
          expect(() => handleAmountFilterParams(req)).toThrow(Error("min parameter is not a number"));
        })
        test("min is not a number",() =>{
            const req = {query:{min: "nn"}};
            expect(() => handleAmountFilterParams(req)).toThrow(Error("min parameter is not a number"));
        })
    })

    describe("Test on max", ()=>{
        test("max params", () =>{
            const req = {query:{max: 100}};
            const result = handleAmountFilterParams(req);
            expect(result).toEqual({amount : {$lte : 100}});
        })
        test("max is a space",() =>{
          const req = {query:{max : " "}};
          expect(() => handleAmountFilterParams(req)).toThrow(Error("max parameter is not a number"));
        })
        test("max is not a number", () => {
            const req ={query: {max : "ooo"}};
            expect(() => handleAmountFilterParams(req)).toThrow(Error("max parameter is not a number"))
 
        })
    })

    describe("Test with min and max parameter",() =>{
        test("req is empty", () =>{
            const req = {query:{min:'',max:''}};
            const res = handleAmountFilterParams(req)
            expect(res).toEqual({})
        });

        test("mix and max are wrong parameters", () => {
          const req = {query:{min : "o", max : "i"}}
          expect(() => handleAmountFilterParams(req)).toThrow(Error)
      })

        test("there is max and min", () =>{
            const req ={query: {min : 60, max: 100}};
            const result = handleAmountFilterParams(req);
            expect(result).toEqual({amount: {
                                        $gte: 60,
                                        $lte : 100
                                        }
                                    });
        })

     
    })

})