const authorModel = require("../model/authorModel");
const blogModel = require("../model/blogModel");
const { isValidObjectId } = require("mongoose");

//============route handler for creating blogs=================
const createBlog = async function (req, res) {
    try {
        const blogData = req.body;
        const authorId = blogData.authorId;

        if (Object.keys(blogData).length != 0) {

            //=====authorId validation========
            if (!authorId || authorId == "") {
                return res.status(400).send({ status: false, msg: "Author id is mandatory" });
            }
            if (!isValidObjectId(authorId)) {
                return res.status(404).send({ status: false, msg: "Invalid author id" });
            }
            const validAuthorId = await authorModel.findById(authorId);
            if (!validAuthorId) {
                return res.status(404).send({ status: false, msg: "Author does not exist with this id" });
            }

            if (!blogData.title || blogData.title == "") {
                return res.status(400).send({ status: false, msg: "Invalid request , title is required." });
            }
            blogData.title = blogData.title.trim();

            if (!blogData.body || blogData.body == "") {
                return res.status(400).send({ status: false, msg: "Invalid request , body is required." });
            }
            blogData.body = blogData.body.trim();

            if (!blogData.category || blogData.category == "") {
                return res.status(400).send({ status: false, msg: "Invalid request , category is required." });
            }

            //=====creating blogs after all edgecases passed=====
            const saveData = await blogModel.create(blogData);
            res.status(201).send({ status: true, msg: saveData });
        } else {
            return res.status(400).send({ status: false, msg: "invalid request" });
        }
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
};

//============route handler for fetching blogs=================
const getBlogs = async function (req, res) {
    try {
        let data = req.query;

        if (Object.keys(data).length != 0) {

            const { authorId, category, tags, subcategory } = data;
            if (authorId && !isValidObjectId(authorId)) {
                return res.status(400).send({ status: false, msg: "Invalid Author Id" });
            }
            data["isDeleted"] = false;
            data["isPublished"] = true;
            //=======performing fetch operation======
            let blogs = await blogModel.find({ ...data }).populate("authorId");//populating authorId

            if (blogs.length == 0) {
                return res.status(404).send({ status: false, msg: "Data not found." });
            }
            res.status(200).send({ status: true, data: blogs });
        } else {
            return res.status(400).send({ status: false, msg: "Please Give valid Data !! " });
        }
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message });
    }
};

//============route handler for updating blogs=================
const updateBlog = async function (req, res) {
    try {
        const data = req.body;
        const blogId = req.params.blogId;

        if (Object.keys(data).length != 0) {

            //=====performing update operation=======
            const updateData = await blogModel.findOneAndUpdate(
                { _id: blogId, isDeleted: false },
                {
                    $set: {
                        title: data.title,
                        body: data.body,
                        isPublished: true,
                        publishedAt: new Date(),
                    },
                    $addToSet: { tags: data.tags, subcategory: data.subcategory },//$addToSet operator adds a value to an array unless the value is already present
                },
                { new: true }
            );
            res.status(200).send({ status: true, msg: updateData });
        } else {
            return res.status(400).send({ status: false, msg: "please input something" });
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).send({ status: false, msg: err.message });
    }
};

//============route handler for deleting blogs by path param=================
const deleteBlog = async function (req, res) {
    try {
        const blogId = req.params.blogId;
        const checkBlogId = await blogModel.findById(blogId);

        //====validation for if blogId is not present in BD or if present is its isDeleted key is flagging out to true========
        if (!checkBlogId || checkBlogId.isDeleted == true) {
            return res.status(404).send({ status: false, msg: "Blog already deleted" });
        }

        //====performing deletion operation======
        const deleteBlog = await blogModel.findOneAndUpdate(
            { _id: blogId },
            { $set: { isDeleted: true, deletedAt: Date.now() } },
            { new: true }
        );
        res.status(200).send({ status: true, msg: "Successfully Deleted" });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message });
    }
};

//============route handler for deleting blogs by query param=================
const deleteBlogByFilter = async function (req, res) {
    try {
        const ReqData = req.query;

        //====performing deletion operation=======
        const DeleteBlog = await blogModel.updateMany(
            { ...ReqData, isPublished: false, isDeleted: false },
            { $set: { isDeleted: true } },
            { new: true }
        );

        if (DeleteBlog.matchedCount == 0) {//matchedCount is nothing but one of the return key of updateMany query
            return res.status(404).send({ status: false, msg: "Data  Already Deleted or Not Found !!" });
        };
        res.status(200).send({ status: true, msg: "Data Deleted Sucessfully !!" });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message });
    }
};


module.exports = { deleteBlog, deleteBlogByFilter, createBlog, getBlogs, updateBlog };
