import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
  try {
    //check if user is an admin
    let AdminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!AdminAuth.flag)
      return res.status(401).json({
        error: AdminAuth.cause,
      });
    //find list of users""
    
    const users = await User.find({},{
      _id: 0,
      username: 1,
      email: 1,
      role: 1,
    });

    res.status(200).json({
      data: users,
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
  try {
    const username = req.params.username;
    //check if the user is an admin
    let AdminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!AdminAuth.flag) {
      //check if the user is searching info for himself
      let UserAuth = verifyAuth(req, res, {
        authType: "User",
        username: username,
      });

      if (!UserAuth.flag)
        return res.status(401).json({ error: UserAuth.cause });
    }
    //check if the username sarched exist and find info
    const user = await User.findOne({ username: username }, {
      _id: 0,
      username: 1,
      email: 1,
      role: 1,
    });
    if (!user) return res.status(400).json({ error: "User not found" });

    res.status(200).json({
      data: user,
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
  try {
    //check if the user is authenticathed
    let authorized = verifyAuth(req, res, { authType: "Simple" });

    if (!authorized.flag)
      return res.status(401).json({ error: authorized.cause });

    const { name, memberEmails } = req.body;

    //check if the attributes are not empty
    if ((!name || !memberEmails) && name!=="")
      return res
        .status(400)
        .json({ error: "Name or MemberEmails are missing!" });

    //check if the name of the group is an empty string
    if (name.trim() === "")
      return res.status(400).json({ error: "Group name is empty!" });
    //check if the list of emails is empty
    if (memberEmails.length === 0)
      return res.status(400).json({ error: "List of email is empty" });

    //check if exist a group with the same name
    const existingGroup = await Group.findOne({ name: name });
    if (existingGroup) return res.status(400).json({ error: "Group exist!" });

    //check if all emails are valid
    const notValid = memberEmails.filter(
      (x) => !x.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
    );
    if (notValid.length !== 0)
      return res.status(400).json({ error: "One or more emails are invalid!" });

    //find the user who want create the group
    const creator = await User.findOne(
      { refreshToken: req.cookies.refreshToken },
      { _id: 1, email: 1 }
    );

    
    //check if the creator is already in a group
    const userGroup = await Group.findOne({ "members.email": creator.email });
    if (userGroup)
      return res.status(400).json({
        error: "The creator is already in a group!",
      });

    //find the member of the list who exist in the database
    const existingMembers = await User.find(
      { email: { $in: memberEmails } },
      { _id: 1, email: 1 }
    );

    //if the list of the existing member is empty, all the email does not exist on the database
    if (existingMembers.length == 0)
      return res.status(400).json({ error: "All members not exist!" });

    //find the member of the list who are in a group
    const alreadyInGroup = await Group.aggregate([
      { $unwind: "$members" },
      {
        $match: { "members.email": { $in: memberEmails } },
      },
      { $group: { _id: null, emails: { $addToSet: "$members.email" } } },
    ])
      .then((result) => {
        return result[0].emails;
      })
      .catch((err) => {
        return [];
      });

    //check if all the members of the list  are in a group
    if (alreadyInGroup.length == memberEmails.length) {
      return res
        .status(400)
        .json({ error: "All members are already in group!" });
    }

    //find the members of the list who can be added to the new group
    let members = existingMembers.filter(
      (x) => !alreadyInGroup.includes(x.email)
    );

    //if the list of the valid member is empty there are no valid memmbers
    if (members.length == 0) {
      return res.status(400).json({
        error: "All members not exist or are already in a group!",
      });
    }

    //if the creator is not in the list is added to the members of the new group
    if (!members.find((x)=>x.email==creator.email)) members = [creator, ...members];

    //find members who not exist
    const membersNotFound = memberEmails.filter(
      (x) => !existingMembers.find((e) => e.email === x)
    );
    // create new group
    const new_group = await Group.create({ name, members });
    res.status(200).json({
      data: {
        group: {
          name: new_group.name,
          members: new_group.members.map((x) => {
            return { email: x.email };
          }),
        },
        alreadyInGroup: alreadyInGroup,
        membersNotFound: membersNotFound,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
  try {
    //check if the user is an admin
    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    //find all groups
    const groups = await Group.find({}, {
      _id: 0,
      name: 1,
      "members.email": 1,
    });

    return res.status(200).json({
        data: groups,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
  try {
    //check if the user is an admin
    let AdminAuth = verifyAuth(req, res, { authType: "Admin" });

    const name = req.params.name;
    //find the group info in the database
    let group = await Group.aggregate([
      {
        $match: { name: name },
      },
      {
        $project: { _id: 0, name: name, members: "$members.email" },
      },
    ]);

    // if there are not members in the group, the group not exist
    if (group.length == 0) {
      return res.status(400).json({ error: "Group does not exist!" });
    }

    if (!AdminAuth.flag) {
      //if the user is not an admin, check if he is in the group
      let groupAuth = verifyAuth(req, res, {
        authType: "Group",
        emails: group[0].members,
      });
      if (!groupAuth.flag)
        return res.status(401).json({ error: groupAuth.cause });
    }

    //check if the group exist
    return res.status(200).json({
      data: {
        group: {
          name: group[0].name,
          members: group[0].members.map((x) => {
            return { email: x };
          }),
        },
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
  try {
    const emails = req.body.emails;
    const name = req.params.name;

    //check if all attributes of the body exist
    if (!emails)
      return res.status(400).json({ error: "Attribute emails is missing!" });

    //find the members of the group
    let groupEmail = await Group.aggregate([
      {
        $match: { name: name },
      },
      {
        $project: { _id: 0, members: "$members.email" },
      },
    ]);

    // if there are not members in the group, the group not exist
    if (groupEmail.length == 0) {
      return res.status(400).json({ error: "Group not exist" });
    }

    //route for the admin
    if (req.route.path === "/groups/:name/insert") {
      //check if the user is an admin
      let AdminAuth = verifyAuth(req, res, { authType: "Admin" });
      if (!AdminAuth.flag)
        return res.status(401).json({ error: AdminAuth.cause });
    } else {
      //route for the regular user
      //check if the user is a member of the group
      let groupAuth = verifyAuth(req, res, {
        authType: "Group",
        emails: groupEmail[0].members,
      });
      if (!groupAuth.flag)
        return res.status(401).json({ error: groupAuth.cause });
    }

    //check if the member list has emails
    if (emails.length === 0)
      return res.status(400).json({ error: "Members list is empty!" });

    //check if all emails are valid
    const notValid = emails.filter(
      (x) => !x.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
    );
    if (notValid.length !== 0)
      return res.status(400).json({ error: "One or more emails are invalid!" });

    //find the existing members in the list of emails
    const existingMembers = await User.find(
      { email: { $in: emails } },
      { _id: 1, email: 1 }
    );

    //check if there is at least one member who exist
    if (existingMembers.length == 0)
      return res.status(400).json({ error: "All members not exist!" });

    //find all the member in the list of emails who are already in a group
    const alreadyInGroup = await Group.aggregate([
      { $unwind: "$members" },
      { $match: { "members.email": { $in: emails } } },
      { $group: { _id: null, emails: { $addToSet: "$members.email" } } },
    ])
      .then((result) => {
        if(result.length>0)
          return result[0].emails;
        return result
      })

    //check if all members are already in a group
    if (alreadyInGroup.length == emails.length)
      return res
        .status(400)
        .json({ error: "All members are already in group!" });

    //find all valid members
    const members = existingMembers.filter(
      (x) => !alreadyInGroup.includes(x.email)
    );

    //check if there is at least one valid member in the list
    if (members.length == 0) {
      return res.status(400).json({
        error: "All members not exist or are already in a group!",
      });
    }

    //find the list of members who not exist
    const membersNotFound = emails.filter(
      (x) => !existingMembers.find((e) => e.email === x)
    );

    //add new members to the group
    const change = await Group.updateOne(
      { name: name },
      { $push: { members: members } }
    );

    //find updated group
    const new_group = await Group.findOne(
      { name: name },
      { _id: 0, name: 1, "members.email": 1 }
    );
    res.status(200).json({
      data: {
        group: new_group,
        alreadyInGroup: alreadyInGroup,
        membersNotFound: membersNotFound,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
  try {
    const emails = req.body.emails;
    const name = req.params.name;

    //check if all attributes of the body exist
    if (!emails)
      return res.status(400).json({ error: "Attribute emails is missing!" });

    //find the members of the group
    let groupEmail = await Group.aggregate([
      {
        $match: { name: name },
      },
      {
        $project: {
          _id: 0,
          members: "$members.email",
        },
      },
    ]);

    // if there are not members in the group, the group not exist
    if (groupEmail.length == 0) {
      return res.status(400).json({ error: "Group not exist" });
    }

    //route for the admin
    if (req.route.path === "/groups/:name/pull") {
      //check if the user is an admin
      let AdminAuth = verifyAuth(req, res, { authType: "Admin" });
      if (!AdminAuth.flag)
        return res.status(401).json({ error: AdminAuth.cause });
    } else {
      //route for the regular user
      //check if the user is a member of the group
      let groupAuth = verifyAuth(req, res, {
        authType: "Group",
        emails: groupEmail[0].members,
      });
      if (!groupAuth.flag)
        return res.status(401).json({ error: groupAuth.cause });
    }

    //check if there is only one member in the group
    if (groupEmail[0].members.length == 1)
      return res.status(400).json({ error: "Only one member in the group!" });

    //check if the member list has emails
    if (emails.length == 0)
      return res.status(400).json({ error: "Members list is empty!" });

    //check if all emails are valid
    const notValid = emails.filter(
      (x) => !x.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
    );
    if (notValid.length !== 0)
      return res.status(400).json({ error: "One or more emails are invalid!" });

    //find the existing members in the list of emails
    const existingMembers = await User.find(
      { email: { $in: emails } },
      {
        _id: 1,
        email: 1,
      }
    );

    //check if there is at least one member who exist
    if (existingMembers.length == 0) {
      return res.status(400).json({ error: "All members not exist!" });
    }

    //find all the member in the list of emails who are in the group
    let notInGroup = existingMembers.filter(
      (x) => !groupEmail[0].members.find((e) => x.email === e)
    );
    if (notInGroup.length == emails.length)
      return res
        .status(400)
        .json({ error: "All members are not in the group!" });

    //find all valid members
    let member = [];
    if (notInGroup.length !== 0)
      member = existingMembers.filter((x) => !notInGroup.includes(x));
    else member = existingMembers;
    
    if(member.length==groupEmail[0].members.length)
      member = member.filter((x) => x.email !== groupEmail[0].members[0])

    //check if there is at least one valid member in the list
    if (member.length == 0)
      return res.status(400).json({ error: "All members cannot be removed!" });

    //find the list of members who not exist
    const membersNotFound = emails.filter(
      (x) => !existingMembers.find((e) => e.email === x)
    );

    //delete members from the group
    const change = await Group.updateOne(
      { name: name },
      { $pull: { members: { email: member.map((e) => e.email) } } }
    );

    //find updated group
    const new_group = await Group.findOne(
      { name: name },
      { _id: 0, name: 1, "members.email": 1 }
    );
    res.status(200).json({
      data: {
        group: new_group,
        notInGroup: notInGroup.map((x) => x.email),
        membersNotFound: membersNotFound,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
  try {
    //check if the user who want delete the other user is an admin
    let AdminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!AdminAuth.flag)
      return res.status(401).json({ error: AdminAuth.cause });

    const { email } = req.body;

    //check if all attributes of the body exist
    if (!email && email!=="")
      return res.status(400).json({ error: "Attribute email is missing!" });

    //check if email is an empty string
    if (email.trim() === "")
      return res.status(400).json({ error: "Email is an empty string!" });

    //check if the email is valid format
    if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/))
      return res.status(400).json({ error: "Email is not valid!" });

    //check if the email is not in the database
    const existingUser = await User.findOne({ email: email });
    if (!existingUser)
      return res.status(400).json({ error: "User not found!" });

    //check if the email of the user to delete is an admin
    if (existingUser.role == "Admin")
      return res.status(400).json({ error: "Cannot delete other admins" });

    //delete and count all the transaction for the user to delete
    const deletedTransactions = await transactions
      .deleteMany({ username: existingUser.username })
      .then((result) => {
        return result.deletedCount;
      })

    //delete the user from the group and delete the group if he is the last member of the group
    //true if the user was in a group false in the other case
    const deletedFromGroup = await Group.findOneAndUpdate(
      { members: { $elemMatch: { email: email } } },
      { $pull: { members: { email: email } } }
    )
      .then(async (result) => {
        if (result._doc.members.length == 1)
          await Group.findOneAndDelete({ name: result._doc.name });
        return true;
      })
      .catch((err) => {
        return false;
      });

    //delete the user
    let data = await User.deleteOne({ email: email });

    res.status(200).json({
      data: {
        deletedTransactions: deletedTransactions,
        deletedFromGroup: deletedFromGroup,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
  try {
    //check if the user who want delete the group is an admin
    let AdminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!AdminAuth.flag)
      return res.status(401).json({
        error: AdminAuth.cause,
      });

    const { name } = req.body;

    //check if the attribute exist
    if (!name && name!=="")
      return res.status(400).json({ error: "Attribute name is missing!" });

    //check if name is not an empty string
    if (name.trim() === "")
      return res.status(400).json({ error: "Name is an empty string" });

    //if the user exist in the database delete him
    const deletedGroup = await Group.findOneAndDelete({ name });

    if (!deletedGroup)
      return res.status(400).json({ error: "Group not exist!" });
    else
      return res.status(200).json({
        data: { message: "Group deleted successfully" },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
  } catch (err) {
    res.status(500).json(err.message);
  }
};
