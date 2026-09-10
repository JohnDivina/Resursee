#!/usr/bin/env python3
"""
Scrapes and parses the official public-apis/public-apis repository README
into a clean, structured JSON file for the Resursee Public APIs Directory.
"""

import urllib.request
import ssl
import re
import json
import os

def fetch_and_parse_public_apis():
    url = 'https://raw.githubusercontent.com/public-apis/public-apis/master/README.md'
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
    
    print(f"Fetching README from {url}...")
    with urllib.request.urlopen(req, context=ctx) as resp:
        content = resp.read().decode('utf-8')

    print(f"Downloaded {len(content)} characters. Parsing sections...")
    sections = re.split(r'\n###\s+', content)
    apis = []
    categories = {}

    for s in sections[1:]:
        lines = s.strip().split('\n')
        if not lines:
            continue
        cat = lines[0].strip()
        # Skip APILayer ad or Table of Contents / Index
        if cat.startswith('APIs Covered') or cat.startswith('Index') or 'APILayer' in cat:
            continue

        cat_count = 0
        for line in lines[1:]:
            line = line.strip()
            if not line.startswith('|') or line.startswith('|:---') or line.startswith('| API | Description'):
                continue
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if len(parts) >= 5:
                m = re.match(r'\[([^\]]+)\]\(([^)]+)\)', parts[0])
                if m:
                    name = m.group(1).strip()
                    link = m.group(2).strip()
                    desc = parts[1].strip()
                    auth = parts[2].replace('`', '').strip()
                    https = parts[3].strip()
                    cors = parts[4].strip()

                    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

                    apis.append({
                        'id': f"{slug}-{len(apis)+1}",
                        'name': name,
                        'link': link,
                        'description': desc,
                        'auth': auth if auth else 'No',
                        'https': https.lower() == 'yes',
                        'cors': cors if cors in ['Yes', 'No', 'Unknown'] else 'Unknown',
                        'category': cat
                    })
                    cat_count += 1
        if cat_count > 0:
            categories[cat] = cat_count

    print(f"Parsed {len(apis)} APIs across {len(categories)} categories.")

    output_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'public-apis.json')

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(apis, f, indent=2, ensure_ascii=False)

    print(f"Successfully saved {len(apis)} APIs to {output_file}")
    return apis

if __name__ == '__main__':
    fetch_and_parse_public_apis()
