import fs from 'fs';

// Path to the inverted index JSON file
const INDEX_FILE = 'invertedIndex.json';

// Function to load the inverted index from the JSON file
const loadInvertedIndex = () => {
  if (fs.existsSync(INDEX_FILE)) {
    const indexData = fs.readFileSync(INDEX_FILE);
    return JSON.parse(indexData);
  } else {
    console.error('Inverted index file not found.');
    process.exit(1);
  }
};

// Function to search for a token in the inverted index
const searchInvertedIndex = (query) => {
  const invertedIndex = loadInvertedIndex();
  const searchToken = query.toLowerCase();
  
  if (invertedIndex[searchToken]) {
    console.log(`Token "${searchToken}" found in the following documents:`);
    console.log(invertedIndex[searchToken]);
  } else {
    console.log(`Token "${searchToken}" not found.`);
  }
};

// Get the search query from the command line arguments
const query = process.argv[2];
if (!query) {
  console.error('Please provide a search query.');
  process.exit(1);
}

// Perform the search
searchInvertedIndex(query);
