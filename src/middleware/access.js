const jwt = require('jsonwebtoken');
const blogModel = require("../model/blogModel");
const { isValidObjectId } = require("mongoose");

//=======Authentication Middleware==========
const authorAuthentication = function (req, res, next) {
    try {
        const token = req.headers["x-api-key"];
        if (!token) {
            return res.status(400).send({ status: false, msg: "Header token is required !" });
        }

        //=====the token will decode and will varify========
        jwt.verify(token, 'team@ak#tapas#Pu#pra#342@', function (err, decoded) { //callback function
            if (err) {
                return res.status(401).send({ status: false, msg: "Invalid Token !! Please Login Again..." });
            }
            else {
                //======setting decoded token to the request obj to make it globally accessible=====
                req.decodedToken = decoded;
                next();
            }
        });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message });
    }
};

//===============Authorization middleware for query param================
const authorQueryAuthorisation = async function (req, res, next) {
    try {
        const authorVerified = req.decodedToken.authorId;
        const authorQuery = req.query;
        const authorID = authorQuery.authorId;

        if (Object.keys(authorQuery).length != 0) {
            
            //=======checking the ObjectId of authorId is equal to the length of 24 or not =========
            if (authorQuery.authorId && !isValidObjectId(authorQuery.authorId)) {
                return res.status(400).send({ status: false, msg: "Invalid Author Id..." });
            }

            //========if it is equal to the lenght of 24 the then it will check inside the author collection in DB that authorId is valid authorId or not====== 
            if (authorQuery.authorId && isValidObjectId(authorQuery.authorId)) {
                const check = await blogModel.findOne({ authorId: authorID });
                if (!check) {
                    return res.status(404).send({ status: false, msg: "Entered wrong authorId..." });
                }
            }

            //=======performing authorization==========
            const blogData = await blogModel.find(authorQuery);
            const validAuthor = blogData.filter(ele => ele.authorId.toString() == authorVerified);
            if (validAuthor.length == 0) {
                return res.status(403).send({ status: false, msg: "Author is not authorised" });
            }

            if (validAuthor) {
                next();
            }
        } else {
            return res.status(400).send({ status: false, msg: "Please provide valid Information !!" });
        }
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message });
    }
};

//===========Authorization middleware for path param======================
const authorParamAuthorisation = async function (req, res, next) {
    try {
        const authorVerified = req.decodedToken.authorId;
        let blogID = req.params.blogId;

        if (Object.keys(req.params).length != 0) {
            
            //=====validation for blogId=====
            if (!blogID) {
                return res.status(400).send({ status: false, msg: "Blog ID is Required !!" });
            }
            //=======checking blogId is equal to the length of 24 or not========
            if (!isValidObjectId(blogID)) {
                return res.status(404).send({ status: false, msg: "Enter Vaild blogId.." });
            }

            //=====checking blogId is valid or not inside blog collection in DB=====
            const Id = await blogModel.findOne({ _id: blogID });
            if (!Id) {
                return res.status(404).send({ status: false, msg: "Entered wrong blogId .." });
            }

            //=======performing authorization====
            let blogs = await blogModel.findById(blogID).select({ authorId: 1, _id: 0 });
            let authorId = blogs.authorId;
            if (authorId != authorVerified.toString()) {
                return res.status(403).send({ status: false, msg: "Author not authorised !!" });
            }

            next();
        } else {
            return res.status(400).send({ status: false, msg: "Please provide valid Information !!" });
        }
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
};


module.exports = { authorAuthentication, authorParamAuthorisation, authorQueryAuthorisation };
