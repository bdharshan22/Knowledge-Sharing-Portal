const http = require('http');

console.log('Starting debug script...');

function get(path, callback) {
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api' + path,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`GET ${path} Status: ${res.statusCode}`);
            try {
                const json = JSON.parse(data);
                callback(null, json, res.statusCode);
            } catch (e) {
                callback(e, data, res.statusCode);
            }
        });
    });

    req.on('error', (e) => {
        callback(e);
    });
    req.end();
}

// 1. List Paths
get('/learning-paths', (err, data, status) => {
    if (err) return console.error('List Paths failed:', err);

    if (status !== 200) {
        console.error('List Paths returned status:', status);
        console.log('Response:', JSON.stringify(data, null, 2));
        return;
    }

    console.log(`Found ${data.length} paths.`);

    if (data.length > 0) {
        const firstId = data[0]._id;
        console.log(`Attempting to fetch details for ID: ${firstId}`);

        // 2. Get Details
        get(`/learning-paths/${firstId}`, (err, detail, status) => {
            if (err) return console.error('Detail fetch failed:', err);

            console.log('Detail Fetch Status:', status);
            if (status === 200) {
                console.log('Success! Path Title:', detail.title);
            } else {
                console.error('Failed to get details:', JSON.stringify(detail, null, 2));
            }
        });
    } else {
        console.log('No paths found to test details.');
    }
});
