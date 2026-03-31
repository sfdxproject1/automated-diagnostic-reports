const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFParse } = require('pdf-parse');

async function savePdfAsImages(pdfBuffer, reportId, prefix) {
    const outputDir = path.join(__dirname, 'uploads', reportId.toString());
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const parser = new PDFParse({ data: pdfBuffer });
        // The getImage method extracts images natively from the PDF without OS-level dependencies
        const result = await parser.getImage();
        await parser.destroy();

        const extractedImages = [];
        const hashCount = {};
        const pendingImages = [];

        // First Pass: Collect all images and count their hashes to identify repetitive structural logos/icons
        for (let i = 0; i < result.pages.length; i++) {
            const page = result.pages[i];
            if (page.images && page.images.length > 0) {
                for (let j = 0; j < page.images.length; j++) {
                    const img = page.images[j];
                    if (img.data) {
                        const hash = crypto.createHash('md5').update(img.data).digest('hex');
                        hashCount[hash] = (hashCount[hash] || 0) + 1;
                        
                        pendingImages.push({
                            pageIndex: i,
                            imgIndex: j,
                            data: img.data,
                            hash: hash
                        });
                    }
                }
            }
        }

        // Second Pass: Only save images that appear EXACTLY once (Unique defect images)
        for (const imgObj of pendingImages) {
            if (hashCount[imgObj.hash] === 1) {
                // Force the standard image schema: <prefix>_page_<X>_img_<Y>.png
                const fileName = `${prefix}_page_${imgObj.pageIndex + 1}_img_${imgObj.imgIndex + 1}.png`;
                const filePath = path.join(outputDir, fileName);
                
                fs.writeFileSync(filePath, imgObj.data);
                extractedImages.push(fileName);
            }
        }
        
        console.log(`System: Successfully extracted ${extractedImages.length} UNIQUE embedded images with prefix '${prefix}' for Report ${reportId}.`);
        return extractedImages;
    } catch (err) {
        console.error(`Image extraction failed for ${prefix}:`, err.message || err);
        return [];
    }
}

module.exports = { savePdfAsImages };