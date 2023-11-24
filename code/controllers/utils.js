import jwt from 'jsonwebtoken'
import dayjs from 'dayjs';


/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {
    let result = {date: {}};
    //this is to check the data format
    let patternDate = /^\d\d\d\d[-](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])$/

 

        //if none of the parameters are present return a empty object 
        if(!req.query.date && !req.query.from && !req.query.upTo) return {}

        //if there are many parameters it generates an error
        if(req.query.date&&(req.query.from||req.query.upTo)){
            throw new Error('Parameters are not valid'); 
        }else{
            //if one of these parameters is present it returns a filter, otherwise it returns an empty object
            //dayjs is used to convert the data format
        if(!req.query.from){
           if(req.query.upTo){
                if (!patternDate.test(req.query.upTo))throw new Error('Format upTo is not valid');    
                result ={date:{$lte: new Date(req.query.upTo+"T23:59:59.999Z")}}
            }
        }

        if(req.query.from&&req.query.upTo&&!patternDate.test(req.query.upTo)){
            throw new Error('Format upTo is not valid');
        }
        if(!patternDate.test(req.query.from)&&req.query.upTo&&req.query.from){
            throw new Error('Format from is not valid');
        }
        

            if(req.query.from){
                if (!patternDate.test(req.query.from))throw new Error('Format from is not valid');
            if (req.query.upTo){
                result = {date:{$gte: new Date(req.query.from+ "T00:00:00.000Z"), $lte: new Date(req.query.upTo+"T23:59:59.999Z")}}
            }else{
                result = {date:{$gte: new Date(req.query.from+ "T00:00:00.000Z")}}
            }
            }

            if(req.query.date){
                 if (!patternDate.test(req.query.date))
                    throw new Error("Format date is not valid");
                result= {date : {$gte : new Date(req.query.date+ "T00:00:00.000Z"),$lte : new Date(req.query.date+ "T23:59:59.999Z")}}
           
            }
        }
    
    return result
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {

    
    let result={}

    const cookie = req.cookies
    if (!cookie.accessToken || !cookie.refreshToken) {
        return { flag: false, cause: "Unauthorized" };
    }
    if(info.authType==='User'&&!info.username)return {flag:false, cause:"wrong route"}
    if(info.authType==='Group'&&!info.emails)return {flag:false, cause:"list of emails are empty"}
    
    try {
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return { flag: false, cause: "Token is missing information" }
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return { flag: false, cause: "Token is missing information" }
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return { flag: false, cause: "Mismatched users" };
        }
        switch(info.authType){
            case "Simple":
                return { flag: true, cause: "Authorized" }
            case "User":
                if(decodedRefreshToken.username!==info.username||decodedAccessToken.username!==info.username)
                    result={ flag: false, cause:"User's username is different from the request" }
                if(decodedRefreshToken.username===info.username && decodedAccessToken.username===info.username) 
                    result={ flag: true, cause: "User's username is equal from the request" }
                return result;
                
            case "Admin":
                if(decodedAccessToken.role!=="Admin"||decodedRefreshToken.role!=="Admin")
                    result={flag:false, cause:"Unauthorized"}
                if(decodedAccessToken.role==="Admin"&&decodedRefreshToken.role==="Admin")
                    result={flag:true, cause:"Authorized"}
                return result
            case "Group":
                for( const e of info.emails){
                    if(decodedAccessToken.email==e && decodedRefreshToken.email==e){
                        return {flag:true, cause:"Found user in the group"}
                    }
                }
                return{flag:false, cause:"the user is not part of this group"}
            
        }
        
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            try {
                const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                if (!refreshToken.username || !refreshToken.email || !refreshToken.role) {
                    return { flag: false, cause: "Token is missing information" }
                }
                switch(info.authType){
                    case "User": 
                               
                                if(refreshToken.username!==info.username) return { flag: false, message: "User's username in decodedRefreshToken  is different from the request" }
                                break;
                    case "Admin": 
                                if(refreshToken.role!=="Admin") return { flag: false, message: "User's role in decodedRefreshToken  is different from 'admin''" }
                                break;
                    case "Group":
                               
                                let flag=0;
                                for( const e of info.emails){
                                    if(refreshToken.email==e){
                                      flag=1;
                                    }
                                }
                                if(flag==0)return { flag: false, message: "the user is not part of this group" }
                                break;
                }
                result={}
                const newAccessToken = jwt.sign({
                    username: refreshToken.username,
                    email: refreshToken.email,
                    id: refreshToken.id,
                    role: refreshToken.role
                }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                const decodeNewAccessToken=jwt.verify(newAccessToken, process.env.ACCESS_KEY)
                res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                res.locals.refreshedTokenMessage = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
                switch(info.authType){
                    case "Simple":
                        result= { flag: true, cause: "Authorized" }
                    return result;
                    case "User":
                        if(decodeNewAccessToken.username===info.username)
                            result={ flag: true, cause: "User's username is equal from the request" }
                    return result;
                    case "Admin":
                        if(decodeNewAccessToken.role==="Admin")
                            result={flag:true, cause:"Authorized"}
                        return result;
                    
                    case "Group":
                        for( const e of info.emails){
                            if(decodeNewAccessToken.email==e && refreshToken.email==e){
                                result={flag:true, cause:"Found"}
                            }
                        }
                        return result;
                         
                }
               
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    return { flag: false, cause: "Perform login again" }
                } else {
                    return { flag: false, cause: err.name }
                }
            }
        } else {
            return { flag: false, cause: err.name };
        }
    }
}

/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {
  
    let result = {};
    const regexNumber = /^[0-9]*$/

    
    if(!req.query.min &&!req.query.max)return {}

    //for all parameters there is a check to see if amount is of numeric type
    if(req.query.min){
        let min = req.query.min
        if(min && !regexNumber.test(min))
        throw new Error("min parameter is not a number")
        result ={amount : {$gte : min}}
    }
    if(req.query.max){
        let max = req.query.max
        if(max && !regexNumber.test(max))
        throw new Error("max parameter is not a number")

        if(req.query.min){
        let min = req.query.min;
        result = {amount : {$gte : min, $lte : max}};
        }else{
        result ={amount : {$lte : max}};
        }
    }
    

    return result
   
}
