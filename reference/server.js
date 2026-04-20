const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4010;
const baseDir = __dirname;

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.png')).sort((a,b) => {
      // Sort SC 1.png, SC 2.png numerically
      const numA = parseInt(a.replace(/[^0-9]/g, ''));
      const numB = parseInt(b.replace(/[^0-9]/g, ''));
      return numA - numB;
    });
    
    let html = `
    <html><head><style>
      body { background: #111; color: #fff; font-family: sans-serif; padding: 20px; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
      .card { background: #222; border: 1px solid #444; border-radius: 8px; overflow: hidden; }
      .card img { width: 100%; height: auto; display: block; }
      .card .label { padding: 10px; font-size: 14px; text-align: center; }
    </style></head>
    <body><h1>Reference Benchmarks</h1><div class="grid">
    `;
    
    files.forEach(f => {
      // URL encode the filename to handle spaces
      const encodedF = encodeURIComponent(f);
      html += `<div class="card"><img src="/${encodedF}" /><div class="label">${f}</div></div>`;
    });
    
    html += `</div></body></html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.url.endsWith('.png')) {
    // Decode the URL to get the actual file path
    const filePath = path.join(baseDir, decodeURIComponent(req.url.substring(1)));
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Gallery running at http://localhost:${PORT}`);
});
