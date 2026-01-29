const fs = require("fs");
const path = require("path");

// Paths are relative to the repository root (parent of scripts/)
const rootDir = path.join(__dirname, "..");
const serversDir = path.join(rootDir, "servers");
const publicDir = path.join(rootDir, "public");
const outputFile = path.join(publicDir, "index.html");

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log("Created public directory");
}

// Get all subdirectories in servers/
const serverDirs = fs
  .readdirSync(serversDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

// Read README.md from each server directory
const servers = [];
for (const dir of serverDirs) {
  const readmePath = path.join(serversDir, dir, "README.md");
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, "utf-8");
    servers.push({
      name: dir,
      readme: content,
    });
    console.log(`Found README.md in: ${dir}`);
  } else {
    console.log(`No README.md found in: ${dir}`);
  }
}

// Convert markdown to basic HTML (simple conversion)
function markdownToHtml(markdown) {
  return (
    markdown
      // Remove markdown code fences if wrapping the whole content
      .replace(/^```markdown\n?/gm, "")
      .replace(/^```\n?$/gm, "")
      // Headers
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      // Blockquotes
      .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Unordered list items
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      // Ordered list items
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      // Wrap consecutive <li> in <ul>
      .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
      // Paragraphs (lines that aren't already HTML)
      .split("\n\n")
      .map((block) => {
        block = block.trim();
        if (
          block &&
          !block.startsWith("<h") &&
          !block.startsWith("<ul") &&
          !block.startsWith("<blockquote")
        ) {
          return `<p>${block}</p>`;
        }
        return block;
      })
      .join("\n")
  );
}

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Servers Index</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background-color: #f5f5f5;
      color: #333;
    }
    header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #ddd;
    }
    header h1 {
      margin: 0;
      color: #2c3e50;
    }
    .server-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .server-card h1 {
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }
    .server-card h2 {
      color: #34495e;
      margin-top: 1.5rem;
    }
    .server-card h3 {
      color: #7f8c8d;
    }
    blockquote {
      border-left: 4px solid #3498db;
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      background-color: #f8f9fa;
      color: #666;
    }
    code {
      background-color: #f4f4f4;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9em;
    }
    ul {
      padding-left: 1.5rem;
    }
    li {
      margin-bottom: 0.5rem;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    details {
      background: white;
      border-radius: 8px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    details[open] {
      margin-bottom: 2rem;
    }
    summary {
      padding: 1rem 1.5rem;
      cursor: pointer;
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
      list-style: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary::before {
      content: '▶';
      font-size: 0.75rem;
      transition: transform 0.2s;
    }
    details[open] summary::before {
      transform: rotate(90deg);
    }
    summary:hover {
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    .server-content {
      padding: 0 1.5rem 1.5rem;
      border-top: 1px solid #eee;
    }
    footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #ddd;
      color: #999;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>🎮 Game Servers</h1>
    <p>Index of available servers</p>
  </header>
  
  <main>
    ${servers
      .map(
        (server) => `
    <details>
      <summary>${server.name}</summary>
      <div class="server-content">
        ${markdownToHtml(server.readme)}
      </div>
    </details>`,
      )
      .join("\n")}
  </main>
  
  <footer>
    <p>Generated on ${new Date().toISOString().split("T")[0]}</p>
  </footer>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync(outputFile, html);
console.log(`\nGenerated ${outputFile}`);
console.log(`Total servers indexed: ${servers.length}`);
