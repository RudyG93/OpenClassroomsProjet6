const Book = require('../models/book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    try {
        const bookObject = JSON.parse(req.body.book);
        delete bookObject._id;
        delete bookObject._userId;
        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        });

        book.save()
            .then(() => res.status(201).json({ message: 'Book added successfully!' }))
            .catch(error => res.status(400).json({ error }));
    } catch (error) {
        console.error("Parse or multer error:", error);
        res.status(400).json({ error: "Invalid book data or missing file" });
    }
};

exports.getAllBook = (req, res, next) => {
    Book.find().then(
        (books) => {
            res.status(200).json(books);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({
        _id: req.params.id
    }).then(
        (book) => {
            res.status(200).json(book);
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Book deleted !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject._userId;
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Book modified!' }))
                    .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.getBestRatedBooks = (req, res, next) => {
    Book.find().sort({ averageRating: -1 }).limit(3).then(
        (books) => {
            res.status(200).json(books);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

exports.rateBook = (req, res, next) => {
    const userId = req.auth.userId;
    const { rating } = req.body;

    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 0 and 5' });
    }

    Book.findOne({ _id: req.params.id }).then(book => {
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.userId === userId) {
            return res.status(403).json({ message: 'Creator cannot rate their own book' });
        }

        const alreadyRated = book.ratings.find(r => r.userId === userId);
        if (alreadyRated) {
            return res.status(403).json({ message: 'You have already rated this book' });
        }

        book.ratings.push({ userId, grade: rating });

        const total = book.ratings.reduce((sum, r) => sum + r.grade, 0);
        book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

        book.save()
            .then((updatedBook) => res.status(200).json(updatedBook))
            .catch(error => res.status(400).json({ error }));
    }).catch(error => {
        res.status(500).json({ error });
    });
};
