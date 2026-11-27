const mysql = require('mysql2/promise');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    
  const email = event.queryStringParameters?.email?.trim().toLowerCase();

if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Valid email required' })
        };
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


const certificateBody = process.env.DB_CA_CERT
    .replace(/\\n/g, '\n')
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .replace(/\s/g, '');

const caCertificate =
    '-----BEGIN CERTIFICATE-----\n' +
    certificateBody.match(/.{1,64}/g).join('\n') +
    '\n-----END CERTIFICATE-----';

 
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
        
        const [rows] = await connection.execute(
            `SELECT customer_id, first_name, last_name, email,
                    customer_segment, lifetime_value, status, registration_date
             FROM customers
             WHERE email = ?`,
            [email.toLowerCase()]
        );
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows[0] || null)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Lookup failed' })
        };
    } finally {
    if (connection) {
        try {
            await connection.end();
        } catch {
            connection.destroy();
            console.error('Database connection cleanup failed.');
        }
    }
}
};
