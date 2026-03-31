const http = require('http');
http.get('http://localhost:3000/api/health', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
}).on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});
