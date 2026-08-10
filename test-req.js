const http = require('http');

const data = JSON.stringify({
    email: 'test' + Date.now() + '@example.com',
    password: 'password',
    name: 'Test'
});

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const result = JSON.parse(body);
        console.log('Signup result:', result);
        
        const token = result.token;
        const projData = JSON.stringify({ title: 'Test Project' });
        
        const projReq = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/projects',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': projData.length,
                'Authorization': 'Bearer ' + token
            }
        }, (res2) => {
            console.log('Project create status:', res2.statusCode);
            let b2 = '';
            res2.on('data', d => b2 += d);
            res2.on('end', () => console.log('Project result:', b2));
            process.exit(0);
        });
        projReq.write(projData);
        projReq.end();
    });
});
req.write(data);
req.end();
