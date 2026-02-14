
import fs from 'fs';
import path from 'path';

// Create a small test file
const testFile = 'test_upload_file.txt';
fs.writeFileSync(testFile, 'Hello world');

console.log('Created test file');

async function uploadFile() {
    const FormData = (await import('form-data')).default;
    const fetch = (await import('node-fetch')).default;

    const form = new FormData();
    form.append('file', fs.createReadStream('test.jpg'));

    // Note: we need to manually set login/token? The endpoint has authenticate middleware.
    // We can try to reproduce even 401, but the user is logged in.
    // To strictly test upload, we need authentication.
    // But wait, if I get 400 Bad Request, it might be BEFORE auth if auth middleware is not parsing body?
    // No, auth usually checks headers.

    // Let's first login to get token.
    try {
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '88001122', password: 'cargo123456' })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.tokens.accessToken;
        console.log('Got token');

        const res = await fetch('http://localhost:3001/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Let form-data set the Content-Type with boundary
                ...form.getHeaders()
            },
            body: form
        });

        console.log('Upload status:', res.status);
        const data = await res.json();
        console.log('Upload response:', data);

    } catch (e) {
        console.error(e);
    }
}

uploadFile();
