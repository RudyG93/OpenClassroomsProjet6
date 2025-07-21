// sharp-config.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res, next) => {
    if (!req.file) return next();

    const originalPath = path.join('images', req.file.filename);
    const nameWithoutExt = req.file.filename.split('.')[0];
    const newFilename = nameWithoutExt + '.webp';
    const newPath = path.join('images', newFilename);

    try {
        await sharp(originalPath)
            .resize({
                width: 206,
                height: 260,
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .toFormat('webp', { quality: 80 })
            .toFile(newPath);

        fs.unlinkSync(originalPath);

        req.file.filename = newFilename;
        next();
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors du traitement de l'image" });
    }
};
