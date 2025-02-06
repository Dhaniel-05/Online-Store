const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');

// Configuración de multer para manejar imágenes como buffer
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        
        // Convertir campos de imagen a base64 si es necesario
        const productsWithImages = rows.map(product => ({
            ...product,
            image: product.image ? product.image.toString('base64') : null
        }));

        res.json(productsWithImages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un nuevo producto
router.post('/', upload.single('image'), async (req, res) => {
    const { name, price, description } = req.body;
    const image = req.file ? req.file.buffer : null;

    try {
        const [result] = await db.query(
            'INSERT INTO products (name, price, image, description) VALUES (?, ?, ?, ?)',
            [name, price, image, description]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar producto
router.put('/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price, description } = req.body;
    const image = req.file ? req.file.buffer : null;

    try {
        const updateQuery = image 
            ? 'UPDATE products SET name=?, price=?, image=?, description=? WHERE id=?'
            : 'UPDATE products SET name=?, price=?, description=? WHERE id=?';
        
        const params = image 
            ? [name, price, image, description, id]
            : [name, price, description, id];

        await db.query(updateQuery, params);
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar producto
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buscar productos
router.get('/search', async (req, res) => {
    const { query } = req.query; // Obtén el término de búsqueda
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE name LIKE ? OR description LIKE ?', [`%${query}%`, `%${query}%`]);
        
        const productsWithImages = rows.map(product => ({
            ...product,
            image: product.image ? product.image.toString('base64') : null
        }));

        res.json(productsWithImages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;