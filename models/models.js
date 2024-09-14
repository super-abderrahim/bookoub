const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true }, // Index on 'title'
  description: { type: String },
  price: { type: Number, required: true, index: true }, // Index on 'price'
  categories: { type: [String], required: true, index: true }, // Index on 'categories'
  languages: { 
    type: [String], 
    required: true, 
    enum: ['EN', 'AR', 'FR'],
    index: true // Index on 'languages'
  },
  type: { type: String, enum: ['single', 'collection'], required: true, index: true }, // Index on 'type'
  image: { type: String },  
  isMonthly: { type: Boolean, default: false }, 
  quantity: { type: Number, required: true, default: 0, index: true } // Index on 'quantity'
});

module.exports = mongoose.model('Book', bookSchema);
