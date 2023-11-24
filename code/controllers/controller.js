import { categories, transactions } from "../models/model.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";
import { Group, User } from "../models/User.js";
import dayjs from 'dayjs';

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (!adminAuth.flag) {
            return res.status(401).json({ error: adminAuth.cause })
        }
        const { type, color } = req.body;

        if (!('type' in req.body) || !('color' in req.body)) return res.status(400).json({ error: "not enough parameters" })

        if (type.trim() === '' || color.trim() === '') return res.status(400).json({ error: "Type or color are invalid" })


        if (await categories.findOne({ type: req.body.type })) {
            return res.status(400).json({ error: "This category already exists" });
        }
        //create new category
        const new_categories = new categories({ type, color });
        //save new category on db
        new_categories.save()
            .then(d => res.status(200).json({ data: { type: d.type, color: d.color }, refreshedTokenMessage: res.locals.refreshedTokenMessage }))
            .catch(err => { throw err })

    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 401 returned if the specified category does not exist
    - error 401 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
    try {

        const auth = verifyAuth(req, res, { authType: "Admin" });
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause });
        }

        if (!('type' in req.body) || !('color' in req.body)) return res.status(400).json({ error: "not enough parameters" })

        const old_type = req.params.type;
        const new_type = req.body.type;
        const new_color = req.body.color;

        if (new_type.trim() === '' || new_color.trim() === '') return res.status(400).json({ error: "Type or color are invalid" });

        if (!await categories.findOne({ type: old_type })) {
            return res.status(400).json({ error: "Category not found" });
        }
        else {

            if (await categories.findOne({ type: new_type })) return res.status(400).json({ error: "Category already exists" })

            await categories.updateOne(
                { type: { $eq: old_type } },
                { $set: { type: new_type, color: new_color } },
            );

            const result = await transactions.updateMany(
                { type: { $eq: old_type } },
                { $set: { type: new_type, color: new_color } },
            );

            res.status(200).json({
                data: { message: "Category updated successfully", count: result.modifiedCount },
                refreshedTokenMessage: res.locals.refreshedTokenMessage
            });



        }


    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
    try {

        //Check if the user is an admin
        const auth = verifyAuth(req, res, { authType: "Admin" });
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause });
        }

        //Check if the request body contains the right umber of attributes
        if (!('types' in req.body)) return res.status(400).json({ error: 'Some attributes are missing' });
        let list_type = req.body.types;
        if (list_type.length == 0) return res.status(400).json({ error: "Category list is empty" });

        //Count all categories in the database
        const num = await categories.count();
       
   

        let changed = 0;

        //Search for category inserted in list_type if are all in the database
        const existingCategories = await categories.find({ type: { $in: list_type } });

        //Compare the categories found in the DB with the categories passed in the request body
        //If the category found in the DB are less than the one in the request body some of them are not valid
        if (existingCategories.length < list_type.length) {
            return res.status(400).json({ error: "One or more category type are not valid" })
        }
        //If all the category found are all the categories in the DB
        else if (existingCategories.length == num) {

             //If there is just one category left it cannot be deleted
            if (num == 1) {
                return res.status(400).json({ error: "Cannot delete the last category" });
            }
    
            //!Find the oldest category in the DB because we have to delete all the other categories, but not the first one
            const firstCategory = await categories.findOne({}, {}, { sort: { _id: 1 } });

            //Filtering the list of type to be deleted in order to not delete the first category 
            list_type = list_type.filter((x) => x != firstCategory.type);

        }

        //Delete all the request type
        const result = await categories.deleteMany({ type: { $in: list_type } });

        //Check the first category after deletion
        const cat = await categories.findOne({}, {}, { sort: { _id: 1 } });

        //Update transactions
        const transactionChanged = await transactions.updateMany({ type: { $in: list_type } }, { $set: { type: cat.type } });

        res.status(200).json({ data:{
            message: "Category deleted successfully",
            count: transactionChanged.modifiedCount,
        }});

    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
    try {
        const simpleAuth = verifyAuth(req, res, { authType: "Simple" })
        if (!simpleAuth.flag) {
            return res.status(401).json({ error: simpleAuth.cause })
        }

        //find categories 
        let d = await categories.find({})

        let data = d.map(v => Object.assign({}, { type: v.type, color: v.color },))

        return res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage })
    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
    try {

        

        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username })
   
        if (!userAuth.flag) {
        
            if (userAuth.cause == "User's username is different from the request") return res.status(401).json({ error: "Unauthorized"});
            if (userAuth.cause == "wrong route") return res.status(400).json({ error: "username in the route is empty"});
        
            return res.status(401).json({ error: userAuth.cause })
        }

        let un = req.body.username;
        let routeTest = `/users/${un}/transactions`;

        if(routeTest !== req.path) return res.status(400).json({error: "route mismatch the body request"}) ; 

        if (!('username' in req.body) || !('amount' in req.body) || !('type' in req.body)) return res.status(400).json({ error: "not enough parameters" })
        const { username, amount, type } = req.body;
        if (username.trim() === '' || amount.toString().trim() === '' || type.trim() === '') return res.status(400).json({ error: "username, amount or type are invalid" })

        if (req.params.username !== req.body.username) return res.status(401).json({ error: "username passed to route is different from username in the body" })

        let amN = Number(amount)
        if (isNaN(amN)) return res.status(400).json({ error: "amount is not a number" })

        if (!(await User.findOne({ username: { $eq: username } })) || !(await categories.findOne({ type: { $eq: type } }))) {
            return res.status(400).json({ error: "Username or category type does not exist" });
        }

        //create new transaction
        const new_transactions = new transactions({ username, amount, type });
        new_transactions.save()
            .then(d => res.status(200).json({ data: { username: d.username, amount: d.amount, type: d.type, date: d.date }, refreshedTokenMessage: res.locals.refreshedTokenMessage }))
            .catch(err => { throw err })
    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    try {
        let adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (adminAuth.flag) {
            /**
             * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
            */
            transactions.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
            }
            ).catch(error => { throw (error) })
        } else {
            return res.status(401).json({ error: adminAuth.cause })
        }
    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Return all transactions made by a specific user
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the user does not exist
    - empty array is returned if there are no transactions made by the user
    - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {

    try {
        //Distinction between route accessed by Admins or Regular users for functions that can be called by both
        //and different behaviors and access rights
        const usernameC = req?.params?.username;
        
        if (req.url.indexOf("/transactions/users/") >= 0) {
            //this is route for admin 
            const adminAuth = verifyAuth(req, res, { authType: "Admin" });
            
            if (adminAuth.flag) {
                //user pass in the route
                const userC = await User.findOne({ username: usernameC })
                if (!userC) return res.status(400).json({ error: "User passed as a route parameter not found" })
                let transaction = await transactions.aggregate([
                    {
                        $match: { username: usernameC }
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "type",
                            foreignField: "type",
                            as: "categories_info"
                        }
                    }
                ])
                let dataU = transaction.map(v => Object.assign({}, { username: v.username, type: v.categories_info[0].type, amount: v.amount, date: dayjs(v.date).format('YYYY-MM-DDTHH:mm:ss'), color: v.categories_info[0].color }))
                return res.status(200).json({ data: dataU, refreshedTokenMessage: res.locals.refreshedTokenMessage })


            } else {
                return res.status(401).json({ error: adminAuth.cause })
            }

        } else {
            //this is route for user
            const userAuth = verifyAuth(req, res, { authType: "User", username: usernameC })

            if (!userAuth.flag) {
                return res.status(401).json({ error: userAuth.cause })
            } else {
                //here there is a control over the number of parameters
                //const numQuery = Object.keys(req.query).length
                
                    const userC = await User.findOne({ username: usernameC })
                    if (!userC) return res.status(400).json({ error: "User passed as a route parameter not found" })
                    //these are the operations to do in case there are filter params on date or amount
                    
                    let filterDate = handleDateFilterParams(req)
                    let filterAmount = handleAmountFilterParams(req)

                    let filterDateFrom = {};
                    let filterDateUpTo = {};

                    if (filterDate?.date?.$gte) filterDateFrom = { date: { $gte: new Date(filterDate.date.$gte.toISOString().slice(0,19)) } };
                    if (filterDate?.date?.$lte) filterDateUpTo = { date: { $lte:new Date( filterDate.date.$lte.toISOString().slice(0,19)) } };

                    let filterMinAmount = {};
                    let filterMaxAmount = {};

                    if (filterAmount?.amount?.$gte) filterMinAmount = { amount: { $gte: Number(filterAmount.amount.$gte) } };
                    if (filterAmount?.amount?.$lte) filterMaxAmount = { amount: { $lte: Number(filterAmount.amount.$lte) } };


                    //applies the filters to the database and you need to do a join with categories to get all the information
                    let transaction = await transactions.aggregate([
                        {
                            $match: {
                                $and: [{ username: req.params.username },
                                    filterDateFrom,
                                    filterDateUpTo,
                                    filterMinAmount,
                                    filterMaxAmount,
                                ]

                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "type",
                                foreignField: "type",
                                as: "categories_info"
                            }
                        }
                    ])

                    let dataU = transaction.map(v => Object.assign({}, { username: v.username, type: v.categories_info[0].type, amount: v.amount, date: dayjs(v.date).format('YYYY-MM-DDTHH:mm:ss'), color: v.categories_info[0].color }))
                    return res.status(200).json({ data: dataU, refreshedTokenMessage: res.locals.refreshedTokenMessage })
                
            }

        }
    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 401 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {

    try {
        const usernameC = req?.params?.username
        const categoryC = req?.params?.category
      

        if (req.url.indexOf("/transactions/users/") >= 0) {
            const adminAuth = verifyAuth(req, res, { authType: "Admin" })
            if (!adminAuth.flag) {
                return res.status(401).json({ error: adminAuth.cause })
            } else {
                //user passed as a route parameter
                const userC = await User.findOne({ username: usernameC })
                if (!userC) return res.status(400).json({ error: "User not found" })
        
                const cat = await categories.findOne({ type: categoryC })
                if (!cat) return res.status(400).json({ error: "Category not found" })

                let transaction = await transactions.aggregate([
                    {
                        $lookup: {
                            from: "categories",
                            localField: "type",
                            foreignField: "type",
                            as: "categories_info"
                        }
                    },
                    {
                        $match: {
                            username: usernameC,
                            type: categoryC
                        }
                    }
                ])
                let dataDA = transaction.map(v => Object.assign({}, { username: v.username, type: v.categories_info[0].type, amount: v.amount, date: dayjs(v.date).format('YYYY-MM-DDTHH:mm:ss'), color: v.categories_info[0].color }))
                return res.status(200).json({ data: dataDA, refreshedTokenMessage: res.locals.refreshedTokenMessage })
            }
            }else{
                const userAuth = verifyAuth(req, res, { authType: "User", username: usernameC })
                if (!userAuth.flag) {
                    return res.status(401).json({ error: userAuth.cause })
                } else {
                    const userC = await User.findOne({ username: usernameC })
                    if (!userC) return res.status(400).json({ error: "User not found" })
        
                    const cat = await categories.findOne({ type: categoryC })
                    if (!cat) return res.status(400).json({ error: "Category not found" })
                    let transaction = await transactions.aggregate([
                        {
                            $lookup: {
                                from: "categories",
                                localField: "type",
                                foreignField: "type",
                                as: "categories_info"
                            }
                        },
                        {
                            $match: {
                                username: usernameC,
                                type: categoryC
                            }
                        }
                    ])
                    let dataDA = transaction.map(v => Object.assign({}, { username: v.username, type: v.categories_info[0].type, amount: v.amount, date: dayjs(v.date).format('YYYY-MM-DDTHH:mm:ss'), color: v.categories_info[0].color }))
                    return res.status(200).json({ data: dataDA, refreshedTokenMessage: res.locals.refreshedTokenMessage })
    
            }
            }

    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Return all transactions made by members of a specific group
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {

    try {
        let nameG = req?.params?.name
        
        // in this way it is possible to check whether the user who is to login is a member of the group or an admin
        if (req.url.indexOf("/transactions/groups/") >= 0) {
            let AdminAuth = verifyAuth(req, res, { authType: "Admin" })
            if (!AdminAuth.flag) {
                return res.status(401).json({ error: "Unauthorized" })
            }else{
                let g = await Group.findOne({ name: nameG })
                if (!g) return res.status(400).json({ error: "Group not found" })
                //if user is a admin can look all information
                let transaction = await Group.aggregate([
                    {
                        $lookup: {
                            from: "users",
                            localField: "members.email",
                            foreignField: "email",
                            as: "join_user"
                        }
                    },
                    { $unwind: "$join_user" },
                    {
                        $lookup: {
                            from: "transactions",
                            localField: "join_user.username",
                            foreignField: "username",
                            as: "join_trans"
                        }
                    },
                    { $unwind: "$join_trans" },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "join_trans.type",
                            foreignField: "type",
                            as: "categories_info"
                        }
                    },
                    { $unwind: "$categories_info" },
                    {
                        $match: {
                            name: nameG
                        }
                    }
                ])
                let dataDA = transaction.map(v => Object.assign({}, { username: v.join_user.username, type: v.categories_info.type, amount: v.join_trans.amount, date: dayjs(v.join_trans.date).format('YYYY-MM-DDTHH:mm:ss'), color: v.categories_info.color }))
                return res.status(200).json({ data: dataDA, refreshedTokenMessage: res.locals.refreshedTokenMessage })
    
            }
        }else{
            //this is the query to extract the e-mails of the group members
            let g = await Group.findOne({ name: nameG })
            if (!g) return res.status(400).json({ error: "Group not found" })

            let groupEmail = await Group.aggregate([
                {
                    $match: { name: nameG }
                },
                {
                    $project: {
                        _id: 0,
                        members: "$members.email"
                    }
                }])
            let groupAuth = verifyAuth(req, res, { authType: "Group", emails: groupEmail[0].members })
            if(!groupAuth.flag){
                return res.status(401).json({ error: "Unauthorized" })
            }else{
        
    
            //if the user is a group member , it is possible to view transactions
            //in this case it is necessary to make joins so that all information can be shown
            let transaction = await Group.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "members.email",
                        foreignField: "email",
                        as: "join_user"
                    }
                },
                { $unwind: "$join_user" },
                {
                    $lookup: {
                        from: "transactions",
                        localField: "join_user.username",
                        foreignField: "username",
                        as: "join_trans"
                    }
                },
                { $unwind: "$join_trans" },
                {
                    $lookup: {
                        from: "categories",
                        localField: "join_trans.type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" },
                {
                    $match: {
                        name: nameG
                    }
                }
            ])
            let dataDA = transaction.map(v => Object.assign({}, { username: v.join_user.username, type: v.categories_info.type, amount: v.join_trans.amount, date: dayjs(v.join_trans.date).format('YYYY-MM-DDTHH:mm:ss'), color: v.categories_info.color }))
            return res.status(200).json({ data: dataDA, refreshedTokenMessage: res.locals.refreshedTokenMessage })

        }
    }

    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Optional behavior:
    - error 401 is returned if the group or the category does not exist
    - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
    try {
        
        let nameG = req?.params?.name
        let categoryC = req?.params?.category

        if (req.url.indexOf("/transactions/groups/") >= 0) {
            let AdminAuth = verifyAuth(req, res, { authType: "Admin" })
            if (!AdminAuth.flag) {
                return res.status(401).json({ error: "Unauthorized" })
            }else{
             //if the group does not exist
            let g = await Group.findOne({ name: nameG })
            if (!g) return res.status(400).json({ error: "Group not found" })
            //if the category does not exist
            const cat = await categories.findOne({ type: categoryC })
            if (!cat) return res.status(400).json({ error: "Category not found" })
             //if the user is a Admin it is possible to view transactions for a single category
            //in this case it is necessary to make joins so that all information can be shown
            let transaction = await Group.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "members.email",
                        foreignField: "email",
                        as: "join_user"
                    }
                },
                { $unwind: "$join_user" },
                {
                    $lookup: {
                        from: "transactions",
                        localField: "join_user.username",
                        foreignField: "username",
                        as: "join_trans"
                    }
                },
                { $unwind: "$join_trans" },
                {
                    $lookup: {
                        from: "categories",
                        localField: "join_trans.type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" },
                {
                    $match: {
                        name: nameG,
                        "categories_info.type": categoryC
                    }
                }
            ])
            let dataDA = transaction.map(v => Object.assign({}, { username: v.join_user.username, type: v.categories_info.type, amount: v.join_trans.amount, date: dayjs(v.join_trans.date).format('YYYY-MM-DDTHH:mm:ss'), color: v.categories_info.color }))
            return res.json({ data: dataDA, refreshedTokenMessage: res.locals.refreshedTokenMessage })

            }
    }else{
        let g = await Group.findOne({ name: nameG })
        if (!g) return res.status(400).json({ error: "Group not found" })
      

            //this is the query to extract the e-mails of the group members
            let groupEmail = await Group.aggregate([
            {
                $match: { name: nameG }
            },
            {
                $project: {
                    _id: 0,
                    members: "$members.email"
                }
            }])
            let groupAuth = verifyAuth(req, res, { authType: "Group", emails: groupEmail[0].members })
            if(!groupAuth.flag){
                return res.status(401).json({ error: "Unauthorized" })
            }else{
                //if the group does not exist
                 //if the category does not exist
                const cat = await categories.findOne({ type: categoryC })
                if (!cat) return res.status(400).json({ error: "Category not found" })
                //if the user is a group member it is possible to view transactions for a single category
                //in this case it is necessary to make joins so that all information can be shown
                let transaction = await Group.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "members.email",
                        foreignField: "email",
                        as: "join_user"
                    }
                },
                { $unwind: "$join_user" },
                {
                    $lookup: {
                        from: "transactions",
                        localField: "join_user.username",
                        foreignField: "username",
                        as: "join_trans"
                    }
                },
                { $unwind: "$join_trans" },
                {
                    $lookup: {
                        from: "categories",
                        localField: "join_trans.type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" },
                {
                    $match: {
                        name: nameG,
                        "categories_info.type": categoryC
                    }
                }
                ])
                let dataDA = transaction.map(v => Object.assign({}, { username: v.join_user.username, type: v.categories_info.type, amount: v.join_trans.amount, date: dayjs(v.join_trans.date).format('YYYY-MM-DDTHH:mm:ss'), color: v.categories_info.color }))
                return res.json({ data: dataDA, refreshedTokenMessage: res.locals.refreshedTokenMessage })
            }
    }
    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    try {

        //Take the username from the parameters of the request
        const username = req.params.username;
        const us= await User.findOne({username: username});

        if (!us) return res.status(400).json( {error:'User not exixts'});
        let UserAuth = verifyAuth(req, res, { authType: "User", username: username });

        //Check if the user is authorized
        if (!UserAuth.flag){
            
            if (UserAuth.cause=="User's username is different from the request") return res.status(401).json({ error: "Unauthorized"});
            if (UserAuth.cause=="wrong route") return res.status(400).json({ error: "username in the route is empty"});
        
            return res.status(401).json({ error:"Unauthorized" });
        }

        //Check the attribute in the body
        if (!('_id' in req.body)) return res.status(400).json({ error: "The attribute _id is missing!" });

        let id_trans = req.body._id;
        //Check if the id is empty or a single whitespace
        if (id_trans.trim() === '') {
            return res.status(400).json({ error: "Id is empty" });
        }

        //Check if the id of the provided transaction exists
        const checkExistence = await transactions.findOne({ _id: req.body._id }).then((result) => {
            return result;
          }).catch((err) => {
            return  false;
          });
    
        if (!checkExistence) {
            return res.status(400).json({ error: "Transaction does not exist" });
        }

        //Check if the transaction provided belongs to the user
        if (!await transactions.findOne({ _id: req.body._id, username: username })) {
            return res.status(400).json({ error: "This is not your transaction!" });
        }

        let data = await transactions.deleteOne({ _id: req.body._id });
        res.status(200).json({ data: { message: "Transaction deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Delete multiple transactions identified by their ids
  - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
export const deleteTransactions = async (req, res) => {
    try {

        //Check if the user has admin privileges
        let AdminAuth = verifyAuth(req, res, { authType: "Admin" });
        if (!AdminAuth.flag){

           /*  if (AdminAuth.cause==="User's username is different from the request") return res.status(401).json({ error: "Unauthorized"});
            if (AdminAuth.cause==="wrong route") return res.status(400).json({ error: "username in the route is empty"}); */
            return res.status(401).json({ error: "Unauthorized"});
        }   
        //Check if the body has the right number of attributes
        if (!('_ids' in req.body) || !('body' in req)) return res.status(400).json({error: 'The attribute is missing!'});

        const idList = req.body._ids

        //Check if the idList has attribute
        if (idList.length > 0) {

            if (idList.some(id => id.trim() === '')) {
             return res.status(400).json({ error: 'One or more IDs are empty strings!' });
}
            //Find the transaction that has the id provided in the request body
            const existingTransactions = await transactions.find({ _id: { $in: idList } }).then((result) => {
                return result;
              }).catch((err) => {
                return [];
              });
        

            //if the number of transaction found is less than the number of id provided one or more are not valid
            if (existingTransactions.length < idList.length) {
                return res.status(400).json({ error: "One or more id not found" })
            }

            //Delete the transactions with the id provided
            let data = await transactions.deleteMany({ _id: { $in: idList } });

            res.status(200).json({ data: { message: "Transactions deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage })
        }
        else {
            return res.status(400).json({ error: "Id list is empty!" })
        }


    } catch (error) {
        res.status(500).json(error.message)
    }
}
