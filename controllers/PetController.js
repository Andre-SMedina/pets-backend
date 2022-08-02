const Pet = require("../models/Pet");

//helpers
const getToken = require("../helpers/get-token");
const getUserByToken = require("../helpers/get-user-by-token");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports = class PetController {
  // create a pet
  static async create(req, res) {
    const { name, age, weight, color } = req.body;
    const images = req.files;
    const available = true;

    //images upload

    //validations
    if (!name || !age || !weight || !color || images.length === 0) {
      res.status(422).json({ message: "Preencha todos os campos!" });

      return;
    }

    // get pet owner
    const token = getToken(req);
    const user = await getUserByToken(token);

    //Post a pet
    const pet = new Pet({
      name,
      age,
      weight,
      color,
      available,
      images: [],
      user: {
        _id: user._id,
        name: user.name,
        image: user.image,
        phone: user.phone,
      },
      // adopter: {
      //   _id: "62d4323fa9eddad8e94a9164",
      //   name: "André",
      // },
    });

    images.map((image) => {
      pet.images.push(image.filename);
    });

    try {
      const newPet = await pet.save();
      res.status(201).json({ message: "Pet cadastrado com sucesso!", newPet });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }
  static async getAll(req, res) {
    //organiza na ordem crescente da data de cadastro
    const pets = await Pet.find().sort("-createdAt");

    res.status(200).json({ pets: pets });
  }

  static async getAllUserPets(req, res) {
    //get user from token
    const token = getToken(req);
    const user = await getUserByToken(token);

    const pets = await Pet.find({ "user._id": user._id }).sort("-createdAt");

    res.status(200).json({ pets });
  }

  static async getAllUserAdoptions(req, res) {
    //get user from token
    const token = getToken(req);
    const user = await getUserByToken(token);

    const pets = await Pet.find({ "adopter._id": user._id }).sort("-createdAt");

    res.status(200).json({ pets });
  }

  static async getPetById(req, res) {
    const id = req.params.id;

    //verifica se o ID é um objectId válido do mongoDB
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: "ID Inválido" });
      return;
    }

    //check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado!" });
      return;
    }

    res.status(200).json({
      pet: pet,
    });
  }

  static async removePetById(req, res) {
    const id = req.params.id;

    //verifica se o ID é um objectId válido do mongoDB
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: "ID Inválido" });
      return;
    }

    //check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado!" });
      return;
    }

    //verificar se o usuário logado registrou o pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message: "Apenas o dono do Pet pode removê-lo!",
      });
      return;
    }
    await Pet.findByIdAndRemove(id);

    res.status(200).json({ message: "Pet removido com sucesso!" });
  }

  static async updatePet(req, res) {
    const id = req.params.id;
    const { name, age, weight, color, available } = req.body;
    const images = req.files;
    const updatedData = {};

    //check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado!" });
      return;
    }

    //verificar se o usuário logado registrou o pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message: "Apenas o dono do Pet pode removê-lo!",
      });
      return;
    }

    if (!name || !age || !weight || !color) {
      res.status(422).json({ message: "Preencha todos os campos!" });

      return;
    } else {
      updatedData.name = name;
      updatedData.age = age;
      updatedData.weight = weight;
      updatedData.color = color;
      if (images.length > 0) {
        updatedData.images = [];
        images.map((image) => {
          updatedData.images.push(image.filename);
        });
      }
    }

    await Pet.findByIdAndUpdate(id, updatedData);

    res.status(200).json({ message: "Pet atualizado com sucesso!" });
  }

  static async schedule(req, res) {
    const id = req.params.id;

    //check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado!" });
      return;
    }

    //verificar se o usuário logado registrou o pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.equals(user._id)) {
      res.status(422).json({
        message: "Você não pode agendar uma visita para seu pet!",
      });
      return;
    }
    //verifica se o usuário já agendou uma visita
    if (pet.adopter) {
      if (pet.adopter._id.equals(user._id)) {
        res
          .status(422)
          .json({ message: "Você já agendou uma visita para este pet!" });
        return;
      }
    }
    // add user to pet
    pet.adopter = {
      _id: user._id,
      name: user.name,
      image: user.image,
    };

    await Pet.findByIdAndUpdate(id, pet);

    res.status(200).json({
      message: `A visita foi agendada com sucesso! Entre em contato com ${pet.user.name} pelo telefone ${pet.user.phone}`,
    });
  }

  static async concludeAdoption(req, res) {
    const id = req.params.id;

    //check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado!" });
      return;
    }

    //verificar se o usuário logado registrou o pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message: "Apenas o dono do Pet pode alterar!",
      });
      return;
    }

    pet.available = false;

    await Pet.findByIdAndUpdate(id, pet);

    res.status(200).json({
      message: "Parabéns! O processo de adoção foi finalizado com sucesso!",
    });
  }
};
