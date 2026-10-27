"""
Task 3.1: Log Sanitization Utility
Strips ANSI escape sequences (colors, cursor movements, terminal resets),
removes redundant progress bar lines, and windows the buffer to fit the SLM context window.
"""

import re
from app.core.config import MAX_LOG_WINDOW_CHARS

ANSI_ESCAPE_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
PROGRESS_BAR_RE = re.compile(r"^\s*\[[=#\-\.\s>]+\]\s*\d+%.*$", re.MULTILINE)


def sanitize_terminal_output(raw_text: str, max_chars: int = MAX_LOG_WINDOW_CHARS) -> str:
    """
    Strip ANSI escape sequences, control characters, and progress bars,
    then window the log buffer to fit the local SLM context boundary.
    """
    if not raw_text:
        return ""

    # Normalize carriage returns used by terminal spinners
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

    # Strip ANSI escape sequences
    text = ANSI_ESCAPE_RE.sub("", text)

    # Strip non-printable control characters
    text = CONTROL_CHARS_RE.sub("", text)

    # Strip redundant ASCII progress bars
    text = PROGRESS_BAR_RE.sub("", text)

    # Collapse excessive blank lines
    cleaned_lines = []
    for line in text.splitlines():
        stripped = line.rstrip()
        if stripped or (cleaned_lines and cleaned_lines[-1] != ""):
            cleaned_lines.append(stripped)

    sanitized = "\n".join(cleaned_lines).strip()

    # Window buffer to fit context window (preserve head + tail where findings appear)
    if len(sanitized) > max_chars:
        head_budget = max_chars // 3
        tail_budget = max_chars - head_budget - 45
        sanitized = (
            sanitized[:head_budget]
            + "\n...[LOG WINDOW TRUNCATED FOR CONTEXT FIT]...\n"
            + sanitized[-tail_budget:]
        )

    return sanitized
