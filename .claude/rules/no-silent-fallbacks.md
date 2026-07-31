# No Silent Fallbacks

Never write code that silently degrades when required data is missing.
Silent fallbacks hide bugs and data quality issues — they make the system
**look** like it works while actually doing the wrong thing.

## Banned patterns

- `value ?? "default"` when the value is required for the feature to work
- Optional parameters that silently produce broken output when absent
- Fallback strings like `"Unknown"`, `"N/A"` that mask missing data
- `?.` chains that swallow nulls when the data should always exist

## Required patterns

- **Fail loudly**: Log a warning, skip the action, or throw — never pretend
  it worked
- **Surface the gap**: If data is missing, tell the operator (alert,
  console.error, skip with reason)
- **Fix at the source**: Missing data = bug in the upstream system. Don't
  paper over it.

## Example

```typescript
// BAD — hides that the id is null, nobody gets notified
const mention = userId ? `<@${userId}>` : (name ?? "Unknown");

// GOOD — skip the notification and log why
if (!userId) {
  console.warn(`[notify] skipped — user has no id`);
  return;
}
```
