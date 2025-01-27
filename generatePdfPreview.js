import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import fs from 'fs';


export const generatePDFPreview = (pdfPath) => {
    console.log('Generating preview for PDF:', pdfPath);
  
    // Ensure the file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file does not exist');
    }
  
    // Read PDF file into a Uint8Array synchronously
    const data = new Uint8Array(fs.readFileSync(pdfPath));
  
    // Load the PDF document synchronously
    let pdf;
    pdfjsLib.getDocument({ data }).promise.then((loadedPdf) => {
      pdf = loadedPdf;
      
      // Get the first page of the PDF
      return pdf.getPage(1);
    }).then((page) => {
      // Set the scale for rendering
      const scale = 2;  // Adjust this scale to get higher resolution previews
      const viewport = page.getViewport({ scale });
  
      // Create a canvas to render the page to
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
  
      // Render the page on the canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
  
      return page.render(renderContext).promise;
    }).then(() => {
      // Return the image as a base64 string after rendering
      const base64Image = canvas.toDataURL();
      console.log("Preview generated successfully");
      return base64Image;
    }).catch((error) => {
      console.error('Error generating PDF preview:', error);
      throw error;
    });
  };