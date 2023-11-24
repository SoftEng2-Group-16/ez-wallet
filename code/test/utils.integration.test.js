import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt, { TokenExpiredError } from 'jsonwebtoken';


describe("handleDateFilterParams", () => { 
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
                                          $gte : new Date(formattedDateOne),
                                          $lte : new Date(formattedDateTwo)
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
                                  $gte: new Date(formattedDate)
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
                                          $lte : new Date(formattedDate)
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
                                            $gte : new Date(formattedDateFrom),
                                            $lte : new Date(formattedDateUpTo)
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
    const adminAccessTokenValid = jwt.sign({
        email: "admin@email.com",
        username: "admin",
        role: "Admin"
    },  process.env.ACCESS_KEY, { expiresIn: '1y' })
    
    const testerTokenEmptyField = jwt.sign({
        email: "tester@test.com",
        username: "",
        role: "Regular"
    },  process.env.ACCESS_KEY, { expiresIn: '1y' })
    

    const testerAccessTokenValid = jwt.sign({
        email: "tester@test.com",
        username: "tester",
        role: "Regular"
    },  process.env.ACCESS_KEY, { expiresIn: '1y' })
    
    const testerAccessTokenExpired = jwt.sign({
        email: "tester@test.com",
        username: "tester",
        role: "Regular"
    }, process.env.ACCESS_KEY, { expiresIn: '0s' })

    const testerAccessInvalid = jwt.sign({
        username: "tester",
        role: ""
    }, process.env.ACCESS_KEY, { expiresIn: '1y' })
   
     
    const testerTokenEmpty = jwt.sign({}, process.env.ACCESS_KEY, { expiresIn: "1y" })

    describe("AccessToken is valid",()=>{
        test("Undefined tokens", () => {
            const req = { cookies: {accessToken:'' , refreshToken: testerAccessTokenValid} }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "Simple" })
            //The test is passed if the function returns an object with a false value, no matter its name
            expect(Object.values(response).includes(false)).toBe(true)
        })
        test("Undefined token", () => {
            const req = { cookies: {accessToken:testerAccessTokenValid  , refreshToken: testerTokenEmpty} }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "Simple" })
            //The test is passed if the function returns an object with a false value, no matter its name
            expect(Object.values(response).includes(false)).toBe(true)
        })
        test('wrong route', () => {
            const req = { cookies:{ accessToken:testerAccessTokenValid,
                                        refreshToken:testerAccessTokenValid
                                      } 
                            };
            const res = {   status: jest.fn().mockReturnThis(),
                                json:jest.fn(),
                                locals:{refreshedTokenMessage:''}
                            };
            const info = {authType:'User',
                              username:''};
        
            const result = verifyAuth(req, res, info);
        
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
        test("accessToken is missing information",()=>{
            const req = { cookies: {    accessToken: testerTokenEmptyField, 
                                        refreshToken: testerAccessTokenValid 
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })

            expect(Object.values(response).includes(false)).toBe(true)
        })
        test("refreshToken is missing information",()=>{
            const req = { cookies: {    accessToken: testerAccessTokenValid, 
                                        refreshToken: testerTokenEmptyField  
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })

            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("Mismatched users between refreshToken and accessToken",()=>{
            const req = { cookies: {    accessToken: testerAccessTokenValid, 
                                        refreshToken: testerAccessTokenValid
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "User", username: "testerDD" })

            expect(Object.values(response).includes(false)).toBe(true)
        })
        test("Tokens are both valid and belong to the requested Simple",()=>{
            const req = { cookies: {    accessToken: testerAccessTokenValid, 
                                        refreshToken:  testerAccessTokenValid
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "Simple" })

            expect(Object.values(response).includes(true)).toBe(true)
        })


        test("Tokens are both valid and belong to the different requested user", () => {
            const req = { cookies: {    accessToken: testerAccessTokenValid, 
                                        refreshToken: jwt.sign({
                                            email: "testerDif@test.com",
                                            username: "testerDif",
                                            role: "Regular"
                                        },  process.env.ACCESS_KEY, { expiresIn: '1y' }) 
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })
            
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("Tokens are both valid and belong to the requested user", () => {
            const req = { cookies: {    accessToken: testerAccessTokenValid, 
                                        refreshToken: testerAccessTokenValid 
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })
            
            expect(Object.values(response).includes(true)).toBe(true)
        })

        test("Tokens are both valid and the user's role is different", () => {
            const req = { cookies: {    accessToken: testerAccessTokenValid, 
                                        refreshToken: testerAccessTokenValid
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "Admin" })
            
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("Tokens are both valid and the user is 'Admin'", () => {
            const req = { cookies: {    accessToken: adminAccessTokenValid, 
                                        refreshToken: adminAccessTokenValid
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "Admin" })
            
            expect(Object.values(response).includes(true)).toBe(true)
        })

        test("Tokens are both valid and the user does not belong to the group", () => {
            const req = { cookies: {    accessToken:testerAccessTokenValid, 
                                        refreshToken: testerAccessTokenValid
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "Group",emails:['lucia@example.com','marco@example.com','alessia@example.com'] })
            
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("Tokens are both valid and the user belongs to the group", () => {
            const req = { cookies: {    accessToken: testerAccessTokenValid, 
                                        refreshToken: testerAccessTokenValid
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "Group",emails:["tester@test.com",'marco@example.com','alessia@example.com'] })
            
            expect(Object.values(response).includes(true)).toBe(true)
        })
    })
    describe("AccessToken is expired",()=>{
        test("Access token and refresh token are expired", () => {
            const req = { cookies: {    accessToken: testerAccessTokenExpired, 
                                        refreshToken: testerAccessTokenExpired } }

            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })

            expect(Object.values(response).includes(false)).toBe(true)
        })
       

        test("Access token expired and refresh token has missing information", () => {
            const req = { cookies: {    accessToken: testerAccessTokenExpired, 
                                        refreshToken: testerTokenEmptyField } }

            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })

            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("Access token expired and belong to the different requested user", () => {
            const req = { cookies: { accessToken: testerAccessTokenExpired,
                                     refreshToken: jwt.sign({
                                        email: "testerDif@test.com",
                                        username: "testerDif",
                                        role: "Regular"
                                    },  process.env.ACCESS_KEY, { expiresIn: '1y' })  } }

            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })

            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("Access token expired and belong to the different requested user", () => {
            const req = { cookies: { accessToken: testerAccessTokenExpired,
                                     refreshToken: testerAccessTokenValid } }

            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "Admin"})

            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("Access token expired and the user doesn't belong to the group", () => {
            const req = { cookies: {    accessToken: testerAccessTokenExpired, 
                                        refreshToken: testerAccessTokenValid
                                    }
                        }
            const res = {locals:{refreshedTokenMessage:''}}
            const response = verifyAuth(req, res, { authType: "Group",emails:["lucia@example.com",'marco@example.com','alessia@example.com'] })
            
            expect(Object.values(response).includes(false)).toBe(true)
        })
        test("Access token expired and belong to the requested Simple", () => {
            const req = { cookies: {    accessToken: testerAccessTokenExpired, 
                                        refreshToken: testerAccessTokenValid } }

            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "Simple" })

            expect(Object.values(response).includes(true)).toBe(true)

            expect(res.cookieArgs).toEqual({
                name: 'accessToken', //The cookie arguments must have the name set to "accessToken" (value updated)
                value: expect.any(String), //The actual value is unpredictable (jwt string), so it must exist
                options: { //The same options as during creation
                    httpOnly: true,
                    path: '/api',
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'none',
                    secure: true,
                },
            })
            //The response object must have a field that contains the message, with the name being either "message" or "refreshedTokenMessage"
            const message = res.locals.refreshedTokenMessage ? true : res.locals.message ? true : false
            expect(message).toBe(true)
        })
        test("Access token expired and refresh token  belonging to the requested user", () => {
            const req = { cookies: {    accessToken: testerAccessTokenExpired, 
                                        refreshToken: testerAccessTokenValid } }

            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })

            expect(Object.values(response).includes(true)).toBe(true)

            expect(res.cookieArgs).toEqual({
                name: 'accessToken', //The cookie arguments must have the name set to "accessToken" (value updated)
                value: expect.any(String), //The actual value is unpredictable (jwt string), so it must exist
                options: { //The same options as during creation
                    httpOnly: true,
                    path: '/api',
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'none',
                    secure: true,
                },
            })
            //The response object must have a field that contains the message, with the name being either "message" or "refreshedTokenMessage"
            const message = res.locals.refreshedTokenMessage ? true : res.locals.message ? true : false
            expect(message).toBe(true)
        })

        test("Access token expired and the user is 'Admin'", () => {
            const req = { cookies: {    accessToken: testerAccessTokenExpired, 
                                        refreshToken: adminAccessTokenValid } }

            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "Admin" })

            expect(Object.values(response).includes(true)).toBe(true)

            expect(res.cookieArgs).toEqual({
                name: 'accessToken', //The cookie arguments must have the name set to "accessToken" (value updated)
                value: expect.any(String), //The actual value is unpredictable (jwt string), so it must exist
                options: { //The same options as during creation
                    httpOnly: true,
                    path: '/api',
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'none',
                    secure: true,
                },
            })
            //The response object must have a field that contains the message, with the name being either "message" or "refreshedTokenMessage"
            const message = res.locals.refreshedTokenMessage ? true : res.locals.message ? true : false
            expect(message).toBe(true)
        })
        test("Access token expired and the user belongs to the group", () => {
            const req = { cookies: {    accessToken: testerAccessTokenExpired, 
                                        refreshToken: testerAccessTokenValid } }

            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "Group", emails:["tester@test.com",'marco@example.com','alessia@example.com'] })

            expect(Object.values(response).includes(true)).toBe(true)

            expect(res.cookieArgs).toEqual({
                name: 'accessToken', //The cookie arguments must have the name set to "accessToken" (value updated)
                value: expect.any(String), //The actual value is unpredictable (jwt string), so it must exist
                options: { //The same options as during creation
                    httpOnly: true,
                    path: '/api',
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'none',
                    secure: true,
                },
            })
            //The response object must have a field that contains the message, with the name being either "message" or "refreshedTokenMessage"
            const message = res.locals.refreshedTokenMessage ? true : res.locals.message ? true : false
            expect(message).toBe(true)
        })
    })
   
})

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
