import axios from 'axios';

const testApi = async () => {
    try {
        console.log('Fetching all paths...');
        const res = await axios.get('http://localhost:5001/api/learning-paths');
        const paths = res.data;
        console.log(`Found ${paths.length} paths.`);

        if (paths.length > 0) {
            const firstId = paths[0]._id;
            console.log(`Testing detail fetch for ID: ${firstId}`);
            try {
                const detailRes = await axios.get(`http://localhost:5001/api/learning-paths/${firstId}`);
                console.log('Detail fetch success!');
                console.log('Title:', detailRes.data.title);
            } catch (err: any) {
                console.error('Detail fetch failed:', err.message);
                if (err.response) {
                    console.error('Status:', err.response.status);
                    console.error('Data:', err.response.data);
                }
            }
        }
    } catch (err: any) {
        console.error('List fetch failed:', err.message);
    }
};

testApi();
