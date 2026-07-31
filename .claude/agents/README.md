# Sub-Agents Index

| Agent | Purpose | Tools |
|---|---|---|
| `coder` | Default implementer: read → RED test → GREEN implement → typecheck → run tests → commit → self-review → digest. Never pushes, opens PRs, or touches an issue tracker. | Read, Edit, Write, MultiEdit, Bash, Grep, Glob |
| `reviewer` | Generic code reviewer: reads a diff, checks it against `.claude/rules/*.md`, reports findings. Never edits. | Read, Grep, Glob, Bash |

Add new agents here as you create them (see the `new-agent` skill).
