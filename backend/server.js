const path = require('path');
const cors = require('cors');
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2/promise');
const { Groq } = require('groq-sdk');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const { savePdfAsImages } = require('./extractor');
const { extractTextByPage } = require('./pdfProcessor');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.post('/process-ddr', upload.array('files', 2), async (req, res) => {
    try {
        // SAFETY CHECK: Ensure files exist
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ error: "Please upload both reports." });
        }

        // 1. Create Draft Report to acquire `reportId` for image saving
        const [reportResult] = await db.execute(
            'INSERT INTO reports (property_name, issue_summary, probable_root_cause, overall_severity, additional_notes) VALUES (?, ?, ?, ?, ?)',
            ['Processing...', 'Processing...', 'Processing...', 'Processing...', 'Processing...']
        );
        const reportId = reportResult.insertId;

        // 2. Extract embedded images physically before LLM so LLM has the filenames
        const inspImages = await savePdfAsImages(req.files[0].buffer, reportId, 'insp'); 
        const thermImages = await savePdfAsImages(req.files[1].buffer, reportId, 'therm');
        const availableImages = [...inspImages, ...thermImages];

        // 3. Get structured text
        const inspectionPages = await extractTextByPage(req.files[0].buffer);
        const thermalPages = await extractTextByPage(req.files[1].buffer);

        // 4. Build the Prompt for Groq
        const prompt = `
        You are an Applied AI Builder. Merge these two site reports into one DDR.
        
        INSPECTION DATA: ${JSON.stringify(inspectionPages)}
        THERMAL DATA: ${JSON.stringify(thermalPages)}
        AVAILABLE EXTRACTED IMAGES: ${JSON.stringify(availableImages)}

        RULES:
        1. STRUCTURE: Output JSON with: property_name, issue_summary, root_cause, severity, additional_notes, and an observations[] array.
        2. OBSERVATION SCHEMA: Each object in the observations array MUST have these exact string keys: "area_name", "observation_text", "thermal_reading", "recommended_action", "source_page", a boolean "conflict_detected", and an "image_path" string.
        3. IMAGE MATCHING: Using the AVAILABLE EXTRACTED IMAGES list provided above (like insp_page_1_img_1.png), map the most relevant image filename to the "image_path" key for each observation based on the source page. If there is no specific image for that observation, output exactly "Image Not Available" for "image_path". Do NOT include unrelated images!
        4. CONFLICTS: If Inspection says "OK" but Thermal says "Hot", set "conflict_detected": true.
        5. MISSING: If data is missing for any field, use exactly "Not Available".
        6. LANGUAGE: Use simple, client-friendly language.
        `;

        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const ddr = JSON.parse(response.choices[0].message.content);

        // 5. Update the Draft Report with actual LLM output (Using Nullish Coalescing for safety)
        await db.execute(
            'UPDATE reports SET property_name=?, issue_summary=?, probable_root_cause=?, overall_severity=?, additional_notes=? WHERE id=?',
            [
                ddr.property_name ?? 'Not Available', 
                ddr.issue_summary ?? 'Not Available', 
                ddr.root_cause ?? 'Not Available', 
                ddr.severity ?? 'Not Available',
                ddr.additional_notes ?? 'Not Available',
                reportId
            ]
        );

        // 6. Insert Observations
        if (ddr.observations && Array.isArray(ddr.observations)) {
            for (let i = 0; i < ddr.observations.length; i++) {
                const obs = ddr.observations[i];
                
                // Map the LLM's chosen image string to the real path, or preserve 'Image Not Available'
                const finalImagePath = (!obs.image_path || obs.image_path === 'Image Not Available') 
                    ? 'Image Not Available' 
                    : `/uploads/${reportId}/${obs.image_path}`;
                
                // Update the object so the frontend receives the fully formed path
                ddr.observations[i].image_path = finalImagePath;

                await db.execute(
                    `INSERT INTO observations 
                    (report_id, area_name, observation_text, thermal_reading, image_path, recommended_action) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        reportId, 
                        obs.area_name ?? 'Not Available', 
                        obs.observation_text ?? 'Not Available', 
                        obs.thermal_reading ?? 'Not Available', 
                        finalImagePath, 
                        obs.recommended_action ?? 'Not Available'
                    ]
                );
            }
        }

        // 6. Final Single Response to Frontend
        res.json({ success: true, reportId: reportId, data: ddr });

    } catch (error) {
        console.error("SERVER ERROR:", error);
        // Only send response if it hasn't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));