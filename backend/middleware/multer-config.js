const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Extensions valides
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_').split('.')[0];
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

const upload = multer({ storage: storage }).single('image');

module.exports = (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json(new Error(err.message));
        if (!req.file) return next();

        const originalPath = path.join('images', req.file.filename);
        const nameWithoutExt = req.file.filename.split('.')[0];
        const newFilename = nameWithoutExt + '.webp';
        const newPath = path.join('images', newFilename);

        try {
            const image = sharp(originalPath);
            await image
                .resize({
                    width: 206,
                    height: 260,
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .toFormat('webp', { quality: 80 })
                .toFile(newPath);

            fs.unlinkSync(originalPath); // Supprime l'image originale

            req.file.filename = newFilename;
            next();
        } catch (error) {
            return res.status(500).json(new Error("Erreur lors du traitement de l'image"));
        }
    });
};
