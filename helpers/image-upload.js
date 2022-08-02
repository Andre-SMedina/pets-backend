const multer = require("multer");
const path = require("path");

//Destination to store the images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "";

    //para saber se manda pra pasta users ou pets
    if (req.baseUrl.includes("users")) {
      folder = "users";
    } else if (req.baseUrl.includes("pets")) {
      folder = "pets";
    }

    cb(null, `public/images/${folder}`);
  },
  //para criar o nome do arquivo
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() +
        String(Math.floor(Math.random() * 1000)) +
        path.extname(file.originalname)
    );
  },
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter(req, file, cb) {
    //verifica se o arquivo é jpg ou png
    if (!file.originalname.match(/\.(png|jpg)$/)) {
      return cb(new Error("Por favor, envie apenas jpg ou png!"));
    }
    cb(undefined, true);
  },
});

module.exports = { imageUpload };
