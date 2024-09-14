const express = require("express");
const router = express.Router();
const Book = require("../models/models");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const dotenv = require('dotenv');
// In-memory storage for file buffer using multer
const storage = multer.memoryStorage();
const upload = multer({ storage });
dotenv.config();
// Cloudinary configuration (set up your Cloudinary credentials)
cloudinary.config({
  cloud_name:  process.env.CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET ,
  timeout: 60000 // 60 seconds timeout to prevent request timeouts
});

// GET all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET book by ID
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new book
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const languages = req.body.languages.split(",").map(lang => lang.trim());

    // Validate languages
    const validLanguages = ['EN', 'AR', 'FR'];
    const invalidLanguages = languages.filter(lang => !validLanguages.includes(lang));
    if (invalidLanguages.length > 0) {
      return res.status(400).json({ message: `Invalid languages: ${invalidLanguages.join(', ')}` });
    }

    // Collect book data from the request body
    const bookData = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      categories: req.body.categories.split(",").map(cat => cat.trim()), // Ensure categories is an array
      languages,
      type: req.body.type,
      quantity: req.body.quantity,
      isMonthly: req.body.isMonthly === 'true' // Convert string to boolean
    };

    // Handle Cloudinary upload if file is provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'books', timeout: 60000 }, // 60 seconds timeout
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload failed:", error);
              reject(new Error("Failed to upload image"));
            }
            resolve(result);
          }
        );
        stream.end(req.file.buffer); // Pass the buffer to Cloudinary
      });

      bookData.image = result.secure_url; // Store the image URL in book data
    }

    const newBook = new Book(bookData);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// PUT update a book
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const languages = req.body.languages.split(",").map(lang => lang.trim());

    // Validate languages
    const validLanguages = ['EN', 'AR', 'FR'];
    const invalidLanguages = languages.filter(lang => !validLanguages.includes(lang));
    if (invalidLanguages.length > 0) {
      return res.status(400).json({ message: `Invalid languages: ${invalidLanguages.join(', ')}` });
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      categories: req.body.categories.split(",").map(cat => cat.trim()), // Ensure categories is an array
      languages,
      type: req.body.type,
      quantity: req.body.quantity,
      isMonthly: req.body.isMonthly === 'true' // Convert string to boolean
    };

    // Handle Cloudinary upload if file is provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'books', timeout: 60000 }, // 60 seconds timeout
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload failed:", error);
              reject(new Error("Failed to upload image"));
            }
            resolve(result);
          }
        );
        stream.end(req.file.buffer); // Pass the buffer to Cloudinary
      });

      updates.image = result.secure_url; // Store the new image URL
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a book
// DELETE a book
router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if the book has an image and delete it from Cloudinary
    if (book.image) {
      // Extract the public ID from the Cloudinary URL
      const publicId = book.image.split('/').pop().split('.')[0]; // Assumes the image URL follows Cloudinary's pattern
      await cloudinary.uploader.destroy(`books/${publicId}`);
    }

    // Delete the book from the database
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book and associated image deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
