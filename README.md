# Static Graph Creator

Static graph editor for GitHub Pages. The full graph state is stored in the URL hash, so the site needs no database or backend storage to share diagrams.

## Features

- Static hosting friendly
- Shareable links with graph data embedded in the URL
- Theme picker with preview cards
- SVG, PNG, and JSON export
- JSON graph model for easy editing
- GitHub Pages workflow that republishes on push

## Graph Format

```json
{
  "nodes": [
    { "id": "BrowserClient", "label": "BrowserClient" },
    { "id": "APIGateway", "label": "APIGateway" }
  ],
  "edges": [
    { "from": "BrowserClient", "to": "APIGateway" }
  ]
}
```

Optional edge labels are supported:

```json
{ "from": "A", "to": "B", "label": "calls" }
```

## GitHub Pages

1. Put this project in a GitHub repository.
2. Push to `main` or `master`.
3. In GitHub repo settings, set Pages source to `GitHub Actions`.
4. The workflow in `.github/workflows/pages.yml` will auto-deploy whenever `index.html` or any other tracked file is updated and pushed.

## Notes

- URL state is stored in the hash portion of the URL, so it is never sent to the server.
- Very large graphs can make the share URL long, though the content is compressed.
