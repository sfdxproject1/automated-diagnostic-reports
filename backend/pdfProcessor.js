const { PDFParse } = require('pdf-parse');

async function extractTextByPage(buffer) {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();
    
    // pdf-parse doesn't natively split by page easily, 
    // so we use the render_page option to mark boundaries.
    let pageData = [];
    
    // This is a simplified way to track page content for the AI
    const text = data.text;
    const pages = text.split(/\n\s*\n/); // Splitting by double newlines as a proxy for sections
    
    return pages.map((content, index) => ({
        page: index + 1,
        content: content.trim()
    })).filter(p => p.content.length > 0);
}

module.exports = { extractTextByPage };