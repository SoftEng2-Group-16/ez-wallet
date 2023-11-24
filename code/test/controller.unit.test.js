import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User,Group } from '../models/User.js';
import * as controller from '../controllers/controller.js';
import { verifyAuth, handleAmountFilterParams, handleDateFilterParams } from '../controllers/utils';
import dayjs from 'dayjs';
jest.mock('../models/model');
jest.mock('../controllers/utils.js', () => ({
    verifyAuth: jest.fn(),
    handleAmountFilterParams: jest.fn(),
    handleDateFilterParams: jest.fn()
}));

jest.mock('../models/User.js');


describe("createCategory", () => {
    beforeEach(() => {
        categories.find.mockClear();
        categories.prototype.save.mockClear();
        transactions.find.mockClear();
        transactions.deleteOne.mockClear();
        transactions.aggregate.mockClear();
        transactions.prototype.save.mockClear();
    });

    test('should return 401 if not authenticated as admin', async () => {
        // Mock verifyAuth to return non-admin authentication failure



        const req = {
            body: { type: 'test', color: 'red' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });

        await controller.createCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 400 if type or color parameters are missing', async () => {
        const req = {
            body: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        await controller.createCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'not enough parameters' });
    });

    test('should return 400 if type or color parameters are invalid', async () => {
        const req = {
            body: { type: '', color: '' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        await controller.createCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Type or color are invalid' });
    });

    test('should return 400 if category already exists', async () => {
        const req = {
            body: { type: 'ExistingCategory', color: 'red' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        // Mock categories.findOne to simulate an existing category with the same type
        categories.findOne.mockResolvedValue({ type: 'ExistingCategory' });

        await controller.createCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'ExistingCategory' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'This category already exists' });
    });

    test('should create a new category', async () => {
        const req = {
            body: { type: 'NewCategory', color: 'blue' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: 'Token refreshed' },
        };

        verifyAuth.mockReturnValue({ flag: true });

        // Mock categories.findOne to simulate no existing category with the same type
        categories.findOne.mockResolvedValue(null);

        // Mock the category save method
        const saveMock = jest.fn().mockResolvedValue({ type: 'NewCategory', color: 'blue' });
        categories.mockImplementation(() => ({
            save: saveMock,
        }));

        await controller.createCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'NewCategory' });
        expect(categories).toHaveBeenCalledWith({ type: 'NewCategory', color: 'blue' });
        expect(saveMock).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: { type: 'NewCategory', color: 'blue' }, refreshedTokenMessage: 'Token refreshed' });
    });

    test('should return 500 if an error occurs before category cration', async () => {
        const req = {
            body: { type: 'NewCategory', color: 'blue' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockImplementation(() => { throw new Error('Error from auth') });

        // Mock categories.findOne to simulate no existing category with the same type
        categories.findOne.mockResolvedValue(null);

        // Mock the category save method to throw an error

        await controller.createCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith('Error from auth');
    });

    test('should return 500 if an error occurs within category creation', async () => {
        const req = {
            body: { type: 'NewCategory', color: 'blue' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockImplementation(() => { return { flag: 'true' } });

        // Mock categories.findOne to simulate no existing category with the same type
        categories.findOne.mockResolvedValue(null);

        // Mock the category save method to throw an error
        const saveMock = jest.fn().mockImplementation(() => { throw new Error('Category creation error') });
        categories.mockImplementation(() => ({
            save: jest.fn().mockReturnThis(),
            then: jest.fn().mockReturnThis(),
            catch: saveMock,

        }));
        /*     categories.prototype.save = saveMock;
            categories.prototype.save.then = saveMock; */
        //categories.prototype.save.then. = saveMock;

        await controller.createCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith('Category creation error');
    });
});


describe("updateCategory", () => {
    beforeEach(() => {
        categories.findOne.mockClear();
        categories.updateOne.mockClear();
        transactions.updateMany.mockClear();
        verifyAuth.mockClear();
    });

    test('should return 401 if not authenticated as admin', async () => {
        const req = {
            params: { type: 'old_type' },
            body: { type: 'new_type', color: 'new_color' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });

        await controller.updateCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
    test('should return 400 if category is not found', async () => {
        const req = {
            params: { type: 'nonexistent_type' },
            body: { type: 'new_type', color: 'new_color' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        categories.findOne.mockResolvedValue(null);
        verifyAuth.mockReturnValue({ flag: true });

        await controller.updateCategory(req, res);

        expect(categories.findOne).toHaveBeenCalledWith({ type: req.params.type });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });

    test('should return 400 if invalid type/color', async () => {
        const req = {
            params: { type: 'old_type' },
            body: { type: '', color: '' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        await controller.updateCategory(req, res);


        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Type or color are invalid' });
    });

    test('should return 400 if the new category type already exists', async () => {
        const req = {
            params: { type: 'old_type' },
            body: { type: 'existing_type', color: 'new_color' }
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res)
        };

        verifyAuth.mockReturnValue({ flag: true });

        categories.findOne.mockReturnValueOnce(true); // Mock existing categoryold to check if exist
        categories.findOne.mockReturnValueOnce(true); // Mock new category does not exist

        await controller.updateCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'old_type' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'existing_type' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Category already exists' });
    });

    test('should return 500 if an error occurs', async () => {
        const req = {
            params: { type: 'old_type' },
            body: { type: 'new_type', color: 'new_color' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        const error = new Error('Internal Server Error');
        categories.findOne.mockRejectedValue(error);
        verifyAuth.mockReturnValue({ flag: true });

        await controller.updateCategory(req, res);

        expect(categories.findOne).toHaveBeenCalledWith({ type: req.params.type });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(error.message);
    });

    test('should update category and return success message', async () => {
        const req = {
            params: { type: 'old_type' },
            body: { type: 'new_type', color: 'new_color' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: '' }
        };

        const modifiedCount = 1;
        categories.findOne.mockResolvedValueOnce({});
        categories.findOne.mockResolvedValueOnce();
        categories.updateOne.mockResolvedValue({});
        transactions.updateMany.mockResolvedValue({ modifiedCount });
        verifyAuth.mockReturnValue({ flag: true });

        await controller.updateCategory(req, res);

        expect(categories.findOne).toHaveBeenCalledWith({ type: req.params.type });
        expect(categories.findOne).toHaveBeenCalledWith({ type: req.body.type });

        expect(categories.updateOne).toHaveBeenCalledWith(
            { type: { $eq: req.params.type } },
            { $set: { type: req.body.type, color: req.body.color } }
        );
        expect(transactions.updateMany).toHaveBeenCalledWith(
            { type: { $eq: req.params.type } },
            { $set: { type: req.body.type, color: req.body.color } }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: { message: 'Category updated successfully', count: modifiedCount },
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    });

});

describe("deleteCategory", () => {
    beforeEach(() => {
        verifyAuth.mockClear();
        categories.count.mockClear();
        categories.find.mockClear();
        categories.findOne.mockClear();
        categories.deleteMany.mockClear();
        transactions.updateMany.mockClear();
    });

    test('should return 500 if an error occurs', async () => {
        const req = {
          
            body:{ types:['prova','stur']}
           
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        const error = new Error('Internal Server Error');
        verifyAuth.mockReturnValue({ flag: true });
        categories.count.mockRejectedValue(error);

        await controller.deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(error.message);
    });

    test('should return 401 if not authenticated as admin', async () => {
        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });

        const req = {};
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        await controller.deleteCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 400 if some attributes are missing in the request body', async () => {
        verifyAuth.mockReturnValue({ flag: true });

        const req = {
            body: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        await controller.deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Some attributes are missing' });
        expect(categories.count).not.toHaveBeenCalled();
    });

    test('should return 400 if attempting to delete the last category', async () => {
      
        verifyAuth.mockReturnValue({ flag: true });
        categories.count.mockResolvedValue(1);
        categories.find.mockResolvedValue([{type:'category1', color:'red'}]);

        const req = {
            body: {
                types: ['category1'],
            },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            refreshedTokenMessage: 'message'
        };

        await controller.deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Cannot delete the last category' });
        expect(categories.count).toHaveBeenCalled();
    });
    test('should return 400 if one or more category types are not valid', async () => {

        verifyAuth.mockReturnValue({ flag: true });
        categories.count.mockResolvedValue(5);
        categories.find.mockResolvedValue([{ type: 'category1' }, { type: 'category2' }]);

        const req = {
            body: {
                types: ['category1', 'category2', 'category3'],
            },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        await controller.deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'One or more category type are not valid' });
        expect(categories.count).toHaveBeenCalled();
        expect(categories.find).toHaveBeenCalledWith({ type: { $in: ['category1', 'category2', 'category3'] } });
    });

    test('should return 400 if the category list is empty', async () => {
        verifyAuth.mockReturnValue({ flag: true });

        const req = {
            body: {
                types: [],
            },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        await controller.deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Category list is empty' });
        expect(categories.count).not.toHaveBeenCalled();
    });


    test('should delete categories and update transactions, case types.lenght < count', async () => {
        const req = {
            body: {
                types: ['category2', 'category3'],
            },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        categories.count.mockResolvedValue(3);
        categories.find.mockResolvedValue([
            { type: 'category1' },
            { type: 'category2' },
            { type: 'category3' },
        ]);

        categories.findOne.mockResolvedValue({ type: 'category1' });

        const deleteManyResult = {
            deletedCount: 2,
        };

        categories.deleteMany.mockResolvedValue(deleteManyResult);

        const updateManyResult = {
            modifiedCount: 3,
        };
        transactions.updateMany.mockResolvedValue(updateManyResult);



        await controller.deleteCategory(req, res);

        expect(res.json).toHaveBeenCalledWith({ data:{
            message: 'Category deleted successfully',
            count: updateManyResult.modifiedCount,
        }
        });
        expect(categories.find).toHaveBeenCalledWith({ type: { $in: ['category2', 'category3'] } });
        expect(categories.deleteMany).toHaveBeenCalledWith({ type: { $in: ['category2', 'category3'] } });
        expect(transactions.updateMany).toHaveBeenCalledWith(
            { type: { $in: ['category2', 'category3'] } },
            { $set: { type: 'category1' } }
        );
    });

    //! critical test when success but count==types.length

    test('should delete categories and update transactions, case types.lenght == count', async () => {
        const req = {
            body: {
                types: ['category1', 'category2'],
            },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        categories.count.mockResolvedValue(2);
        categories.find.mockResolvedValue([
            { type: 'category1' },
            { type: 'category2' },
        ]);

        categories.findOne.mockResolvedValue({ type: 'category1' });

        const deleteManyResult = {
            deletedCount: 1,
        };

        categories.deleteMany.mockResolvedValue(deleteManyResult);

        const updateManyResult = {
            modifiedCount: 3,
        };
        transactions.updateMany.mockResolvedValue(updateManyResult);



        await controller.deleteCategory(req, res);

        expect(res.json).toHaveBeenCalledWith({ data:{
            message: 'Category deleted successfully',
            count: updateManyResult.modifiedCount,
        }
        });
        expect(categories.find).toHaveBeenCalledWith({ type: { $in: ['category1', 'category2'] } });
        expect(categories.deleteMany).toHaveBeenCalledWith({ type: { $in: ['category2'] } });
        expect(transactions.updateMany).toHaveBeenCalledWith(
            { type: { $in: ['category2'] } },
            { $set: { type: 'category1' } }
        );
    });

})


describe("getCategories", () => {
    beforeEach(() => {
        categories.find.mockClear();
        verifyAuth.mockClear();
    });


    test('should return all categories with status 200', async () => {

        verifyAuth.mockReturnValue({ flag: true });

        const categoriesData = [
            { type: 'Category 1', color: 'Red' },
            { type: 'Category 2', color: 'Blue' },
        ];

        const req = {};
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: 'message' }

        };


        categories.find.mockResolvedValue(categoriesData);

        await controller.getCategories(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { type: 'Category 1', color: 'Red' },
                { type: 'Category 2', color: 'Blue' },
            ],
            refreshedTokenMessage: 'message',
        });
        expect(verifyAuth).toHaveBeenCalled();

    });
    test('should return 401 if not authenticated as a simple user', async () => {
        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });

        const req = {};
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: 'message' },
        };

        await controller.getCategories(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(verifyAuth).toHaveBeenCalled();
    });

    test('should return 500 if an error occurs', async () => {
        verifyAuth.mockReturnValue({ flag: true });

        const error = new Error('Database error');
        categories.find.mockRejectedValue(error);

        const req = {};
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: 'message' },
        };

        await controller.getCategories(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith('Database error');
        expect(verifyAuth).toHaveBeenCalled();
    });


});

describe("createTransaction", () => {
    beforeEach(() => {
        User.findOne.mockClear();
        categories.findOne.mockClear();
        transactions.prototype.save.mockClear();
        verifyAuth.mockClear()
    });

    test('should return 401 if not authenticated as user', async () => {
        const req = {
            body: { username: 'testuser', amount: 100, type: 'testtype' },
            params: {username:'testuser'}
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });

        await controller.createTransaction(req, res);

       // expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'User', username: 'testuser' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 401 if username passed to route is different from username in the body', async () => {
        const req = {
            params: { username: 'testuser' },
            body: { username: 'differentuser', amount: 100, type: 'testtype' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: false ,cause: "User's username is different from the request"});

        await controller.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 400 if required parameters are missing', async () => {
        const req = {
            path: `/users/testuser/transactions` ,
            params: { username: 'testuser' },
            body: { username: 'testuser' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        await controller.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'not enough parameters' });
    });

    test('should return 400 if username, amount, or type are invalid', async () => {
        const req = {
            path: `/users/testuser/transactions`,
            params: { username: 'testuser' },
            body: { username: 'testuser', amount: '', type: '' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        await controller.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'username, amount or type are invalid' });
    });
    test('should return 400 if amount is not a number', async () => {
        const req = {
            path: `/users/testuser/transactions`,
            params: { username: 'testuser' },
            body: { username: 'testuser', amount: 'invalid', type: 'testtype' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        await controller.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'amount is not a number' });
    });

    test('should return 400 if username or category type does not exist', async () => {
        const req = {
            params: { username: 'testuser' },
            body: { username: 'testuser', amount: 100, type: 'testtype' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        User.findOne.mockResolvedValue(null);
        categories.findOne.mockResolvedValue(null);

        await controller.createTransaction(req, res);

    })
    test('should return 400 if amount is not a number', async () => {
        const req = {
            path: `/users/testuser/transactions`,
            params: { username: 'testuser' },
            body: { username: 'testuser', amount: 'invalid', type: 'testtype' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        await controller.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'amount is not a number' });
    });


    test('should return 400 if username or category type does not exist', async () => {
        const req = {
            path: `/users/testuser/transactions`,
            params: { username: 'testuser' },
            body: { username: 'testuser', amount: 100, type: 'testtype' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: true });

        User.findOne.mockResolvedValue(null);
        categories.findOne.mockResolvedValue(null);

        await controller.createTransaction(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: { $eq: 'testuser' } });
        //expect(categories.findOne).toHaveBeenCalledWith({ type: { $eq: 'testtype' } });
        //not reached because of logical OR || , bitwise OR | will reach it but it's trash
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Username or category type does not exist' });
    });


    test('should create a new transaction and return the data', async () => {
        const req = {
            path: `/users/testuser/transactions`,
            params: { username: 'testuser' },
            body: { username: 'testuser', amount: 100, type: 'testtype' },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: 'message' },
        };

        verifyAuth.mockReturnValue({ flag: true });

        User.findOne.mockResolvedValue({});
        categories.findOne.mockResolvedValue({});
        transactions.prototype.save.mockResolvedValue({
            username: 'testuser',
            amount: 100,
            type: 'testtype',
            date: '2023-06-01',
        });

        await controller.createTransaction(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: { $eq: 'testuser' } });
        expect(categories.findOne).toHaveBeenCalledWith({ type: { $eq: 'testtype' } });
        expect(transactions.prototype.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {
                username: 'testuser',
                amount: 100,
                type: 'testtype',
                date: '2023-06-01',
            },
            refreshedTokenMessage: 'message',
        });
    });




});


describe("getAllTransactions", () => {

    test("should return a 401 error for a non-admin user", async () => {
        const req = {};
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({ flag: false, cause: "Unauthorized" });

        await controller.getAllTransactions(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
    
    test("should return a 500 error if a generic error occurs", async () => {
        const req = {};
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockImplementation(()=> { throw new Error('some error')});

        await controller.getAllTransactions(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith('some error');
    });
    test("should return all transactions with category information for an admin user", async () => {
        const req = {};
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" },
        };

        verifyAuth.mockReturnValue({ flag: true });

        const transactionsResult = [
            {
                _id: "1",
                username: "Mario",
                amount: 100,
                type: "food",
                date: "2023-05-19T00:00:00",
                categories_info: { color: "red" },
            },
            {
                _id: "2",
                username: "Mario",
                amount: 70,
                type: "health",
                date: "2023-05-19T10:00:00",
                categories_info: { color: "green" },
            },
            {
                _id: "3",
                username: "Luigi",
                amount: 20,
                type: "food",
                date: "2023-05-19T10:00:00",
                categories_info: { color: "red" },
            },
        ];

        transactions.aggregate.mockResolvedValue(transactionsResult);

        await controller.getAllTransactions(req, res);

        expect(transactions.aggregate).toHaveBeenCalledWith([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info",
                },
            },
            { $unwind: "$categories_info" },
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                {
                    _id: "1",
                    username: "Mario",
                    amount: 100,
                    type: "food",
                    date: "2023-05-19T00:00:00",
                    color: "red",
                },
                {
                    _id: "2",
                    username: "Mario",
                    amount: 70,
                    type: "health",
                    date: "2023-05-19T10:00:00",
                    color: "green",
                },
                {
                    _id: "3",
                    username: "Luigi",
                    amount: 20,
                    type: "food",
                    date: "2023-05-19T10:00:00",
                    color: "red",
                },
            ],
            refreshedTokenMessage: "message",
        });
    });
})

describe("getTransactionsByUser", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return a 400 error if the username passed as a route parameter does not represent a user in the database", async () => {
        const req = {
            params: { username: "InvalidUser" },
            query: {
                date: "2023-05-19",
                amount: "50:100",
            },
            cookies: {},
            url:"/api/transactions/users/Mario"
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockReturnValue({flag: true})
        User.findOne.mockResolvedValue(null);

        await controller.getTransactionsByUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "InvalidUser" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "User passed as a route parameter not found" });
    });


    test("should return filtered transactions with category information for a user accessing /api/users/:username/transactions route", async () => {
        const req = {
            params: { username: "Mario" },
            query: {
                date: "2023-05-19",
                amount: "50:100",
            },
            url: "/api/users/Mario/transactions",
            cookies: {}
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" },
        };

        verifyAuth.mockReturnValue({ flag: true });

        User.findOne.mockResolvedValue({ username: "Mario" });
        
        const transactionsResult = [
            {
                username: "Mario",
                categories_info: [{ type: "food", color: "red" }],
                amount: 70,
                date: "2023-05-19T10:00:00",
            },
        ];

        transactions.aggregate.mockResolvedValue(transactionsResult);

        handleDateFilterParams.mockReturnValue({
            date: { $gte: new Date("2023-05-19T00:00:00.000Z"), $lte: new Date("2023-05-20T23:59:59.000Z") },
        });
        handleAmountFilterParams.mockReturnValue({
            amount: { $gte: 50, $lte: 100 },
        });

        await controller.getTransactionsByUser(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "User", username: "Mario" });
        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(handleDateFilterParams).toHaveBeenCalledWith(req);
        expect(handleAmountFilterParams).toHaveBeenCalledWith(req);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                {
                    username: "Mario",
                    type: "food",
                    amount: 70,
                    date: "2023-05-19T10:00:00",
                    color: "red",
                },
            ],
            refreshedTokenMessage: "message",
        });
    });

            //!coverage
    test("should return error 401 for a non authorized user in user route /api/transactions/users/:username route", async () => {
        const req = {
            params: { username: "Mario" },
            query: {
                date: "2023-05-19",
                amount: "50:100",
            },
            url: "/api/users/Mario/transactions",
            cookies: { refreshToken: "userRefreshToken" },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" },
        };

        User.findOne.mockResolvedValue({ username: "Mario" });

        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });

        await controller.getTransactionsByUser(req,res);
      
       
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
             error: 'Unauthorized'
        });
    })


    test("should return error 401 for an user accessing admin route /api/transactions/users/:username route", async () => {
        const req = {
            params: { username: "Mario" },
            query: {
                date: "2023-05-19",
                amount: "50:100",
            },
            url: "/api/transactions/users/Mario",
            cookies: { refreshToken: "adminRefreshToken" },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" },
        };

        User.findOne.mockResolvedValue({ username: "Mario" });

        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });

        await controller.getTransactionsByUser(req,res);
      
       
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
             error: 'Unauthorized'
        });
    })

    test("should return filtered transactions with category information for an admin accessing /api/transactions/users/:username route", async () => {
        const req = {
            params: { username: "Mario" },
            query: {
                date: "2023-05-19",
                amount: "50:100",
            },
            url: "/api/transactions/users/Mario",
            cookies: { refreshToken: "adminRefreshToken" },
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" },
        };

        verifyAuth.mockReturnValue({ flag: true });
        User.findOne.mockResolvedValue({ username: "Mario" });

        const transactionsResult = [
            {
                username: "Mario",
                categories_info: [{ type: "food", color: "red" }],
                amount: 70,
                date: "2023-05-19T10:00:00",
            },
        ];

        transactions.aggregate.mockResolvedValue(transactionsResult);

        await controller.getTransactionsByUser(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });

        expect(transactions.aggregate).toHaveBeenCalledWith([
            {
                $match: { username: "Mario" },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info",
                },
            },
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                {
                    username: "Mario",
                    type: "food",
                    amount: 70,
                    date: "2023-05-19T10:00:00",
                    color: "red",
                },
            ],
            refreshedTokenMessage: "message",
        });
    })
    test("should return a 500 error if an error occurs during the operation", async () => {
        const req = {
            params: { username: "Mario" },
            url: "/api/users/Mario/transactions",
            query: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        verifyAuth.mockImplementation(() => {
            throw new Error("Some error occurred");
        });

        await controller.getTransactionsByUser(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "User", username: "Mario" });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith("Some error occurred");
    });

})


describe("getTransactionsByUserByCategory", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });


    test("should return filtered transactions with category information for a user accessing /api/users/:username/transactions/category/:category route", async () => {
        const req = {
            params: { username: "Mario", category: "food" },
            url: "/api/users/Mario/transactions/category/food",
            cookies: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" },
        };

        User.findOne.mockResolvedValue({ username: "Mario", role: "Regular" });
        verifyAuth.mockReturnValue({ flag: true });

        const transactionsResult = [
            {
                username: "Mario",
                categories_info: [{ type: "food", color: "red" }],
                amount: 100,
                date: "2023-05-19T00:00:00",
            },
        ];

        transactions.aggregate.mockResolvedValue(transactionsResult);

        await controller.getTransactionsByUserByCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, {
            authType: "User",
            username: "Mario",
        });
        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(transactions.aggregate).toHaveBeenCalledWith([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info",
                },
            },
            {
                $match: {
                    username: "Mario",
                    type: "food",
                },
            },
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                {
                    username: "Mario",
                    type: "food",
                    amount: 100,
                    date: "2023-05-19T00:00:00",
                    color: "red",
                },
            ],
            refreshedTokenMessage: "message",
        });
    });

    test("should return a 400 error if the category does not exist", async () => {
        const req = {
            params: { username: "Mario", category: "nonexistent" },
            url: "/api/users/Mario/transactions/category/nonexistent",
            cookies: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        User.findOne.mockResolvedValue({ username: "Mario", role: "Regular" });
        categories.findOne.mockResolvedValue(null);

        await controller.getTransactionsByUserByCategory(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(categories.findOne).toHaveBeenCalledWith({ type: "nonexistent" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Category not found",
        });
    });

    test("should return a 400 error if the user does not exist", async () => {
        const req = {
            params: { username: "NonexistentUser", category: "food" },
            url: "/api/users/NonexistentUser/transactions/category/food",
            cookies: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };
        categories.findOne.mockResolvedValue({})
        User.findOne.mockResolvedValue(null);

        await controller.getTransactionsByUserByCategory(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "NonexistentUser" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "User not found",
        });
    });

    test("should return a 401 error if an authenticated user is not the same as the user in the route (authType = User)", async () => {
        const req = {
            params: { username: "Mario", category: "food" },
            url: "/api/users/Mario/transactions/category/food",
            cookies: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };


        verifyAuth.mockReturnValue({ flag: false, cause: "Unauthorized" });

        await controller.getTransactionsByUserByCategory(req, res);

        
        expect(verifyAuth).toHaveBeenCalledWith(req, res, {
            authType: "User",
            username: "Mario",
        });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "Unauthorized",
        });
    });
    test("should return 401 if the user verifyUath fails for an user accessing user route", async () => {
        const req = {
            params: { username: "Mario", category: "food" },
            url: "/api/users/Mario/transactions/category/food",
            cookies: {},

        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" }
        };
        const transactionsResult = [
            {
                username: "Mario",
                categories_info: [{ type: "food", color: "red" }],
                amount: 100,
                date: "2023-05-19T00:00:00",
            },
        ];


        categories.findOne.mockResolvedValue({});
        User.findOne.mockResolvedValue({ username: "Mario", role: "Regular" });
        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });
        await controller.getTransactionsByUserByCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized'   });
    });

    test("should return 401 if the admin verify fals for an admin accessing admin route (authType = Admin)", async () => {
        const req = {
            params: { username: "Mario", category: "food" },
            url: "/api/transactions/users/Mario/category/food",
            cookies: {},

        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" }
        };
        const transactionsResult = [
            {
                username: "Mario",
                categories_info: [{ type: "food", color: "red" }],
                amount: 100,
                date: "2023-05-19T00:00:00",
            },
        ];


        categories.findOne.mockResolvedValue({});
        User.findOne.mockResolvedValue({ username: "RegularUser", role: "Regular" });
        User.findOne.mockResolvedValue({ username: "Administrator", role: "Admin" })
        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });
        transactions.aggregate.mockResolvedValue(transactionsResult);
        await controller.getTransactionsByUserByCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, {
            authType: "Admin"
        });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized'   });
    });

    test("should return transactions for an admin (authType = Admin)", async () => {
        const req = {
            params: { username: "Mario", category: "food" },
            url: "/api/transactions/users/Mario/category/food",
            cookies: {},

        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: { refreshedTokenMessage: "message" }
        };
        const transactionsResult = [
            {
                username: "Mario",
                categories_info: [{ type: "food", color: "red" }],
                amount: 100,
                date: "2023-05-19T00:00:00",
            },
        ];


        categories.findOne.mockResolvedValue({});
        User.findOne.mockResolvedValue({ username: "RegularUser", role: "Regular" });
        User.findOne.mockResolvedValue({ username: "Administrator", role: "Admin" })
        verifyAuth.mockReturnValue({ flag: true });
        transactions.aggregate.mockResolvedValue(transactionsResult);
        await controller.getTransactionsByUserByCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, {
            authType: "Admin"
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                {
                    username: "Mario",
                    type: "food",
                    amount: 100,
                    date: "2023-05-19T00:00:00",
                    color: "red",
                },
            ],
            refreshedTokenMessage: "message",
        });
    });

    test("should return a 500 error if an internal server error occurs", async () => {
        const req = {
            params: { username: "Mario", category: "food" },
            url: "/api/users/Mario/transactions/category/food",
            cookies: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };

        User.findOne.mockRejectedValue(new Error("Database connection error"));

        await controller.getTransactionsByUserByCategory(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith("Database connection error");
    });

});



describe("getTransactionsByGroup", () => { 
    beforeEach(() => {
        jest.clearAllMocks();
        
    });

    test("should return a 401 error if an authenticated user is not an admin accessing admin route", async () => {
        const req = {
          params: { name: "Family" },
          url: "/api/transactions/groups/Family",
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(() => res),
        };
      
        verifyAuth.mockReturnValue({ flag: false });
      
        await controller.getTransactionsByGroup(req, res);
      
        expect(verifyAuth).toHaveBeenCalledWith(req, res, {
          authType: "Admin",
        });
    
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("should return a 400 error if an authenticated user is an admin and the group does not exist", async () => {
        const req = {
          params: { name: "Family" },
          url: "/api/transactions/groups/Family",
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(() => res),
        };
      
        const groupEmailResult = [
            {
              members: [{ email: "member1@example.com" }, { email: "member2@example.com" }],
            },
          ];

        Group.findOne.mockResolvedValue(null);
        
        
        verifyAuth.mockReturnValue({ flag: true });
      
        await controller.getTransactionsByGroup(req, res);
      
       
        expect(Group.findOne).toHaveBeenCalledWith({ name: "Family" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Group not found" });
    });

    test("should return a 200 status if the admin search for an existing group", async () => {
        const req = {
            params: { name: "Family" },
            url: "/api/transactions/groups/Family",
            cookies: {},
          };
          const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: {refreshedTokenMessage:'message'}
          };
          
          const groupEmailResult = [
            {
              members: [{ email: "member1@example.com" }, { email: "member2@example.com" }],
            },
          ];

          const transAggregate = [
            {
              join_user: { username: 'user1' },
              join_trans: { amount: 100, date: new Date() },
              categories_info: { type: 'category1', color: 'blue' }
            },
            {
              join_user: { username: 'user2' },
              join_trans: { amount: 200, date: new Date() },
              categories_info: { type: 'category2', color: 'green' }
            }
          ]
        
          Group.findOne.mockResolvedValue({ name: "Family" });
          verifyAuth.mockReturnValue({ flag: true  });
          Group.aggregate.mockResolvedValue(transAggregate);

          await controller.getTransactionsByGroup(req, res);
        
       
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({ data:[
                 {
                   "amount": 100,
                   "color": "blue",
                   "date": dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
                   "type": "category1",
                   "username": "user1",
                 },
                 {
                  "amount": 200,
                  "color": "green",
                  "date": dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
                  "type": "category2",
                  "username": "user2",
                }
              ],
                refreshedTokenMessage: res.locals.refreshedTokenMessage });
        });
          

    test("should return a 400 error if the user is not an admin and the requested group does not exist", async () => {
        const req = {
            params: { name: "InvalidGroup" },
            url: "/api/groups/InvalidGroup/transactions",
            cookies: {},
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
        };
        
        Group.findOne.mockResolvedValue(null);
        
        await controller.getTransactionsByGroup(req, res);
        
        expect(Group.findOne).toHaveBeenCalledWith({ name: "InvalidGroup" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Group not found" });
    });
      
    test("should return a 401 error if an authenticated user is not part of the group and the user is not an admin", async () => {
    const req = {
        params: { name: "Family" },
        url: "/api/groups/Family/transactions",
        cookies: {},
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
    };
    
    const groupEmailResult = [
        {
            members: [{ email: "member1@example.com" }, { email: "member2@example.com" }],
        },
        ];

    Group.findOne.mockResolvedValue({ name: "Family" });
    
    Group.aggregate.mockResolvedValue(groupEmailResult);
    verifyAuth.mockReturnValue({ flag: false });
    
    await controller.getTransactionsByGroup(req, res);
    
    
    expect(Group.findOne).toHaveBeenCalledWith({ name: "Family" });
    expect(Group.aggregate).toHaveBeenCalledWith([
        {
        $match: { name: "Family" },
        },
        {
        $project: {
            _id: 0,
            members: "$members.email",
        },
        },
    ]);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
      
    test("should return a 200 status if the user search for its group", async () => {
        const req = {
            params: { name: "Family" },
            url: "/api/groups/Family/transactions",
            cookies: {},
          };
          const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            locals: {refreshedTokenMessage:'message'}
          };
          
          const groupEmailResult = [
            {
              members: [{ email: "member1@example.com" }, { email: "member2@example.com" }],
            },
          ];

          const transAggregate = [
            {
              join_user: { username: 'user1' },
              join_trans: { amount: 100, date: new Date() },
              categories_info: { type: 'category1', color: 'blue' }
            },
            {
              join_user: { username: 'user2' },
              join_trans: { amount: 200, date: new Date() },
              categories_info: { type: 'category2', color: 'green' }
            }
          ]
        
          Group.findOne.mockResolvedValue({ name: "Family" });
          Group.aggregate.mockResolvedValue(transAggregate);
          verifyAuth.mockReturnValueOnce({ flag: true  });

          await controller.getTransactionsByGroup(req, res);
        
       
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({ data:[
                 {
                   "amount": 100,
                   "color": "blue",
                   "date": dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
                   "type": "category1",
                   "username": "user1",
                 },
                 {
                  "amount": 200,
                  "color": "green",
                  "date": dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
                  "type": "category2",
                  "username": "user2",
                }
              ],
              refreshedTokenMessage: res.locals.refreshedTokenMessage });
        
    });
    
      
});



describe("getTransactionsByGroupByCategory", () => { 

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return a 401 error if a user access the admin route', async () => {
        const req = {
          params: { name: 'InvalidGroup', category: 'food' },
          url: '/api/transactions/groups/Family/category/food',
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
        
        verifyAuth.mockReturnValue({flag: false})
    
        await controller.getTransactionsByGroupByCategory(req, res);
       
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      });

    test('should return a 400 error if the admin search for a group that does not exist', async () => {
        const req = {
          params: { name: 'InvalidGroup', category: 'food' },
          url: '/api/transactions/groups/Family/category/food',
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        Group.findOne.mockResolvedValue(null);
        verifyAuth.mockReturnValue({flag: true})
    
        await controller.getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: 'InvalidGroup' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Group not found' });
      });
    
      test('should return a 400 error if the admin search for a category that does not exist', async () => {
        const req = {
          params: { name: 'Family', category: 'InvalidCategory' },
          url: '/api/transactions/groups/Family/category/food',
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        
        Group.findOne.mockResolvedValue({ name: 'Family' });

        const groupEmailResult = [
            {
              members: [{ email: "member1@example.com" }, { email: "member2@example.com" }],
            },
          ];

        Group.aggregate.mockResolvedValue(groupEmailResult);
        verifyAuth.mockReturnValue({flag: true});

        categories.findOne.mockResolvedValue(null);
    
        await controller.getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: 'Family' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'InvalidCategory' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
      });
    
      test('should return transactions for a specific group and category accessed by an admin', async () => {
        const req = {
          params: { name: 'Family', category: 'food' },
          url: '/api/transactions/groups/Family/category/food',
          cookies: {},
        };
        const res = {
           
           status: jest.fn(() => res),
           json: jest.fn(),
          
          locals: {refreshedTokenMessage: 'message'}
        };
    
        verifyAuth.mockReturnValue({ flag: true });

        Group.findOne.mockResolvedValue({ name: 'Family' });
        categories.findOne.mockResolvedValue({ type: 'food' });
    
    
        const transactionsResult = [
          {
            join_user: { username: 'Mario' },
            join_trans: { amount: 100, date: '2023-05-19' },
            categories_info: { type: 'food', color: 'red' },
          },
          {
            join_user: { username: 'Luigi' },
            join_trans: { amount: 20, date: '2023-05-19' },
            categories_info: { type: 'food', color: 'red' },
          },
        ];
    
        Group.aggregate.mockResolvedValue(transactionsResult);
    
        await controller.getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: 'Family' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
      
        
        expect(Group.aggregate).toHaveBeenCalledWith([
          {
            $lookup: {
              from: 'users',
              localField: 'members.email',
              foreignField: 'email',
              as: 'join_user',
            },
          },
          { $unwind: '$join_user' },
          {
            $lookup: {
              from: 'transactions',
              localField: 'join_user.username',
              foreignField: 'username',
              as: 'join_trans',
            },
          },
          { $unwind: '$join_trans' },
          {
            $lookup: {
              from: 'categories',
              localField: 'join_trans.type',
              foreignField: 'type',
              as: 'categories_info',
            },
          },
          { $unwind: '$categories_info' },
          {
            $match: {
              name: 'Family',
              'categories_info.type': 'food',
            },
          },
        ]);

        expect(res.json).toHaveBeenCalledWith({
          data: [
            {
              username: 'Mario',
              amount: 100,
              type: 'food',
              date: '2023-05-19T00:00:00',
              color: 'red',
            },
            {
              username: 'Luigi',
              amount: 20,
              type: 'food',
              date: '2023-05-19T00:00:00',
              color: 'red',
            },
          ],
          refreshedTokenMessage: 'message'
        });
    });


    test('should return a 400 error if the group does not exist', async () => {
        const req = {
          params: { name: 'InvalidGroup', category: 'food' },
          url: '/api/groups/InvalidGroup/transactions/category/food',
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        Group.findOne.mockResolvedValue(null);
    
        await controller.getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: 'InvalidGroup' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Group not found' });
      });
    
      test('should return a 400 error if the category does not exist', async () => {
        const req = {
          params: { name: 'Family', category: 'InvalidCategory' },
          url: '/api/groups/Family/transactions/category/InvalidCategory',
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        
        Group.findOne.mockResolvedValue({ name: 'Family' });

        const groupEmailResult = [
            {
              members: [{ email: "member1@example.com" }, { email: "member2@example.com" }],
            },
          ];

        Group.aggregate.mockResolvedValue(groupEmailResult);
        verifyAuth.mockReturnValue({flag: true})

        categories.findOne.mockResolvedValue(null);
    
        await controller.getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: 'Family' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'InvalidCategory' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
      });
    
      test('should return a 401 error for user not in the group', async () => {
        const req = {
          params: { name: 'Family', category: 'food' },
          url: '/api/groups/Family/transactions/category/food',
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        Group.findOne.mockResolvedValue({ name: 'Family' });
        categories.findOne.mockResolvedValue({ type: 'food' });
    
        
    
        const groupEmailResult = [
          {
            members: [{ email: 'member1@example.com' }, { email: 'member2@example.com' }],
          },
        ];
    
        Group.aggregate.mockResolvedValue(groupEmailResult);

        verifyAuth.mockReturnValue({ flag: false });
    
        await controller.getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: 'Family' });
        
      
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      });

      test('should handle errors and return a 500 status', async () => {
        const req = {
          params: { name: 'Family', category: 'food' },
          url: '/api/groups/Family/transactions/category/food',
          cookies: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        Group.findOne.mockRejectedValue(new Error('Database error'));
    
        await controller.getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: 'Family' });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith('Database error');
      });


        test('should return transactions for a specific group and category', async () => {
          const req = {
            params: { name: 'Family', category: 'food' },
            url: '/api/groups/Family/transactions/category/food',
            cookies: {},
          };
          const res = {
             
             status: jest.fn(() => res),
             json: jest.fn(),
            
            locals: {refreshedTokenMessage: 'message'}
          };
      
          Group.findOne.mockResolvedValue({ name: 'Family' });
          categories.findOne.mockResolvedValue({ type: 'food' });
      
          verifyAuth.mockReturnValue({ flag: true });
      
          const groupEmailResult = [
            {
              members: [{ email: 'member1@example.com' }, { email: 'member2@example.com' }],
            },
          ];
      
          Group.aggregate.mockResolvedValue(groupEmailResult);
      
          const transactionsResult = [
            {
              join_user: { username: 'Mario' },
              join_trans: { amount: 100, date: '2023-05-19' },
              categories_info: { type: 'food', color: 'red' },
            },
            {
              join_user: { username: 'Luigi' },
              join_trans: { amount: 20, date: '2023-05-19' },
              categories_info: { type: 'food', color: 'red' },
            },
          ];
      
          Group.aggregate.mockResolvedValue(transactionsResult);
      
          await controller.getTransactionsByGroupByCategory(req, res);
      
          expect(Group.findOne).toHaveBeenCalledWith({ name: 'Family' });
          expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        
          expect(Group.aggregate).toHaveBeenCalledWith([
            {
              $match: { name: 'Family' },
            },
            {
              $project: {
                _id: 0,
                members: '$members.email',
              },
            },
          ]);
          expect(Group.aggregate).toHaveBeenCalledWith([
            {
              $lookup: {
                from: 'users',
                localField: 'members.email',
                foreignField: 'email',
                as: 'join_user',
              },
            },
            { $unwind: '$join_user' },
            {
              $lookup: {
                from: 'transactions',
                localField: 'join_user.username',
                foreignField: 'username',
                as: 'join_trans',
              },
            },
            { $unwind: '$join_trans' },
            {
              $lookup: {
                from: 'categories',
                localField: 'join_trans.type',
                foreignField: 'type',
                as: 'categories_info',
              },
            },
            { $unwind: '$categories_info' },
            {
              $match: {
                name: 'Family',
                'categories_info.type': 'food',
              },
            },
          ]);
          expect(res.json).toHaveBeenCalledWith({
            data: [
              {
                username: 'Mario',
                amount: 100,
                type: 'food',
                date: '2023-05-19T00:00:00',
                color: 'red',
              },
              {
                username: 'Luigi',
                amount: 20,
                type: 'food',
                date: '2023-05-19T00:00:00',
                color: 'red',
              },
            ],
            refreshedTokenMessage: 'message'
          });
        });
    });
    


describe("deleteTransaction", () => { 
    beforeEach(() => {
        jest.clearAllMocks();
    });


    test('should return a 500 error if generic error occurs', async () => {
        const req = {
          params: { username: 'testUser' },
          body: { _id: 'transactionId' },
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
      
        verifyAuth.mockReturnValue({ flag: true });
      
        transactions.findOne.mockImplementation(() => { throw new Error('Some Error') });
      
        await controller.deleteTransaction(req, res);
      
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: 'transactionId' });
      //  expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith( 'Some Error' );
      });


      
    test('should return a 400 error if the provided transaction does not exist', async () => {
        const req = {
          params: { username: 'testUser' },
          body: { _id: 'transactionId' },
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
      
        verifyAuth.mockReturnValue({ flag: true });
      
        transactions.findOne.mockResolvedValue(null);
      
        await controller.deleteTransaction(req, res);
      
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'User', username: 'testUser' });
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: 'transactionId' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Transaction does not exist' });
      });


    test('should return a 400 error if the provided transaction does not belong to the user', async () => {
        const req = {
          params: { username: 'testUser' },
          body: { _id: 'transactionId' },
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
      
        verifyAuth.mockReturnValue({ flag: true });
      
        transactions.findOne.mockResolvedValueOnce({ transaction: 'test'});
        transactions.findOne.mockResolvedValue(null);
      
        await controller.deleteTransaction(req, res);
      
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'User', username: 'testUser' });
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: 'transactionId' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'This is not your transaction!' });
      });

    test('should delete the transaction if the user is authorized and the transaction exists', async () => {
        const req = {
          params: { username: 'testuser' },
          body: { _id: 'transactionId' },
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
          locals: { refreshedTokenMessage: 'Refreshed token' },
        };
    
        verifyAuth.mockReturnValue({ flag: true });
    
        transactions.findOne.mockResolvedValue({ _id: 'transactionId', username: 'testuser' });
        transactions.deleteOne.mockResolvedValue({});
    
        await controller.deleteTransaction(req, res);
    
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'User', username: 'testuser' });
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: 'transactionId' });
        expect(transactions.deleteOne).toHaveBeenCalledWith({ _id: 'transactionId' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Transaction deleted' },
          refreshedTokenMessage: 'Refreshed token',
        });
      });

      test('should return a 401 error if the user is not authorized', async () => {
        const req = {
          params: { username: 'testuser' },
          body: { _id: 'transactionId' },
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });
    
        await controller.deleteTransaction(req, res);
    
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'User', username: 'testuser' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      });
    
      test('should return a 400 error if the attribute in the body is missing', async () => {
        const req = {
          params: { username: 'testuser' },
          body: {},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        verifyAuth.mockReturnValue({ flag: true });
    
        await controller.deleteTransaction(req, res);
    
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'User', username: 'testuser' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'The attribute _id is missing!' });
      });

      test('should return a 400 error if the attribute in an empty string', async () => {
        const req = {
          params: { username: 'testuser' },
          body: {_id:''},
        };
        const res = {
          status: jest.fn(() => res),
          json: jest.fn(),
        };
    
        verifyAuth.mockReturnValue({ flag: true });
    
        await controller.deleteTransaction(req, res);
    
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'User', username: 'testuser' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Id is empty' });
      });

    
})
describe('deleteTransactions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

  test('should delete the transactions if the user is an admin and the ids are valid', async () => {
    const req = {
      body: { _ids: ['transactionId1', 'transactionId2'] },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
      locals: { refreshedTokenMessage: 'Refreshed token' },
    };

    verifyAuth.mockReturnValue({ flag: true });

    transactions.find.mockResolvedValue([
      { _id: 'transactionId1' },
      { _id: 'transactionId2' },
    ]);
    transactions.deleteMany.mockResolvedValue({});

    await controller.deleteTransactions(req, res);

    expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
    expect(transactions.find).toHaveBeenCalledWith({ _id: { $in: ['transactionId1', 'transactionId2'] } });
    expect(transactions.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['transactionId1', 'transactionId2'] } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: { message: 'Transactions deleted' },
      refreshedTokenMessage: 'Refreshed token',
    });
  });

  test('should return a 401 error if the user is not an admin', async () => {
    const req = {
      body: { _ids: ['transactionId1', 'transactionId2'] },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    verifyAuth.mockReturnValue({ flag: false, cause: 'Unauthorized' });

    await controller.deleteTransactions(req, res);

    expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  test('should return a 400 error if the attribute in the body is missing', async () => {
    const req = {
      body: {},
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    verifyAuth.mockReturnValue({ flag: true });

    await controller.deleteTransactions(req, res);

    expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'The attribute is missing!' });
  });

 
  test('should return a 400 error if one or more ids are not found', async () => {
    const req = {
      body: { _ids: ['transactionId1', 'transactionId2'] },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    verifyAuth.mockReturnValue({ flag: true });

    transactions.find.mockResolvedValue([{ _id: 'transactionId1' }]);
    transactions.deleteMany.mockResolvedValue({});

    await controller.deleteTransactions(req, res);

    expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
    expect(transactions.find).toHaveBeenCalledWith({ _id: { $in: ['transactionId1', 'transactionId2'] } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'One or more id not found' });
  });

  test('should return a 400 error if the id list is empty', async () => {
    const req = {
      body: { _ids: [] },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    verifyAuth.mockReturnValue({ flag: true });

    await controller.deleteTransactions(req, res);

    expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Id list is empty!' });
  });

  test('should return a 500 error if an internal server error occurs', async () => {
    const req = {
      body: { _ids: ['transactionId1', 'transactionId2'] },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  
    verifyAuth.mockImplementation(()=>{ throw new Error('Internal server error')});
  
  
    //transactions.find.mockRejectedValue(new Error('Internal server error'));
  
    await controller.deleteTransactions(req, res);
  
    expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
    //expect(transactions.find).toHaveBeenCalledWith({ _id: { $in: ['transactionId1', 'transactionId2'] } });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith('Internal server error');
  });

});
