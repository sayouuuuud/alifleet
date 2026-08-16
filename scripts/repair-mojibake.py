"""Repair U+FFFD damage by recovering each broken line from git history.

Some editing paths re-encode the RTL dictionary and seed files and destroy
characters, leaving U+FFFD behind. Each corrupted line is matched against every
historical revision of the same file, treating a run of U+FFFD as a wildcard for
the text it replaced. Only unambiguous matches are applied, so nothing is
guessed.

Usage: python3 scripts/repair-mojibake.py <file> [<file> ...]
"""

import re
import subprocess
import sys

FFFD = "\ufffd"


def run(args):
    return subprocess.run(args, capture_output=True, text=True).stdout


def historical_lines(path):
    """Every line of this file, from every revision, that is not itself broken."""
    commits = [c for c in run(["git", "log", "--format=%H", "--", path]).split("\n") if c]
    clean = []
    for commit in commits:
        blob = run(["git", "show", f"{commit}:{path}"])
        clean.extend(line for line in blob.split("\n") if line and FFFD not in line)
    return clean


def pattern_for(line):
    """Turn a broken line into a regex where each U+FFFD run is a wildcard."""
    parts = re.split(f"{FFFD}+", line)
    return "^" + ".+?".join(re.escape(part) for part in parts) + "$"


def repair(path):
    text = open(path, encoding="utf-8").read()
    if FFFD not in text:
        print(f"{path}: clean")
        return 0, 0

    candidates = historical_lines(path)
    lines = text.split("\n")
    fixed = unresolved = 0

    for index, line in enumerate(lines):
        if FFFD not in line:
            continue

        matches = {c for c in candidates if re.match(pattern_for(line), c)}
        if len(matches) == 1:
            lines[index] = matches.pop()
            fixed += 1
        else:
            unresolved += 1
            print(f"  ! {path}:{index + 1} {len(matches)} candidate(s): {line.strip()[:70]}")
            for candidate in list(matches)[:3]:
                print(f"      {candidate.strip()[:70]}")

    if fixed:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write("\n".join(lines))

    remaining = open(path, encoding="utf-8").read().count(FFFD)
    print(f"{path}: repaired {fixed} line(s), {remaining} U+FFFD remaining")
    return fixed, unresolved


if __name__ == "__main__":
    totals = [repair(target) for target in sys.argv[1:]]
    print(f"\ntotal repaired={sum(t[0] for t in totals)} unresolved={sum(t[1] for t in totals)}")
