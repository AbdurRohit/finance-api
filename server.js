// server.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id) {
  try {
    return ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
}

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get single transaction
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID format' });
    }
    
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, date, description, id } = req.body;
    
    // Check if ID is provided and valid
    if (!id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID format' });
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        id,
        amount: parseFloat(amount),
        date: new Date(date),
        description
      }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    
    // Check for duplicate ID error
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A transaction with this ID already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, description } = req.body;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID format' });
    }
    
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        date: new Date(date),
        description
      }
    });
    
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID format' });
    }
    
    await prisma.transaction.delete({
      where: { id }
    });
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
