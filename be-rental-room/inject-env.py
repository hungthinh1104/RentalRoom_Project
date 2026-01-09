#!/usr/bin/env python3
import os
import sys

if len(sys.argv) != 3:
    print("Usage: inject-env.py <template-file> <output-file>")
    sys.exit(1)

template_file = sys.argv[1]
output_file = sys.argv[2]

# Read template
with open(template_file, 'r') as f:
    content = f.read()

# Replace ${VAR} with environment variable values
for key, value in os.environ.items():
    placeholder = f"${{{key}}}"
    if placeholder in content:
        content = content.replace(placeholder, value)

# Write output
with open(output_file, 'w') as f:
    f.write(content)

print(f"✓ Injected environment variables into {output_file}")
