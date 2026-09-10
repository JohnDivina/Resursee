#!/usr/bin/env python3
"""
Script to fetch starred GitHub repositories for user JohnDivina
and output clean structured JSON to src/data/github_starred_repos.json.
"""

import urllib.request
import json
import ssl
import sys
from pathlib import Path

def fetch_starred_repos(username="JohnDivina"):
    print(f"Fetching starred repositories for {username}...")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    url = f"https://api.github.com/users/{username}/starred?per_page=100"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Resursee-Directory-Fetcher",
            "Accept": "application/vnd.github+json",
        },
    )

    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            raw_data = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching starred repos from GitHub: {e}", file=sys.stderr)
        sys.exit(1)

    repos = []
    for r in raw_data:
        repos.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "fullName": r.get("full_name"),
            "owner": {
                "login": r.get("owner", {}).get("login", ""),
                "avatarUrl": r.get("owner", {}).get("avatar_url", ""),
                "htmlUrl": r.get("owner", {}).get("html_url", ""),
            },
            "htmlUrl": r.get("html_url"),
            "description": r.get("description") or "",
            "language": r.get("language") or "Other",
            "stargazersCount": r.get("stargazers_count", 0),
            "forksCount": r.get("forks_count", 0),
            "openIssuesCount": r.get("open_issues_count", 0),
            "topics": r.get("topics", []),
            "updatedAt": r.get("updated_at", ""),
            "pushedAt": r.get("pushed_at", ""),
        })

    # Sort descending by stars by default
    repos.sort(key=lambda x: x["stargazersCount"], reverse=True)

    output_path = Path(__file__).resolve().parent.parent / "src" / "data" / "github_starred_repos.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(repos, f, indent=2, ensure_ascii=False)

    print(f"Successfully saved {len(repos)} starred repositories to {output_path}")

if __name__ == "__main__":
    fetch_starred_repos("JohnDivina")
