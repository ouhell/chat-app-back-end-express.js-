"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUsernameExistance = exports.checkEmailExistance = exports.signup = exports.login = void 0;
const UserModel_1 = __importDefault(require("../schema/user/UserModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = __importDefault(require("../error/ApiError"));
const EncryptionHandler_1 = __importDefault(require("../security/EncryptionHandler"));
const login = async (req, res, next) => {
    const identifier = req.body.identifier; // username or email
    const password = req.body.password;
    const user = await UserModel_1.default.findOne({
        $or: [{ username: identifier }, { email: identifier }],
    });
    // if user with given username or email does not exist in the database
    if (!user) {
        next(ApiError_1.default.unauthorized(`incorrect username`));
        return;
    }
    // if password does not match
    if (EncryptionHandler_1.default.decrypt(user.password) !== password) {
        next(ApiError_1.default.unauthorized(`incorrect password`));
        return;
    }
    const access_token = jsonwebtoken_1.default.sign({ _id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET);
    res.status(200).json({
        access_token,
        userId: user._id,
        userRole: user.role,
        username: user.username,
        profile_picture: user.profile_picture,
    });
};
exports.login = login;
const signup = async (req, res, next) => {
    let { username, personal_name, password, email } = req.body;
    password = EncryptionHandler_1.default.encrypt(password);
    const user = new UserModel_1.default({ username, personal_name, password, email });
    const createdUser = await user.save();
    return res.status(201).json(createdUser);
};
exports.signup = signup;
const checkEmailExistance = async (req, res, next) => {
    const checkEmail = req.params.value;
    const email = await UserModel_1.default.exists({
        email: checkEmail,
    });
    if (email)
        return res.status(200).json(true);
    return res.status(200).json(false);
};
exports.checkEmailExistance = checkEmailExistance;
const checkUsernameExistance = async (req, res, next) => {
    const checkUsername = req.params.value;
    const username = await UserModel_1.default.exists({
        username: checkUsername,
    });
    if (username)
        return res.status(200).json(true);
    return res.status(200).json(false);
};
exports.checkUsernameExistance = checkUsernameExistance;
