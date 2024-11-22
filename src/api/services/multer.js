const multer = require("multer");
const fs = require("fs");

// Common file filter for images
const imageFileFilter = (req, file, cb) => {
  if (
    !file.originalname.match(/\.(jfif|jpg|png|jpeg|gif|PNG|JPG|JFIF|webp)$/)
  ) {
    return cb(new Error("File must be an image"));
  }
  cb(undefined, true);
};

const userStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = `./images-users/`;
    fs.mkdirSync(path, { recursive: true });
    return cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = `./images-products/`;
    fs.mkdirSync(path, { recursive: true });
    return cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, "scannedProduct" + "-" + file.originalname);
  },
});

const uploadUserImage = multer({
  storage: userStorage,
  limits: { fileSize: 10000000000 },
  fileFilter: imageFileFilter,
});

const uploadProductImage = multer({
  storage: productStorage,
  limits: { fileSize: 10000000000 },
  fileFilter: imageFileFilter,
});

module.exports = { uploadUserImage, uploadProductImage };
