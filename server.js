import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { generatePDFPreview } from './generatePdfPreview.js';
import crypto from 'crypto';
import 'dotenv/config'; // Load environment variables from .env file


const app = express();
const PORT = 5000;

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:3000'
}));


// Path to the inverted index JSON file
const INDEX_FILE = 'invertedIndex.json';

// Function to load the inverted index from the JSON file
const loadInvertedIndex = () => {
  if (fs.existsSync(INDEX_FILE)) {
    const indexData = fs.readFileSync(INDEX_FILE);
    return JSON.parse(indexData);
  } else {
    console.error('Inverted index file not found.');
    return {};
  }
};

// // Search API endpoint
app.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'No query provided' });
    }
  
    try {
      const invertedIndex = loadInvertedIndex(); // Load the inverted index
      const searchToken = query.toLowerCase(); // Normalize query to lowercase
      const filePaths = invertedIndex[searchToken] || []; // Get file paths from index for the query
  
      if (filePaths.length === 0) {
        return res.json([]); // Return empty array if no results
      }
  
      // Generate PDF previews for each file path
      const pdfData = await Promise.all(filePaths.map(async (encFilePath) => {
        var decipher = crypto.createDecipheriv(process.env.ALGO, process.env.KEY,process.env.SALT);
        const filePath = decipher.update(encFilePath, 'hex', 'utf8') + decipher.final('utf8');
        // const fullFilePath = path.join(PDF_FOLDER, filePath);
        const preview = await generatePDFPreview(filePath);
        return {
          fileName: path.basename(filePath),
          filePath: filePath,
          preview,
        };
      }));
    
      console.log("returning ", pdfData.length)
      res.json(pdfData); // Return the results with file paths and previews
    } catch (error) {
      console.error('Error searching PDF files:', error);
      res.status(500).send('Error searching PDF files');
    }
  });




// Start the server
app.listen(PORT, () => {
    console.clear()
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
