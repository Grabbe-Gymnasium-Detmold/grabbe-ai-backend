import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default eventHandler(async (event) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStoreId = 'vs_Srj1RSWxAMKiHsUJAfxVm6Yq'; // Deine Vector Store ID
    const githubRepoUrl = 'https://github.com/Grabbe-Gymnasium-Detmold/grabbe-ai-dataset/tree/main/sheets';
    const tempFolder = './temp_sheets';

    try {
        const actionsLog = []; // Zum Speichern von Logs für die Rückgabe an GitHub Actions

        // Schritt 1: Alle Dateien aus dem Vector Store entfernen
        const listResponse = await openai.beta.vectorStores.files.list(vectorStoreId);
        for (const file of listResponse.data) {
            await openai.beta.vectorStores.files.del(vectorStoreId, file.id);
            actionsLog.push({ action: 'delete', fileId: file.id, status: 'success' });
        }


        const apiUrl = githubRepoUrl
            .replace('github.com', 'api.github.com/repos')
            .replace('/tree/main', '/contents');

        const githubResponse = await axios.get(apiUrl);
        const files = githubResponse.data;

        if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

        for (const file of files) {
            if (file.type === 'file') {
                const fileResponse = await axios.get(file.download_url, { responseType: 'arraybuffer' });
                const filePath = path.join(tempFolder, file.name);
                fs.writeFileSync(filePath, fileResponse.data);
                actionsLog.push({ action: 'download', fileName: file.name, status: 'success' });
            }
        }

        // Schritt 3: Neue Dateien in den Vector Store hochladen
        const uploadedFiles = [];

        for (const filename of fs.readdirSync(tempFolder)) {
            const filePath = path.join(tempFolder, filename);
            const fileStream = fs.createReadStream(filePath);

            const fileResponse = await openai.files.create({
                file: fileStream,
                purpose: 'assistants', // Angepasst an einen gültigen Zweck
            });

            const fileId = fileResponse.id;
            uploadedFiles.push(fileId);

            await openai.beta.vectorStores.files.create(
                vectorStoreId,
                {
                    file_id: fileId, // Korrekt: 'file_id' statt 'fileId'
                    chunking_strategy: {
                        type: 'static',
                        static: {
                            max_chunk_size_tokens: 165,
                            chunk_overlap_tokens: 25,
                        },
                    },
                }
            );

            actionsLog.push({ action: 'upload', fileName: filename, fileId, status: 'success' });
        }

        // Schritt 4: Temporäre Dateien löschen
        fs.rmSync(tempFolder, { recursive: true, force: true });
        actionsLog.push({ action: 'cleanup', folder: tempFolder, status: 'success' });

        // Erfolgreiche Rückgabe
        return { status: 'success', actionsLog };
    } catch (error) {
        // Fehlerhafte Rückgabe mit Fehlerdetails
        return {
            status: 'error',
            message: error.message,
            stack: error.stack,
        };
    }
});
