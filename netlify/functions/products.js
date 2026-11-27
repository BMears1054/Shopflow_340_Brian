const mysql = require('mysql2/promise');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    
    let connection;
    
    try { 
            const requiredVariables = [
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
        'DB_CA_CERT'
    ];

        for (const variable of requiredVariables) {
    if (!process.env[variable]?.trim()) {
        console.error(variable + ' is missing.');
        throw new Error('Required database configuration is missing.');
    }

    console.log(variable + ' is present.');
}
        if (process.env.DB_USER !== 'shopflow_reader') {
    throw new Error('Unauthorized database account configuration.');
}

if (process.env.DB_NAME !== 'shopflow') {
    throw new Error('Invalid database configuration.');
}
        const port = Number(process.env.DB_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid database port configuration.');
}


console.log('Environment variable validation passed.');
      const caCertificate = process.env.DB_CA_CERT
    .replace(/\\n/g, '\n')
    .trim();

console.log('Certificate format check:', {
    hasBegin: caCertificate.startsWith('-----BEGIN CERTIFICATE-----'),
    hasEnd: caCertificate.endsWith('-----END CERTIFICATE-----'),
    hasNewlines: caCertificate.includes('\n')
});  
 connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: caCertificate,
        rejectUnauthorized: true,
        verifyIdentity: true,
        minVersion: 'TLSv1.2'
    },
    connectTimeout: 10000
});
        console.log('Database connection established.');
        const [rows] = await connection.execute(
            'SELECT product_id, product_name, category, price, stock_quantity FROM products WHERE status = ?',
            ['Active']
        );
        console.log('Product query completed successfully.');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error('Database operation failed.', {
    code: error.code || 'UNKNOWN',
    errno: Number.isInteger(error.errno) ? error.errno : null
});
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database connection failed' })
        };
    } finally {
        if (connection) await connection.end();
    }
};
