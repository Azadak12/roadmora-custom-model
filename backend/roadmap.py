import json
import re

_LEARNING_ROADMAP_OBJ_RE = re.compile(r'"learning_roadmap"\s*:\s*\{([^{}]*)\}')
_CODE_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```")
_JSON_OBJ_RE = re.compile(r"\{[\s\S]*\}")


def fix_json(raw: str) -> str:
    """AI sometimes returns learning_roadmap as an object instead of an array."""
    if not raw:
        return raw
    return _LEARNING_ROADMAP_OBJ_RE.sub(lambda m: f'"learning_roadmap": [{m.group(1)}]', raw)


def extract_json(raw: str):
    if not raw:
        return None

    fixed = fix_json(raw)

    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    fence = _CODE_FENCE_RE.search(fixed)
    if fence:
        try:
            return json.loads(fix_json(fence.group(1).strip()))
        except json.JSONDecodeError:
            pass

    obj = _JSON_OBJ_RE.search(fixed)
    if obj:
        try:
            return json.loads(fix_json(obj.group(0)))
        except json.JSONDecodeError:
            pass

    return None


def parse_roadmap_response(response_text: str) -> dict:
    """Mirrors the n8n response parsing previously done client-side in script.js."""
    try:
        parsed = json.loads(fix_json(response_text))
        data = parsed[0] if isinstance(parsed, list) else parsed
        raw = data.get("output") or data.get("text") or (data.get("message") or {}).get("content")
        if isinstance(raw, str):
            extracted = extract_json(raw)
            if extracted is not None:
                data = extracted
    except (json.JSONDecodeError, AttributeError, TypeError):
        data = extract_json(response_text)
        if data is None:
            raise ValueError("Could not parse AI response")

    return data
