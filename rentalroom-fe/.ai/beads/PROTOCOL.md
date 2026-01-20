# Beads Protocol v2 (Official Style Adaptation)

## 🧠 Core Philosophy
1.  **Thinking = State Changes**: Your thought process should result in tangible state updates in `tasks.jsonl`.
2.  **Append-Only Log**: `events.jsonl` is the immutable history. Never edit or delete lines.
3.  **Atomic Updates**: Every logical step (Create, Update, Close) is a distinct event.

## 🤖 Agent Rules (Adapted from Official `bd`)

### 1. Session Start
-   **MUST** read `.ai/beads/data/tasks.jsonl` (The Graph).
-   **MUST** read `.ai/beads/data/events.jsonl` (The Context/Memory).
-   Identify "Ready" tasks (Status: `pending` AND Dependencies: `completed`).

### 2. Interaction Loop
-   **Create**: When discovering new work, add to `tasks.jsonl` with `status: "pending"`.
-   **Update**: When changing context, update `tasks.jsonl` (e.g., `pending` -> `in_progress`).
-   **Close**: When work is done, update `tasks.jsonl` (`status: "completed"`).
-   **Log**: For EVERY action above, append to `events.jsonl`.

### 3. "Sync" Discipline
-   The official Beads uses `bd sync` to flush state.
-   **You MUST** manually ensure `tasks.jsonl` is up-to-date before you call `notify_user` or end a turn.
-   **Never** leave the state "dirty" (in-memory only). Write it to disk immediately.

### 4. Decision Records (`decisions.jsonl`)
-   Use this for "Why", not "What".
-   Format: Issue -> Decision -> Consequence.

## 5. Scaling Strategy (Compaction)
As `events.jsonl` grows, it will exceed context windows.
-   **Archive Rule**: Weekly, or when file > 1MB, run a compaction.
    -   Move completed tasks to `.ai/beads/data/tasks.archive.jsonl`.
    -   Move old events (> 7 days) to `.ai/beads/data/events.archive.jsonl`.
-   **Agent Read Rule**: 
    -   Always read all of `tasks.jsonl` (Keep this file small by archiving).
    -   Read only the **last 50-100 lines** of `events.jsonl` to get recent context.
    -   If deep history is needed, grep/search the archives specifically.
