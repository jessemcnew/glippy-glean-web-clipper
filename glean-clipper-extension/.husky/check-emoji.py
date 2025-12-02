#!/usr/bin/env python3
import sys
import re

emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002600-\U000027BF\U0001F900-\U0001F9FF\U0001F018-\U0001F270]')

for filename in sys.argv[1:]:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            if emoji_pattern.search(content):
                print(f'Emoji found in: {filename}')
                # Show the line with emoji
                for i, line in enumerate(content.split('\n'), 1):
                    if emoji_pattern.search(line):
                        print(f'  Line {i}: {line}')
                sys.exit(1)
    except Exception as e:
        print(f'Error reading {filename}: {e}')