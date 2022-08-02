const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//import helpers
const createUserToken = require("../helpers/create-user-token");
const getToken = require("../helpers/get-token");
const getUserByToken = require("../helpers/get-user-by-token");

module.exports = class UserController {
  static async register(req, res) {
    const { name, email, phone, password, confirmpassword } = req.body;

    if (!name || !email || !phone || !password || !confirmpassword) {
      res.status(422).json({ message: "Preencha todos os campos!" });
      return;
    }

    if (password !== confirmpassword) {
      res.status(422).json({ message: "As senhas não são iguais!" });
      return;
    }

    // check if user exists
    const userExists = await User.findOne({ email: email });

    if (userExists) {
      res.status(422).json({ message: "E-mail já cadastrado!" });
      return;
    }

    // create password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    //create a user
    const user = new User({
      name,
      email,
      phone,
      password: passwordHash,
    });

    try {
      const newUser = await user.save();

      await createUserToken(newUser, req, res);

      return;
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(422).json({ message: "Preencha todos os campos!" });
      return;
    }

    // check if user exists
    const user = await User.findOne({ email: email });

    if (!user) {
      res.status(422).json({ message: "E-mail ou senha incorreto!" });
      return;
    }

    //check if password match with db password
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      res.status(422).json({ message: "E-mail ou senha incorreto!" });
      return;
    }

    await createUserToken(user, req, res);
  }
  static async checkUser(req, res) {
    let currentUser;

    if (req.headers.authorization) {
      const token = getToken(req);
      const decoded = jwt.verify(token, "nossosecret");

      currentUser = await User.findById(decoded.id);
      currentUser.password = undefined;
    } else {
      currentUser = null;
    }

    res.status(200).send(currentUser);
  }

  static async getUserById(req, res) {
    const id = req.params.id;
    //.select("-password") é para não mostrar a senha quando enviar o user
    const user = await User.findById(id).select("-password");

    if (!user) {
      res.status(422).json({ message: "Usuário não encontrado!" });

      return;
    }

    res.status(200).json({ user });
  }

  static async editUser(req, res) {
    const id = req.params.id;
    // check is user exists
    const token = getToken(req);
    const user = await getUserByToken(token);

    const { name, email, phone, password, confirmpassword } = req.body;

    if (req.file) {
      //adiciona o nome da imagem no banco
      user.image = req.file.filename;
    }

    if (!name || !email || !phone) {
      res.status(422).json({ message: "Preencha todos os campos!" });
      return;
    }

    //check if email has already taken
    const userExists = await User.findOne({ email: email });

    if (user.email !== email && userExists) {
      res.status(422).json({ message: "E-mail já cadastrado!" });
      return;
    }

    user.name = name;
    user.email = email;
    user.phone = phone;

    if (password !== confirmpassword) {
      res.status(422).json({ message: "As senhas não são iguais!" });
      return;
    } else if (password === confirmpassword && password != null) {
      // create password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      user.password = passwordHash;
    }

    try {
      // returns user update data
      const updatedUser = await User.findByIdAndUpdate(
        { _id: user._id },
        { $set: user },
        { new: true }
      );

      res.status(200).json({ message: "Usuário atualizado com sucesso!" });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }
};
