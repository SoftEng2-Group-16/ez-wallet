import request from 'supertest';
import { app } from '../app';
import { deleteGroup, deleteUser, addToGroup, removeFromGroup, createGroup, getUser, getUsers, getGroup, getGroups } from '../controllers/users';
import { User, Group } from '../models/User.js';
import { transactions } from '../models/model';
import { verifyAuth } from '../controllers/utils.js';

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */

jest.mock("../models/User.js")
jest.mock("../models/model.js")
jest.mock("../controllers/utils.js", ()=> ({
  verifyAuth: jest.fn()
}))

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  User.find.mockClear()
  verifyAuth.mockClear()
  Group.find.mockClear()
  Group.findOne.mockClear()
  User.findOne.mockClear()
  //additional `mockClear()` must be placed here
});

describe("getUsers", () => {

  test("should return 401 if the user is not an admin", async () => {

    const mockReq = {

    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }
    
    verifyAuth.mockReturnValueOnce({flag: false, cause: "Unauthorized"})
    await getUsers(mockReq, mockRes)
  

    expect(verifyAuth).toHaveBeenCalledTimes(1)
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" })
  
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("should return empty list if there are no users", async () => {
    const mockReq = {
      
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

    jest.spyOn(User, "find").mockResolvedValue([])
    
    await getUsers(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({ data: [], refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
  })

  test("should retrieve list of all users", async () => {
    
    const mockReq = {
      
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }
    
    const retrievedUsers = [{ username: 'test1', email: 'test1@example.com', role: 'role1' }, { username: 'test2', email: 'test2@example.com', role: 'role2' }]
    
    verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
    jest.spyOn(User, "find").mockResolvedValue(retrievedUsers)
    await getUsers(mockReq, mockRes)

    expect(verifyAuth).toHaveBeenCalled()
    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data: retrievedUsers,  refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
  })

  test("error 500 generic error", async()=>{
    const mockReq = {
      
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }
    
    const error = new Error("Generic Error");
    
    verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
    jest.spyOn(User, "find").mockRejectedValueOnce(error)
    await getUsers(mockReq, mockRes)

    expect(verifyAuth).toHaveBeenCalled()
    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith("Generic Error");
  })


})

describe("getUser", () => {
  
  test("should return 401 if user is not an admin and not searching for their own info", async () => {

    const mockReq = {
      params: {
        username: "otheruser"
      }
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }
    
    verifyAuth.mockReturnValueOnce({flag: false, cause: "Unauthorized"})
    verifyAuth.mockReturnValueOnce({flag: false, cause:"Not authorized to look at this informations"})
    await getUser(mockReq, mockRes)

    expect(verifyAuth).toHaveBeenCalledTimes(2)
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" })
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "User", username: mockReq.params.username })
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Not authorized to look at this informations" });
  });

  test("should return 400 if user does not exist", async () => {
    
    const mockReq = {
      params: {
        username: "nonexistentuser"
      }
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }
    
    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(User, "findOne").mockResolvedValue(null)
    await getUser(mockReq, mockRes)
  
    expect(verifyAuth).toHaveBeenCalledTimes(1)
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" })
    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("should retrieve user information if user is an admin", async () => {
    const mockReq = {
      params: {
        username: "existentuser"
      }
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    const user = { username: 'existentuser', email: 'existentuser@example.com', role: 'role1'}
    
    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(User, "findOne").mockResolvedValue(user)
    await getUser(mockReq, mockRes)
  
    expect(verifyAuth).toHaveBeenCalledTimes(1)
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" })
    expect(User.findOne).toHaveBeenCalled()
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: user,
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
    });
  });

  test("should retrieve user information if user is searching for their own info", async () => {
    const mockReq = {
      params: {
        username: "existentuser"
      }
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    const user = { username: 'existentuser', email: 'existentuser@example.com', role: 'role1'}
    
    verifyAuth.mockReturnValueOnce({flag: false, cause: "Unauthorized"})
    verifyAuth.mockReturnValueOnce({flag: true, cause: "User's username is equal from the request"})
    jest.spyOn(User, "findOne").mockResolvedValue(user)
    await getUser(mockReq, mockRes)
  
    expect(verifyAuth).toHaveBeenCalledTimes(2)
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" })
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "User", username: mockReq.params.username })
    expect(User.findOne).toHaveBeenCalled()
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: user,
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
    });
  });

  test("error 500, request vuota", async()=>{
    const mockReq={}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: ""}
    }
    await getUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

});


describe("createGroup", () => { 

  beforeEach(()=>{
    Group.aggregate.mockClear()
    Group.create.mockClear()
  })
  
  test("should return status 401 if the user does not pass the simple authentication", async () => {
    const mockReq = {
      body: {
        name: "newGroup",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
    await createGroup(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" });
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("should return status 400 if the attribute memberEmails is missing in the body ", async () => {
    const mockReq = {
      body: {
        name: "newGroup",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Name or MemberEmails are missing!" });
    
  });

  test("should return status 400 if the attribute name is missing in the body ", async () => {
    const mockReq = {
      body: {
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Name or MemberEmails are missing!" });
    
  });

  test("should return status 400 if the name group is an empty string", async () => {
    const mockReq = {
      body: {
        name: "",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Group name is empty!" });
    
  });

  test("should return status 400 if the name group is empty", async () => {
    const mockReq = {
      body: {
        name: "",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Group name is empty!" });
    
  });

  test("should return status 400 if the there are not mail in member emails", async () => {
    const mockReq = {
      body: {
        name: "newGroup",
        memberEmails: [],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "List of email is empty" });
  
  });

  test("should return status 400 if there is already a group with the provided name", async () => {
    const mockReq = {
      body: {
        name: "existingGroup",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    const group = {
      name: "existingGroup",
      memberEmails: [
        "email1@test.it",
        "email4@test.it",
        "email5@test.it",
        "email6@test.it",
      ],
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockResolvedValue(group)
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Group exist!" });
  
  });

  test("should return status 400 if there are one or more mail in invalid format", async () => {
    const mockReq = {
      body: {
        name: "newGroup",
        memberEmails: [
          "email1test.it",
          "email4@testit",
          "email5.test.it",
          "email6testit",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockResolvedValue(undefined)
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "One or more emails are invalid!" });
  
  });

  test("should return status 400 if there are one or more empty mail", async () => {
    const mockReq = {
      body: {
        name: "newGroup",
        memberEmails: [
          "email1test.it",
          "email4@testit",
          "",
          "email6testit",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockResolvedValue(undefined)
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "One or more emails are invalid!" });
  
  });

  test("should return status 400 if the user who wants to create the group is already in one", async () => {
    const mockReq = {
      cookies: { refreshToken: "" },
      body: {
        name: "newGroup",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    const user = {email: "email1@test.it"}
    const group = {
      name: "existingGroup",
      memberEmails: [
        "email1@test.it",
        "email7@test.it",
        "email8@test.it",
        "email9@test.it",
      ],
    };

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(undefined).mockResolvedValueOnce(group)
    jest.spyOn(User, "findOne").mockResolvedValueOnce(user)
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "The creator is already in a group!" });
  
  });

  test("should return status 400 if all the email in membersEmail does not exist", async () => {
    const mockReq = {
      cookies: { refreshToken: "" },
      body: {
        name: "newGroup",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    const user = {email: "email1@test.it"}

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(undefined)
    jest.spyOn(User, "findOne").mockResolvedValueOnce(user)
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(undefined)
    jest.spyOn(User, "find").mockResolvedValueOnce([])
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(User.find).toHaveBeenCalled()
    
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "All members not exist!" });
  
  });

  test("should return status 400 if all the email in members email are already in a group", async () => {
    const mockReq = {
      cookies: { refreshToken: "" },
      body: {
        name: "newGroup",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    const user = {email: "email1@test.it"}

    const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email: "email5@test.it"}, {_id:3, email: "email6@test.it"}]
    const alreadyInGroupEmails = [{emails: [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]}]

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(undefined)
    jest.spyOn(User, "findOne").mockResolvedValueOnce(user)
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(undefined)
    jest.spyOn(User, "find").mockResolvedValueOnce(existingMembers)
    jest.spyOn(Group, "aggregate").mockResolvedValueOnce(alreadyInGroupEmails)
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(User.find).toHaveBeenCalled()  
    expect(Group.aggregate).toHaveBeenCalled()  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "All members are already in group!" });
  
  });

  test("should return status 400 if all the email in members email are already in a group or not exist", async () => {
    const mockReq = {
      cookies: { refreshToken: "" },
      body: {
        name: "newGroup",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    const user = {email: "email1@test.it"}

    const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email4@test.it"}]
    const alreadyInGroupEmails = [{emails: [ "email1@test.it", "email4@test.it"]}]

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(undefined)
    jest.spyOn(User, "findOne").mockResolvedValueOnce(user)
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(undefined)
    jest.spyOn(User, "find").mockResolvedValueOnce(existingMembers)
    jest.spyOn(Group, "aggregate").mockResolvedValueOnce(alreadyInGroupEmails)
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(User.find).toHaveBeenCalled()  
    expect(Group.aggregate).toHaveBeenCalled()  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "All members not exist or are already in a group!"});
  
  });

  test("should return status 200 even if the creator does not insert himself in the members email", async () => {
    const mockReq = {
      cookies: {refreshToken: ""},
      body: {
        name: "newGroup",
        memberEmails: [ "email4@test.it", "email5@test.it", "email6@test.it"]
      }
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    const creator = {_id: 0, email:"email1@test.it"}
    const existingMembers = [{_id:1, email:"email4@test.it"}, {_id:2, email: "email5@test.it"}, {_id:3, email: "email6@test.it"}]
    const alreadyInGroupEmails = [{emails: [ "email6@test.it"]}]

    const members = ["email1@test.it","email4@test.it", "email5@test.it"]


    const new_group = {
      name: mockReq.body.name,
      members: members,
    }

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockReturnValueOnce(false)
    jest.spyOn(User, "findOne").mockReturnValueOnce(creator)
    jest.spyOn(Group, "findOne").mockReturnValueOnce(false)
    jest.spyOn(User, "find").mockReturnValueOnce(existingMembers)
    jest.spyOn(Group, "aggregate").mockResolvedValueOnce(alreadyInGroupEmails)
    jest.spyOn(Group, "create").mockResolvedValueOnce(new_group)
    
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(Group.aggregate).toHaveBeenCalled()
    expect(Group.create).toHaveBeenCalled()
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data: {
        group: {
          name: new_group.name,
          members: new_group.members.map((x) => {
            return { email: x.email };
          }),
        },
        alreadyInGroup: alreadyInGroupEmails[0].emails,
        membersNotFound: [],        
      },
       
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
    });
  
  });

  test("should return status 200 with creation of the group", async () => {
    const mockReq = {
      cookies: {refreshToken: ""},
      body: {
        name: "newGroup",
        memberEmails: [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      }
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    const creator = {_id: 0, email:"email1@test.it"}
    const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email: "email5@test.it"}, {_id:3, email: "email6@test.it"}]
    const alreadyInGroupEmails = [{emails: ["email6@test.it"]}]

    const members = ["email1@test.it", "email4@test.it", "email5@test.it"]


    const new_group = {
      name: mockReq.body.name,
      members: members,
    }

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockReturnValueOnce(false)
    jest.spyOn(User, "findOne").mockReturnValueOnce(creator)
    jest.spyOn(Group, "findOne").mockReturnValueOnce(false)
    jest.spyOn(User, "find").mockReturnValueOnce(existingMembers)
    jest.spyOn(Group, "aggregate").mockResolvedValueOnce(alreadyInGroupEmails)
    jest.spyOn(Group, "create").mockResolvedValueOnce(new_group)
    
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(Group.aggregate).toHaveBeenCalled()
    expect(Group.create).toHaveBeenCalled()
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data: {
        group: {
          name: new_group.name,
          members: new_group.members.map((x) => {
            return { email: x.email };
          }),
        },
        alreadyInGroup: alreadyInGroupEmails[0].emails,
        membersNotFound: [],        
      },
       
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
    });
  
  });

  test("Should create a group with alreadyInGroup as an empty array", async () => {
    const mockReq = {
      cookies: { refreshToken: "" },
      body: {
        name: "newGroup",
        memberEmails: [
          "email1@test.it",
          "email4@test.it",
          "email5@test.it",
          "email6@test.it",
        ],
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    

    const error = new Error("Generic error")

    const creator = {_id: 0, email:"email1@test.it"}
    const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email: "email5@test.it"}, {_id:3, email: "email6@test.it"}]
    const alreadyInGroupEmails = [{emails:[]}]
    const members = ["email4@test.it", "email5@test.it","email6@test.it"]

    const new_group = {
      name: mockReq.body.name,
      members: members,
    }

    verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(false)
    jest.spyOn(User, "findOne").mockResolvedValueOnce(creator)
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(false)
    jest.spyOn(User, "find").mockResolvedValueOnce(existingMembers)
    jest.spyOn(Group, "aggregate").mockRejectedValueOnce(error)
    jest.spyOn(Group, "create").mockResolvedValueOnce(new_group)
    await createGroup(mockReq, mockRes)
    
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Simple" })
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(User.find).toHaveBeenCalled()  
    expect(Group.aggregate).toHaveBeenCalled()  
    expect(Group.create).toHaveBeenCalled()
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data: {
        group: {
          name: new_group.name,
          members: new_group.members.map((x) => {
            return { email: x.email };
          }),
        },
        alreadyInGroup: alreadyInGroupEmails[0].emails,
        membersNotFound: [],        
      },
       
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
    });
  
  });

  test("error 500, request vuota", async()=>{
    const mockReq={}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: ""}
    }
    await createGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })  

})

describe("getGroups", () => { 

  test("should return error 401 if the user is not an admin", async () => {
    const mockReq = {
      cookies: { refreshToken: "" },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    
    
    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
    

    await getGroups(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
   

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized" });

  });

  test("should return success with the status 200 even though there are no groups", async () => {
    const mockReq = {
      cookies: { refreshToken: "" },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    
    const groups = [];

    verifyAuth.mockReturnValueOnce({ flag: true, cause: "Authorized" });
    jest.spyOn(Group, "find").mockResolvedValueOnce(groups);

    await getGroups(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
    
    expect(Group.find).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: groups,
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
    });
  });

  test("should return success with the status 200 showing all the groups", async () => {
    const mockReq = {
      cookies: { refreshToken: "" },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    
    const groups = [
      { _id: "group1", name: "Group 1", members: ["email1@test.it","email4@test.it", "email5@test.it"] },
      { _id: "group2", name: "Group 2", members: ["email@test.it"] },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true, cause: "Authorized" });
    jest.spyOn(Group, "find").mockResolvedValueOnce(groups);

    await getGroups(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
    
    expect(Group.find).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: groups,
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
    });
  });

  test("error 500 generic error", async()=>{
    const mockReq = {
      
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }
    
    const error = new Error("Generic Error");
    
    verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
    jest.spyOn(Group, "find").mockRejectedValueOnce(error)
    await getGroups(mockReq, mockRes)

    expect(verifyAuth).toHaveBeenCalled()
    expect(Group.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith("Generic Error");
  })

})

describe("getGroup", () => { 

  test("should return error with status 400 if the group does not exist", async () => {
    const mockReq = {
      params: { name: "group"},
      cookies: { refreshToken: "" },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    
    const group = [ ];
    
    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
    jest.spyOn(Group, "aggregate").mockResolvedValueOnce(group);


    await getGroup(mockReq, mockRes);

    
   
    expect(Group.aggregate).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Group does not exist!"} );

  });
  
  
  test("should return error 401 if the user is not an admin and not a member of the group", async () => {
    const mockReq = {
      params: { name: "group"},
      cookies: { refreshToken: "" },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    
    const group = [ {name: "Group 1", members: ["email1@test.it","email4@test.it", "email5@test.it"] }];
    
    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
    verifyAuth.mockReturnValueOnce({ flag: false, cause: "the user is not part of this group" });
    jest.spyOn(Group, "aggregate").mockResolvedValueOnce(group);

    await getGroup(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalledTimes(2);
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Group", emails: group[0].members });
    expect(Group.aggregate).toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: "the user is not part of this group"});

  });

  test("should return status 200 showing the group if the user is an admin", async () => {
    const mockReq = {
      params: { name: "group"},
      cookies: { refreshToken: "" },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    
    const group = [ {name: "Group 1", members: ["email1@test.it","email4@test.it", "email5@test.it"] }];
    
    verifyAuth.mockReturnValueOnce({ flag: true, cause: "Authorized" });
    
    jest.spyOn(Group, "aggregate").mockResolvedValueOnce(group);

    await getGroup(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
    
    expect(Group.aggregate).toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data:{
      group: {
        name: group[0].name,
        members: group[0].members.map((x) => {
          return { email: x };
        }),
      } 
    },
    refreshedTokenMessage: mockRes.locals.refreshedTokenMessage });

  });

  test("should return status 200 showing the group if the user is not an admin but a member of the group", async () => {
    const mockReq = {
      params: { name: "group"},
      cookies: { refreshToken: "" },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    
    const group = [ {name: "Group 1", members: ["email1@test.it","email4@test.it", "email5@test.it"] }];
    
    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
    verifyAuth.mockReturnValueOnce({ flag: true, cause: "Found" });
    
    jest.spyOn(Group, "aggregate").mockResolvedValueOnce(group);

    await getGroup(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalledTimes(2);
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
    expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Group", emails: group[0].members });
    
    expect(Group.aggregate).toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data:{
      group: {
        name: group[0].name,
        members: group[0].members.map((x) => {
          return { email: x };
        }),
      } 
    },
    refreshedTokenMessage: mockRes.locals.refreshedTokenMessage });

  });

  test("error 500, request vuota", async()=>{
    const mockReq={}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: ""}
    }
    await getGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

})

describe("addToGroup", () => {

  beforeEach( ()=>{
    Group.aggregate.mockClear()
    })

  test("should return 400 if the attribute email is not defined",
    async()=>{
      const req={
        body: {},
        params: {name: "GroupTest"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "Attribute emails is missing!" })
    }
  )

  test("should return 400 if the group not exist",
  async()=>{
    jest.spyOn(Group, "aggregate").mockResolvedValue([])

    const req={
      body: {emails: []},
      params: {name: "GroupTest"}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "token"}
    }
    await addToGroup(req, res);
    expect(Group.aggregate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "Group not exist"  })
  }
  )  

  test("should return 401 if the user is not an admin with the route for admin",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"})

      const req={
        body: {emails: []},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" })
    }
  )

  test("should return 401 if the user is not in the group with the route for users",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: false, cause: "the user is not part of this group"})

      const req={
        body: {emails: []},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/add"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Group", emails : groupEmail[0].members})
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "the user is not part of this group" })
    }
  )

  test("should return 400 if the list of emails is empty",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: []},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "Members list is empty!" })
    }
  )

  test("should return 400 if the list of emails has at least one invalid email",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "email5test.it", "email6@test.it"]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "One or more emails are invalid!" })
    }
  )

  test("should return 400 if the list of emails has at least one email as an empty string",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "", "email6@test.it"]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "One or more emails are invalid!" })
    }
  )

  test("should return 400 if all the emails are not in the database",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      jest.spyOn(User, "find").mockResolvedValue([])
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "All members not exist!" })
    }
  )

  test("should return 400 if all members are already in a group",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const alreadyInGroupEmails = [{emails: [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]}]
      const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email: "email5@test.it"}, {_id:3, email: "email6@test.it"}]

      jest.spyOn(Group, "aggregate")
        .mockResolvedValueOnce(groupEmail)
        .mockResolvedValueOnce(alreadyInGroupEmails)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(Group.aggregate).toHaveBeenCalledTimes(2)
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "All members are already in group!" })
    }
  )

  test("should return 400 if all members are already in a group or not exist",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const alreadyInGroupEmails = [{emails: [ "email1@test.it", "email4@test.it"]}]
      const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email4@test.it"}]

      jest.spyOn(Group, "aggregate")
        .mockResolvedValueOnce(groupEmail)
        .mockResolvedValueOnce(alreadyInGroupEmails)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(Group.aggregate).toHaveBeenCalledTimes(2)
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "All members not exist or are already in a group!" })
    }
  )

  test("should return 200 if there are some valid members in the list(is an admin)",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const alreadyInGroupEmails = [{emails: [ "email1@test.it", "email4@test.it"]}]
      const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email: "email5@test.it"}]
      const newGroup={name:"GroupTest", 
      members:[
        {email: "email1@test.it"}, 
        {email: "email2@test.it"},
        {email: "email3@test.it"},
        {email: "email5@test.it"},     
      ]}
      const notFoundEmails =  ["email6@test.it"]


      jest.spyOn(Group, "aggregate")
        .mockResolvedValueOnce(groupEmail)
        .mockResolvedValueOnce(alreadyInGroupEmails)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(Group, "updateOne").mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null
      })
      jest.spyOn(Group, "findOne").mockResolvedValue(newGroup)


      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(Group.aggregate).toHaveBeenCalledTimes(2)
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(Group.updateOne).toHaveBeenCalled()
      expect(Group.findOne).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: newGroup,
          alreadyInGroup: alreadyInGroupEmails[0].emails,
          membersNotFound: notFoundEmails,
        },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      })
    }
  )

  test("should return 200, there are only valid members in the list(is an admin)",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email7@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const alreadyInGroupEmails = []
      const existingMembers = [
        {_id: 0, email: "email4@test.it"}, 
        {_id: 1, email: "email7@test.it"}, 
        {_id: 2, email: "email6@test.it"},
        {_id: 3, email: "email5@test.it"},
      ]
      const newGroup={name:"GroupTest", 
      members:[
        {email: "email1@test.it"}, 
        {email: "email2@test.it"},
        {email: "email3@test.it"},
        {email: "email4@test.it"},
        {email: "email7@test.it"},
        {email: "email6@test.it"},
        {email: "email5@test.it"},     
      ]}
      const notFoundEmails =  []

      jest.spyOn(Group, "aggregate").mockResolvedValueOnce(groupEmail).mockResolvedValueOnce(alreadyInGroupEmails)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(Group, "updateOne").mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null
      })
      jest.spyOn(Group, "findOne").mockResolvedValue(newGroup)


      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/insert"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(Group.aggregate).toHaveBeenCalledTimes(2)
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(Group.updateOne).toHaveBeenCalled()
      expect(Group.findOne).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: newGroup,
          alreadyInGroup: alreadyInGroupEmails,
          membersNotFound: notFoundEmails,
        },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      })
    }
  )

  test("should return 200 if there are some valid members in the list (is a user)",
    async()=>{
      const groupEmail = [{members: ["email0@test.it", "email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const alreadyInGroupEmails = [{emails: [ "email1@test.it", "email4@test.it"]}]
      const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email: "email5@test.it"}]
      const newGroup={name:"GroupTest", 
      members:[
        {email: "email0@test.it"},
        {email: "email1@test.it"}, 
        {email: "email2@test.it"},
        {email: "email3@test.it"},
        {email: "email5@test.it"},     
      ]}
      const notFoundEmails =  ["email6@test.it"]

      jest.spyOn(Group, "aggregate")
        .mockResolvedValueOnce(groupEmail)
        .mockResolvedValueOnce(alreadyInGroupEmails)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Found"})
      jest.spyOn(Group, "updateOne").mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null
      })
      jest.spyOn(Group, "findOne").mockResolvedValue(newGroup)


      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/add"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await addToGroup(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(Group.aggregate).toHaveBeenCalledTimes(2)
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Group", emails : groupEmail[0].members})
      expect(Group.updateOne).toHaveBeenCalled()
      expect(Group.findOne).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: newGroup,
          alreadyInGroup: alreadyInGroupEmails[0].emails,
          membersNotFound: notFoundEmails,
        },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      })
    }
  )
  
  test("Should return 500 if there is an internal server error", async()=>{
    const req={}
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "token"}
    }
    await addToGroup(req, res);
    expect(res.status).toHaveBeenCalledWith(500)
  })

 })

describe("removeFromGroup", () => { 
  beforeEach( ()=>{
    Group.aggregate.mockClear()
    Group.updateOne.mockClear()
    })
  
  test("should return 400 if the attribute email is not defined",
    async()=>{
      const req={
        body: {},
        params: {name: "GroupTest"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "Attribute emails is missing!" })
    }
  )

  test("should return 400 if the group not exist",
    async()=>{
      jest.spyOn(Group, "aggregate").mockResolvedValue([])

      const req={
        body: {emails: []},
        params: {name: "GroupTest"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "Group not exist"  })
    }
  )  

  test("should return 401 if the user is not an admin with the route for admin",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"})

      const req={
        body: {emails: []},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" })
    }
  )

  test("should return 401 if the user is not in the group with the route for users",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: false, cause: "the user is not part of this group"})

      const req={
        body: {emails: []},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/remove"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res)
      expect(verifyAuth).toHaveBeenCalled();
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Group", emails : groupEmail[0].members})
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "the user is not part of this group" })
    }
  )

  test("should return 400 if the group has only one member",
    async()=>{
      const groupEmail = [{members: ["email1@test.it"]}]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: []},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "Only one member in the group!" })
    }
  )

  test("should return 400 if the list of emails is empty",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: []},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "Members list is empty!" })
    }
  )

  test("should return 400 if the list of emails has at least one invalid email",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "email5test.it", "email6@test.it"]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "One or more emails are invalid!" })
    }
  )

  test("should return 400 if the list of emails has at least one email as an empty string",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "", "email6@test.it"]
      jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "One or more emails are invalid!" })
    }
  )

  test("should return 400 if the emails are not in the database",
  async()=>{
    const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
    const emails = [ "email7@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
    jest.spyOn(Group, "aggregate").mockResolvedValue(groupEmail)
    jest.spyOn(User, "find").mockResolvedValue([])
    verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

    const req={
      body: {emails: emails},
      params: {name: "GroupTest"},
      route: {path: "/groups/:name/pull"}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "token"}
    }
    await removeFromGroup(req, res);
    expect(Group.aggregate).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "All members not exist!" })
  }
)

  test("should return 400 if all members are not in the group",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email7@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const existingMembers = [{_id: 0, email:"email7@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email: "email5@test.it"}, {_id:3, email: "email6@test.it"}]

      jest.spyOn(Group, "aggregate").mockResolvedValueOnce(groupEmail)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "All members are not in the group!" })
    }
  )

  test("should return 400 if all members are not in the group or not exist",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it"]}]
      const emails = [ "email1@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const existingMembers = [{_id: 0, email:"email5@test.it"}, {_id:1, email:"email4@test.it"}]

      jest.spyOn(Group, "aggregate").mockResolvedValueOnce(groupEmail)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: "All members cannot be removed!" })
    }
  )

  test("should return 200 if there are some valid members in the list(is an admin)",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it", "email4@test.it"]}]
      const emails = [ "email3@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const existingMembers = [{_id: 0, email:"email3@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email:"email5@test.it"}]
      const notInGroupEmails = ["email5@test.it"]
      const notFoundEmails = ["email6@test.it"]
      const newGroup={name:"GroupTest", 
      members:[
        {email: "email1@test.it"}, 
        {email: "email2@test.it"}    
      ]}

      jest.spyOn(Group, "aggregate").mockResolvedValueOnce(groupEmail)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(Group, "updateOne").mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null
      })
      jest.spyOn(Group, "findOne").mockResolvedValue(newGroup)

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(Group.findOne).toHaveBeenCalled()
      expect(Group.updateOne).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: newGroup,
          notInGroup: notInGroupEmails,
          membersNotFound: notFoundEmails,
        },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      })
    }
  )

  test("should return 200 if there are some valid members in the list- try to remove all(is an admin)",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it", "email4@test.it"]}]
      const emails = [ "email1@test.it", "email2@test.it", "email3@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const existingMembers = [{_id: 0, email:"email1@test.it"}, {_id:1, email:"email2@test.it"}, {_id:2, email:"email3@test.it"}, {_id:3, email:"email4@test.it"}, {_id:4, email:"email5@test.it"}]
      const notInGroupEmails = ["email5@test.it"]
      const notFoundEmails = ["email6@test.it"]
      const newGroup={name:"GroupTest", 
      members:[
        {email: "email1@test.it"} 
      ]}

      jest.spyOn(Group, "aggregate").mockResolvedValueOnce(groupEmail)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(Group, "updateOne").mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null
      })
      jest.spyOn(Group, "findOne").mockResolvedValue(newGroup)

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/pull"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(Group.findOne).toHaveBeenCalled()
      expect(Group.updateOne).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: newGroup,
          notInGroup: notInGroupEmails,
          membersNotFound: notFoundEmails,
        },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      })
    }
  )

  test("should return 200 if there are some valid members in the list (is a user)",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it", "email4@test.it"]}]
      const emails = [ "email3@test.it", "email4@test.it", "email5@test.it", "email6@test.it"]
      const existingMembers = [{_id: 0, email:"email3@test.it"}, {_id:1, email:"email4@test.it"}, {_id:2, email:"email5@test.it"}]
      const notInGroupEmails = ["email5@test.it"]
      const notFoundEmails = ["email6@test.it"]
      const newGroup={name:"GroupTest", 
      members:[
        {email: "email1@test.it"}, 
        {email: "email2@test.it"}    
      ]}

      jest.spyOn(Group, "aggregate").mockResolvedValueOnce(groupEmail)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Found"})
      jest.spyOn(Group, "updateOne").mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null
      })
      jest.spyOn(Group, "findOne").mockResolvedValue(newGroup)

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/remove"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(Group.findOne).toHaveBeenCalled()
      expect(Group.updateOne).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Group", emails : groupEmail[0].members})
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: newGroup,
          notInGroup: notInGroupEmails,
          membersNotFound: notFoundEmails,
        },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      })
    }
  )

  test("should return 200 if there are only valid members in the list (is a user)",
    async()=>{
      const groupEmail = [{members: ["email1@test.it", "email2@test.it", "email3@test.it", "email4@test.it"]}]
      const emails = [ "email3@test.it", "email4@test.it"]
      const existingMembers = [{_id: 0, email:"email3@test.it"}, {_id:1, email:"email4@test.it"}]
      const notInGroupEmails = []
      const notFoundEmails = []
      const newGroup={name:"GroupTest", 
      members:[
        {email: "email1@test.it"}, 
        {email: "email2@test.it"}    
      ]}

      jest.spyOn(Group, "aggregate").mockResolvedValueOnce(groupEmail)
      jest.spyOn(User, "find").mockResolvedValue(existingMembers)
      verifyAuth.mockReturnValue({flag: true, cause: "Found"})
      jest.spyOn(Group, "updateOne").mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null
      })
      jest.spyOn(Group, "findOne").mockResolvedValue(newGroup)

      const req={
        body: {emails: emails},
        params: {name: "GroupTest"},
        route: {path: "/groups/:name/remove"}
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await removeFromGroup(req, res);
      expect(Group.aggregate).toHaveBeenCalled()
      expect(Group.findOne).toHaveBeenCalled()
      expect(Group.updateOne).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalled()
      expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Group", emails : groupEmail[0].members})
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: newGroup,
          notInGroup: notInGroupEmails,
          membersNotFound: notFoundEmails,
        },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      })
    }
  )
  


  test("Should return 500 if there is an internal server error", async()=>{
    const req={}
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "token"}
    }
    await removeFromGroup(req, res);
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe("deleteUser", () => {
  beforeEach( ()=>{
  Group.findOneAndUpdate.mockClear()
  transactions.deleteMany.mockClear()
  Group.findOneAndDelete.mockClear()
  User.deleteOne.mockClear()
  })
  
  test("should return 401 if the user is not an admin",
    async()=>{
      verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"})
      const req={body: {email: "ciao@test.it"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
  
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
    }
  )

  test("should return 400 if the attribute email is missing",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      const req={body: {}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: "Attribute email is missing!" })
    }
  )

  test("should return 400 if the email is an empty string",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      const req={body: {email: ""}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: "Email is an empty string!" })
    }
  )

  test("should return 400 if the email is an invalid email",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      const req={body: {email: "ciaotest.it"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: "Email is not valid!" })
    }
  )

  test("should return 400 if the user not exist",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(User, "findOne").mockResolvedValue()

      const req={body: {email: "NotFound@test.it"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(User.findOne).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: "User not found!" })
    }
  )

  test("should return 400 if the user is an admin",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(User, "findOne").mockResolvedValue(
        {
          username: "Name",
          email: "ciao@test.it",
          role: "Admin"
        }
      )

      const req={body: {email: "ciao@test.it"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(User.findOne).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: "Cannot delete other admins" })
    }
  )

  test("should return 200 if the user is successfully deleted (no group, no transactions)",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(User, "findOne").mockResolvedValue(
        {
          username: "Name",
          email: "ciao@test.it",
          role: "Regular"
        }
      )
      jest.spyOn(transactions, "deleteMany").mockResolvedValue({deletedCount: 0})
      jest.spyOn(Group, "findOneAndUpdate").mockResolvedValue(null)
      jest.spyOn(User, "deleteOne").mockResolvedValue({deletedCount: 1})

      const req={body: {email: "ciao@test.it"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token is valid"}
      }
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(User.findOne).toHaveBeenCalled()
      expect(transactions.deleteMany).toHaveBeenCalled()
      expect(Group.findOneAndUpdate).toHaveBeenCalled()
      expect(User.deleteOne).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({data: {
        deletedTransactions: 0,
        deletedFromGroup: false,
      },
      refreshedTokenMessage: "token is valid" })
    }
  )

  test("should return 200 if the user is successfully deleted (is in a group, some transactions)",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(User, "findOne").mockResolvedValue(
        {
          username: "Name",
          email: "ciao@test.it",
          role: "Regular"
        }
      )
      jest.spyOn(transactions, "deleteMany").mockResolvedValue({deletedCount: 3})
      jest.spyOn(Group, "findOneAndUpdate").mockResolvedValue({_doc:
          {name: "GroupTest", 
          members: [
            {email: "ciao@test.it", _id: 0}, 
            {email: "email2@test.it", _id: 1}]
          }})
      jest.spyOn(User, "deleteOne").mockResolvedValue({deletedCount: 1})

      const req={body: {email: "ciao@test.it"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token is valid"}
      }
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(User.findOne).toHaveBeenCalled()
      expect(transactions.deleteMany).toHaveBeenCalled()
      expect(Group.findOneAndUpdate).toHaveBeenCalled()
      expect(User.deleteOne).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({data: {
        deletedTransactions: 3,
        deletedFromGroup: true,
      },
      refreshedTokenMessage: "token is valid" })
    }
  )

  test("should return 200 if the user is successfully deleted (is in a group and the last member, some transactions)",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(User, "findOne").mockResolvedValue(
        {
          username: "Name",
          email: "ciao@test.it",
          role: "Regular"
        }
      )
      jest.spyOn(transactions, "deleteMany").mockResolvedValue({deletedCount: 3})
      jest.spyOn(Group, "findOneAndUpdate").mockResolvedValue({_doc:
          {name: "GroupTest", 
          members: [
            {email: "ciao@test.it", _id: 0}]
          }})
      jest.spyOn(Group, "findOneAndDelete").mockResolvedValue({_doc:
        {name: "GroupTest", 
        members: []
        }})
      jest.spyOn(User, "deleteOne").mockResolvedValue({deletedCount: 1})

      const req={body: {email: "ciao@test.it"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token is valid"}
      }
      await deleteUser(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(User.findOne).toHaveBeenCalled()
      expect(transactions.deleteMany).toHaveBeenCalled()
      expect(Group.findOneAndUpdate).toHaveBeenCalled()
      expect(Group.findOneAndDelete).toHaveBeenCalled()
      expect(User.deleteOne).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({data: {
        deletedTransactions: 3,
        deletedFromGroup: true,
      },
      refreshedTokenMessage: "token is valid" })
    }
  )

  test("Should return 500 if there is an internal server error", async()=>{
    const req={}
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "token"}
    }
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500)
  })
 })

describe("deleteGroup", () => {
  beforeEach( ()=>{
    Group.findOneAndDelete.mockClear()
    })
    
    test("should return 401 if the user is not an admin",
      async()=>{
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"})
        const req={body: {name: "GroupTest"}}
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: { refreshedTokenMessage: "token"}
        }
    
        await deleteGroup(req, res);
        expect(verifyAuth).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
      }
    )
  
    test("should return 400 if the attribute name is missing",
      async()=>{
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
        const req={body: {}}
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: { refreshedTokenMessage: "token"}
        }
        await deleteGroup(req, res);
        expect(verifyAuth).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({error: "Attribute name is missing!" })
      }
    )
  
    test("should return 400 if the name is an empty string",
      async()=>{
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
        const req={body: {name: ""}}
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: { refreshedTokenMessage: "token"}
        }
        await deleteGroup(req, res);
        expect(verifyAuth).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({error: "Name is an empty string" })
      }
    )

    test("should return 400 if the group not exist",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(Group, "findOneAndDelete").mockResolvedValue()

      const req={body: {name: "GroupNotFound"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await deleteGroup(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(Group.findOneAndDelete).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: "Group not exist!" })
    }
    )

    test("should return 200 if the group successfully deleted",
    async()=>{
      verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
      jest.spyOn(Group, "findOneAndDelete").mockResolvedValue(
        {_doc:
          {name: "GroupTest", 
          members: [
            {email: "email1@test.it", _id: 0}, 
            {email: "email2@test.it", _id: 1}]
          }}
      )

      const req={body: {name: "GroupTest"}}
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: { refreshedTokenMessage: "token"}
      }
      await deleteGroup(req, res);
      expect(verifyAuth).toHaveBeenCalled()
      expect(Group.findOneAndDelete).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: { message: "Group deleted successfully" },
        refreshedTokenMessage: "token",
      })
    }
    )

  test("Should return 500 if there is an internal server error", async()=>{
    const req={}
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "token"}
    }
    await deleteGroup(req, res);
    expect(res.status).toHaveBeenCalledWith(500)
  })
  
 })