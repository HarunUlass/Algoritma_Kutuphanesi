const mongoose = require('mongoose');

// Complexity Schema
const complexitySchema = new mongoose.Schema({
  time: {
    type: Object,
    required: true
  },
  space: {
    type: String,
    required: true
  }
}, { _id: false });

// Code Example Schema
const codeExampleSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  }
}, { _id: false });

// Algorithm Schema
const algorithmSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  complexity: {
    type: complexitySchema,
    required: true
  },
  stability: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  steps: {
    type: [String],
    required: true
  },
  pros: {
    type: [String],
    required: true
  },
  cons: {
    type: [String],
    required: true
  },
  exampleCode: {
    type: codeExampleSchema,
    required: true
  }
}, { 
  timestamps: true,
  collection: 'Veri Yapıları'
});

console.log('Algoritma modeli "Veri Yapıları" koleksiyonunu kullanacak şekilde tanımlandı');

const Algorithm = mongoose.model('Algorithm', algorithmSchema);

module.exports = Algorithm; 