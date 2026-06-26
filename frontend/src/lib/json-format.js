// Tiny syntax-highlighter for JSON, returns array of tokens
function classifyToken(v) {
    if (/^"/.test(v)) return v.trim().endsWith(':') ? 'key' : 'string';
    if (v === 'true' || v === 'false' || v === 'null') return 'bool';
    if (/^-?\d/.test(v)) return 'number';
    if ('{}[],:'.includes(v)) return 'punct';
    return 'plain';
}

export function tokenizeJSON(text) {
    if (!text) return [];
    const tokens = [];
    const regex = /("(?:\\.|[^"\\])*"(?:\s*:)?|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[\{\}\[\],:])/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ type: 'plain', value: text.slice(lastIndex, match.index) });
        }
        const v = match[0];
        tokens.push({ type: classifyToken(v), value: v });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        tokens.push({ type: 'plain', value: text.slice(lastIndex) });
    }
    return tokens;
}
