import express from 'express';
import bodyParser from 'body-parser';
import searchGoogleReviews from './data/google-reviews.js'
import fetchData from './data/g2.js';
import { insertProperties, checkIfProductExists } from "./mongoDB/products.js";

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

let urlGuardada = '';
let textGuardado = '';

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.post('/api/g2', async (req, res) => {
    const { query } = req.body;
    console.log("Query received:", query);

    try {
        // Chequear si ya tenemos los datos en la base de datos
        const existingData = await checkIfProductExists("extension_reviews", "products", query);

        if (existingData) {
            console.log(`Data for query "${query}" already exists in the database.`);
            res.json(existingData);
        } else {
            // Si no tenemos los datos, se hace la solicitud a la API externa
            const result = await fetchData(query);

            if (result.product_id !== null && result.product_id !== undefined) {
                await insertProperties("extension_reviews", "products", result);
                res.json(result);
            } else {
                console.log(`No valid data found for query "${query}". Skipping database insertion.`);
                res.status(400).json({ error: 'No valid data found' });
            }
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Ruta POST para guardar la URL
// app.post('/url/guardar-url', (req, res) => {
//     try {
//         const { url } = req.body;

//         if (url) {
//             urlGuardada = url;
//             console.log('URL successfully saved:', urlGuardada);
//         }

//     } catch (err) {
//         res.status(400).send('URL not received');
//         throw err;
//     }

// });

app.post('/texto/guardar-texto', (req, res) => {
    try {
        const { text } = req.body

        if (text) {
            textGuardado = text;
            console.log('Text successfully saved:', textGuardado);
        }

    } catch (err) {
        res.status(400).send('Text not received');
        throw err;
    }
})

app.post('/review/buscar-query', async (req, res) => {
    const { query } = req.body;
    console.log("Query received:", query);

    if (!query) {
        return res.status(400).json({ error: 'No query provided' });
    }

    try {
        const result = await searchGoogleReviews(query);
        console.log("Resultado:", result);
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error retrieving reviews' });
    }
});

// Ruta GET para obtener la última URL guardada
app.get('/ultima-url', (req, res) => {
    if (urlGuardada.length > 0) {
        lastUrl = urlGuardada;
        res.status(200).json({ url: urlGuardada }); // Enviar la última URL como respuesta JSON
    } else {
        res.status(404).send('No URL saved'); // Enviar error si no hay URL guardada
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

