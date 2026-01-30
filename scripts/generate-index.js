const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

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

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: false,
});

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Servers Index</title>
  <style>
    summary {
      cursor: pointer;
    }
    .game-servers {
      margin-left: 1em;
    }
    .server-content {
      margin-left: 1em;
    }
  </style>
</head>
<body>
  <header>
    <h1>Game Servers</h1>
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
            ${marked.parse(rewriteRelativeLinks(server.readme, game.name, server.name))}
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
