require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { stdout, stderr } = require('process');

// Function to build frontend
const buildFrontend = () => {
    return new Promise((resolve, reject) => {
        exec('npm run build', { cwd: path.join(__dirname, '..', 'frontend') }, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                console.log(stdout);
                resolve();
            }
        });
    });
};

// Function to copy frontend files
const copyBuildFiles = async () => {
    const sourceDir = path.join(__dirname, '..', 'frontend', 'dist');
    const destinationDir = path.join(__dirname, 'public');

    try {
        // First, empty the destination directory
        await fs.emptyDir(destinationDir);
        console.log('Destination directory emptied successfully!');

        // Then, copy files from the source directory to the destination directory
        await fs.copy(sourceDir, destinationDir);
        console.log('Files copied successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
};

// Function to start the backend server
const startServer = () => {
    exec('node ./bin/www', { cwd: __dirname }, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
        } else {
            console.log(stdout);
        }
    });
};

// Main function
const start = async () => {
    try {
        console.log('Building frontend...');
        await buildFrontend();
        console.log('Copying frontend build files...');
        await copyBuildFiles();
        // Environment variables are now loaded from ..env
        console.log('Starting server...');
        startServer();
        console.log('Server is running at http://localhost:3000/');
    } catch (error) {
        console.error('Error:', error);
    }
};

// Run the main function
start();
