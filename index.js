const express = require('express');
const cloudinary = require('cloudinary').v2; // Make sure you have the 'cloudinary' package installed
const dotenv = require('dotenv')
const fs = require('fs')

dotenv.config()

const app = express();
const port = process.env.port || 4000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const rootFolderName = 'iamisigo'

const getFolders = async () => {
  const results = await cloudinary.api.sub_folders(rootFolderName);
  let folders = {}

  // setup folder structure
  results.folders.forEach(folder => {
    folders[folder.name] = []
  });

    // Fetch images
    const imageResources = await cloudinary.api.resources({ max_results: 200, resource_type: 'image' });

    // Fetch videos
    const videoResources = await cloudinary.api.resources({ max_results: 200, resource_type: 'video' });
  
    // Merge image and video resources
    const allResources = [...imageResources.resources, ...videoResources.resources];
  
    Object.keys(folders).forEach((folderName) => {
      const assets = allResources.filter(({ folder }) => folder === `${rootFolderName}/${folderName}`);
  
      folders[folderName] = assets;
    });
  
    return folders;
}

// Define an endpoint that retrieves folders from Cloudinary
app.get('/folders', async (req, res) => {
  try {
    const folders = await getFolders()

    res.json(folders); // Return folders as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching folders.' });
  }
});

const generateFile = async () => {
  const folders = await getFolders()

  const jsonData = JSON.stringify(folders, null, 2);
  fs.writeFileSync('folders.json', jsonData, 'utf8');
  console.log('JSON file generated successfully');
}

/**
 * process.argv helps check the flags passed to the command to start the server
 * it is an array, the flags begin from index 2
 */
const flag = process.argv[2]

if(flag && flag === '--file'){
  generateFile()
} else {
  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}