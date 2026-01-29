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

// Get all game directories in servers/
const gameDirs = fs
  .readdirSync(serversDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

// Read README.md from each server directory within each game directory
const games = [];
for (const gameDir of gameDirs) {
  const gamePath = path.join(serversDir, gameDir);
  const serverDirs = fs
    .readdirSync(gamePath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const servers = [];
  for (const serverDir of serverDirs) {
    const readmePath = path.join(gamePath, serverDir, "README.md");
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, "utf-8");
      servers.push({
        name: serverDir,
        readme: content,
      });
      console.log(`Found README.md in: ${gameDir}/${serverDir}`);
    } else {
      console.log(`No README.md found in: ${gameDir}/${serverDir}`);
    }
  }

  if (servers.length > 0) {
    games.push({
      name: gameDir,
      servers: servers,
    });
  }
}

const GITHUB_REPO_URL = "https://github.com/UnnamedGroupHub/servers";

// Rewrite relative links to point to GitHub repo
function rewriteRelativeLinks(markdown, gameName, serverName) {
  const basePath = `servers/${encodeURIComponent(gameName)}/${encodeURIComponent(serverName)}`;

  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    // Skip absolute URLs and anchors
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("#")
    ) {
      return match;
    }

    // Handle relative paths
    let cleanPath = url;
    if (cleanPath.startsWith("./")) {
      cleanPath = cleanPath.slice(2);
    }

    const fullPath = `${basePath}/${cleanPath}`;
    const githubUrl = `${GITHUB_REPO_URL}/tree/main/${fullPath}`;

    return `[${text}](${githubUrl})`;
  });
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
    details.game {
      background: #e8f4fc;
      border-radius: 8px;
      margin-bottom: 1rem;
      border: 1px solid #b8d4e8;
    }
    details.game[open] {
      margin-bottom: 2rem;
    }
    details.game > summary {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
      padding: 1rem 1.5rem;
    }
    details.game > summary:hover {
      background-color: #d4e9f7;
    }
    .game-servers {
      padding: 0 1rem 1rem;
    }
    .game-servers details {
      margin-left: 0.5rem;
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
    ${games
      .map(
        (game) => `
    <details class="game">
      <summary>${game.name}</summary>
      <div class="game-servers">
        ${game.servers
          .map(
            (server) => `
        <details>
          <summary>${server.name}</summary>
          <div class="server-content">
            ${markdownToHtml(rewriteRelativeLinks(server.readme, game.name, server.name))}
          </div>
        </details>`,
          )
          .join("\n")}
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
const totalServers = games.reduce((sum, game) => sum + game.servers.length, 0);
console.log(`\nGenerated ${outputFile}`);
console.log(`Total games: ${games.length}`);
console.log(`Total servers indexed: ${totalServers}`);
