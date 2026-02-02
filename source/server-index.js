import { serverIndex } from "./server-index.js";

const GITHUB_REPO_URL = "https://github.com/UnnamedGroupHub/servers";

function rewriteRelativeLinks(markdown, gameName, serverName) {
  const basePath = `servers/${encodeURIComponent(gameName)}/${encodeURIComponent(serverName)}`;

  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("#")
    ) {
      return match;
    }

    let cleanPath = url;
    if (cleanPath.startsWith("./")) {
      cleanPath = cleanPath.slice(2);
    }

    const fullPath = `${basePath}/${cleanPath}`;
    const githubUrl = `${GITHUB_REPO_URL}/tree/main/${fullPath}`;

    return `[${text}](${githubUrl})`;
  });
}

function renderContent() {
  const { games, generatedDate } = serverIndex;

  document.getElementById("generated-date").textContent = generatedDate;

  const contentHtml = games
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
              </details>
            `,
              )
              .join("\n")}
          </div>
        </details>
      `,
    )
    .join("\n");

  document.getElementById("content").innerHTML = contentHtml;
}

renderContent();
