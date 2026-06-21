const https = require('https');

const postData = JSON.stringify({
  orderData: {
    orderId: "DY-TEST-123",
    userDetails: {
      firstName: "Test",
      lastName: "User",
      phone: "9999999999",
      email: "test@example.com",
      address1: "123 Test St",
      pincode: "110001",
      city: "Delhi",
      state: "Delhi"
    },
    items: [],
    totalAmount: 100
  }
});

const options = {
  hostname: 'denim-dynasty-studio.vercel.app',
  port: 443,
  path: '/api/cashfree/create-order',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
