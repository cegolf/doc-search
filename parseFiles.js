import 'dotenv/config'; // Load environment variables from .env file
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
// import '.server.js';

// Load folder path from environment variable
const folderPath = process.env.FOLDER_PATH || './pdfs'; // Default to './pdfs' if not defined

const INDEX_FILE = 'invertedIndex.json';  // JSON file to store the inverted index
const SCANNED_FILES_INDEX = 'scannedFiles.json'; // JSON file to store scanned PDFs

let invertedIndex = {};
let scannedFiles = [];

// Function to load the existing inverted index from a JSON file (if it exists)
export const loadInvertedIndex = () => {
  if (fs.existsSync(INDEX_FILE)) {
    const indexData = fs.readFileSync(INDEX_FILE);
    invertedIndex = JSON.parse(indexData)
    return JSON.parse(indexData);
  } else {
    console.error('Inverted index file not found.');
    return {};
  }
};

// Function to load the scanned files index from a JSON file (if it exists)
const loadScannedFilesIndex = () => {
  if (fs.existsSync(SCANNED_FILES_INDEX)) {
    const scannedData = fs.readFileSync(SCANNED_FILES_INDEX);
    scannedFiles = JSON.parse(scannedData);
    console.log('Scanned files index loaded from file.');
  } else {
    console.log('No existing scanned files index found, starting fresh.');
  }
};

// Function to save the current index to the JSON file
const saveInvertedIndex = () => {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(invertedIndex, null, 2));
  console.log('Inverted index saved to file.');
};

// Function to save the current scanned files index to the JSON file
const saveScannedFilesIndex = () => {
  fs.writeFileSync(SCANNED_FILES_INDEX, JSON.stringify(scannedFiles, null, 2));
  console.log('Scanned files index saved to file.');
};

// Function to generate a hash of the file (used to uniquely identify files)
const generateFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  return hash;
};

// Function to check if a file has already been scanned
const isFileScanned = (filePath) => {
  const fileHash = generateFileHash(filePath);
  return scannedFiles.includes(fileHash);
};

// Function to add a file to the scanned files index
const addFileToScannedIndex = (filePath) => {
  const fileHash = generateFileHash(filePath);
  if (!scannedFiles.includes(fileHash)) {
    scannedFiles.push(fileHash);
  }
};

// Function to extract text from a PDF file using pdfjs-dist
const extractTextFromPdf = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(dataBuffer); // Convert Buffer to Uint8Array
  
  // Use the Uint8Array when loading the PDF document
  const loadingTask = getDocument({ data: uint8Array });
  const pdfDocument = await loadingTask.promise;

  let fullText = '';

  // Loop through each page and extract the text content
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract and concatenate the text content from each page
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + ' ';
  }

  return fullText;
};

// Function to parse, tokenize, and index a PDF file
const parseAndIndexPdf = async (filePath) => {
  try {
    // Skip the file if it has already been scanned
    if (isFileScanned(filePath)) {
      // console.log(`Skipping already scanned PDF (${path.basename(filePath)}).`);
      return;
    }

    const text = await extractTextFromPdf(filePath);

    // Tokenization: split text using regex for non-word characters (anything other than letters and digits)
    let tokens = text
      .replace(/_/g, ' ')
      .toLowerCase() // Normalize to lowercase
      .split(/\s+|[^\w]+/i) // Split by any whitespace (\s+) or non-word characters ([^\w]+)
      .filter(token => token.length > 0); // Filter out empty tokens

    // Build the inverted index
    tokens.forEach(token => {
      if (!invertedIndex[token]) {
        invertedIndex[token] = []; // Create a new entry if the token doesn't exist
      }
      if (!invertedIndex[token].includes(filePath)) {
        invertedIndex[token].push(filePath); // Add the document (file path) to the token's list
      }
    });

    // Add the file to the scanned files index
    addFileToScannedIndex(filePath);

    console.log(`Indexed and added PDF (${path.basename(filePath)}).`);
  } catch (error) {
    console.error(`Error parsing PDF (${filePath}):`, error);
  }
};

// Recursive function to traverse directories and find PDFs
const traverseAndIndexPdfs = (folderPath) => {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading folder:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);

      // Check if it's a directory or a file
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error checking file status (${filePath}):`, err);
          return;
        }

        if (stats.isDirectory()) {
          // Recursively parse PDFs in subdirectory
          traverseAndIndexPdfs(filePath);
        } else if (path.extname(file).toLowerCase() === '.pdf') {
          // Parse and index the PDF file
          parseAndIndexPdf(filePath);
        }
      });
    });
  });
};

// Load the existing inverted index and scanned files index from file
loadInvertedIndex();
loadScannedFilesIndex();

// Parse and index all PDFs in the folder from the .env file
traverseAndIndexPdfs(folderPath);

// After indexing, save the index and scanned files
setTimeout(() => {
  saveInvertedIndex(); // Save the updated index
  saveScannedFilesIndex(); // Save the scanned files index

  // Example: Query the inverted index after saving
  // searchInvertedIndex('insurance'); // Replace 'example' with your query
}, 5000); // Wait 5 seconds to allow time for indexing to complete

