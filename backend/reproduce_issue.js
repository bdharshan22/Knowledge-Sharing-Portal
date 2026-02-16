const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('Attempting OPTIONS to http://localhost:5173/api/auth/google');
        const response = await axios.options('http://localhost:5173/api/auth/google', {
            token: 'dummy_token',
            action: 'login'
        }, {
            headers: {
                'Origin': 'http://localhost:5173'
            }
        });
        console.log('Success:', response.status, response.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Response:', error.response.status, error.response.data);
            console.log('Headers:', error.response.headers);
        } else {
            console.log('Error Code:', error.code);
            console.log('Error Message:', error.message);
            console.log('Full Error:', error);
        }
    }
}

testEndpoint();
