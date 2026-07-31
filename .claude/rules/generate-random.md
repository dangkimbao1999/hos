# Generate Random Values

When you need ANY random value — UUID, password, key, ID, hex string,
nanoid — use the `generate` skill. Never fabricate random-looking strings
inline or hardcode placeholder IDs.

## When to use it

- Generating UUIDs for seed data, test fixtures, or migrations
- Creating API keys, secrets, or passwords
- Producing unique IDs for new database records
- Any time you would otherwise type a made-up UUID or random string

## Banned patterns

- Typing fake UUIDs like `00000000-0000-0000-0000-000000000001`
- Inventing random-looking strings like `aB3xK9m2...`
- Hardcoding placeholder secrets like `sk-test-123`
