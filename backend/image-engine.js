const pdf2img = require('pdf-img-convert');
const fs = require('fs');
const path = require('path');

async function extractImages(pdfBuffer, reportId, type) {
    const outputDir = path.join(__dirname, 'public/uploads', reportId.toString());
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Converts each page to an image
    const images = await pdf2img.convert(pdfBuffer);
    
    const imagePaths = [];
    for (let i = 0; i < images.length; i++) {
        const fileName = `${type}_page_${i + 1}.png`;
        const filePath = path.join(outputDir, fileName);
        fs.writeFileSync(filePath, images[i]);
        imagePaths.push({ page: i + 1, path: `/uploads/${reportId}/${fileName}` });
    }
    return imagePaths;
}