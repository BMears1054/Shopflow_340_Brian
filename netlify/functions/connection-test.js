const net = require('node:net');

exports.handler = async () => {
    const result = await new Promise((resolve) => {
        const socket = new net.Socket();

        function finish(result) {
            socket.destroy();
            resolve(result);
        }

        socket.setTimeout(5000);

        socket.once('connect', () => {
            finish('TCP connection successful');
        });

        socket.once('timeout', () => {
            finish('TCP connection timed out');
        });

        socket.once('error', () => {
            finish('TCP connection failed');
        });

        socket.connect({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT)
        });
    });

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ result })
    };
};
