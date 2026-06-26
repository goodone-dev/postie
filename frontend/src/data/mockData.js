// Mock data for Postman-like prototype

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const methodColorMap = {
    GET: 'text-method-get',
    POST: 'text-method-post',
    PUT: 'text-method-put',
    PATCH: 'text-method-patch',
    DELETE: 'text-method-delete',
    HEAD: 'text-info',
    OPTIONS: 'text-muted-foreground',
};

export const methodBgMap = {
    GET: 'bg-success-soft text-method-get',
    POST: 'bg-warning-soft text-method-post',
    PUT: 'bg-primary-soft text-method-put',
    PATCH: 'bg-accent text-method-patch',
    DELETE: 'bg-destructive/10 text-method-delete',
    HEAD: 'bg-info-soft text-info',
    OPTIONS: 'bg-muted text-muted-foreground',
};

export const initialCollections = [
    {
        id: 'col-1',
        name: 'Stellar API',
        description: 'Public REST endpoints',
        expanded: true,
        folders: [
            {
                id: 'fol-1',
                name: 'Users',
                expanded: true,
                requests: [
                    { id: 'r-1', name: 'List users', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users' },
                    { id: 'r-2', name: 'Get user by ID', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users/1' },
                    { id: 'r-3', name: 'Create user', method: 'POST', url: 'https://jsonplaceholder.typicode.com/users' },
                    { id: 'r-4', name: 'Update user', method: 'PUT', url: 'https://jsonplaceholder.typicode.com/users/1' },
                    { id: 'r-5', name: 'Delete user', method: 'DELETE', url: 'https://jsonplaceholder.typicode.com/users/1' },
                ],
            },
            {
                id: 'fol-2',
                name: 'Posts',
                expanded: false,
                requests: [
                    { id: 'r-6', name: 'List posts', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts' },
                    { id: 'r-7', name: 'Patch post', method: 'PATCH', url: 'https://jsonplaceholder.typicode.com/posts/1' },
                ],
            },
        ],
    },
    {
        id: 'col-2',
        name: 'Internal Services',
        description: 'Auth & billing',
        expanded: false,
        folders: [
            {
                id: 'fol-3',
                name: 'Auth',
                expanded: false,
                requests: [
                    { id: 'r-8', name: 'Sign in', method: 'POST', url: '{{baseUrl}}/auth/login' },
                    { id: 'r-9', name: 'Refresh token', method: 'POST', url: '{{baseUrl}}/auth/refresh' },
                ],
            },
        ],
    },
];

export const initialEnvironments = [
    {
        id: 'env-1',
        name: 'Production',
        active: false,
        variables: [
            { id: 'v-1', key: 'baseUrl', value: 'https://api.stellar.dev', enabled: true },
            { id: 'v-2', key: 'apiKey', value: 'prod_xxx', enabled: true },
        ],
    },
    {
        id: 'env-2',
        name: 'Staging',
        active: true,
        variables: [
            { id: 'v-3', key: 'baseUrl', value: 'https://staging.stellar.dev', enabled: true },
            { id: 'v-4', key: 'apiKey', value: 'stg_xxx', enabled: true },
        ],
    },
    {
        id: 'env-3',
        name: 'Local',
        active: false,
        variables: [{ id: 'v-5', key: 'baseUrl', value: 'http://localhost:8001', enabled: true }],
    },
];

export const initialHistory = [
    { id: 'h-1', method: 'GET', url: 'https://api.github.com/users/octocat', time: '2m ago' },
    { id: 'h-2', method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts', time: '15m ago' },
    { id: 'h-3', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users/1', time: '1h ago' },
    { id: 'h-4', method: 'DELETE', url: 'https://api.example.com/items/42', time: '3h ago' },
];

export const newRequestTemplate = (overrides = {}) => ({
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'request',
    name: overrides.name || 'Untitled Request',
    method: overrides.method || 'GET',
    url: overrides.url || '',
    params: overrides.params || [{ id: 'p1', key: '', value: '', description: '', enabled: true }],
    headers: overrides.headers || [
        { id: 'h1', key: 'Accept', value: 'application/json', description: '', enabled: true },
        { id: 'h2', key: '', value: '', description: '', enabled: true },
    ],
    body: overrides.body || '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
    bodyType: overrides.bodyType || 'none',
    auth: overrides.auth || { type: 'none', token: '' },
    response: null,
    isSending: false,
    activeTab: 'params',
});

// ---- ID + entity factories for CRUD ----
export const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export const newCollection = (name) => ({
    id: genId('col'),
    name: name || 'New Collection',
    description: '',
    expanded: true,
    folders: [],
});

export const newFolder = (name) => ({
    id: genId('fol'),
    name: name || 'New Folder',
    expanded: true,
    requests: [],
});

export const newSavedRequest = ({ name, method = 'GET', url = '' }) => ({
    id: genId('r'),
    name: name || 'New Request',
    method,
    url,
});

export const newEnvironment = (name) => ({
    id: genId('env'),
    name: name || 'New Environment',
    active: false,
    variables: [],
});

export const newVariable = () => ({ id: genId('v'), key: '', value: '', enabled: true });

export const newWorkspace = (name) => ({
    id: genId('ws'),
    name: name || 'New Workspace',
    collections: [],
    environments: [{ id: genId('env'), name: 'Development', active: true, variables: [] }],
});

// Deep clone helpers with fresh ids (used by Duplicate actions)
export const cloneCollection = (col, nameSuffix = ' Copy') => ({
    ...col,
    id: genId('col'),
    name: `${col.name}${nameSuffix}`,
    favorite: false,
    folders: col.folders.map((f) => cloneFolder(f, '')),
});

export const cloneFolder = (folder, nameSuffix = ' Copy') => ({
    ...folder,
    id: genId('fol'),
    name: `${folder.name}${nameSuffix}`,
    requests: folder.requests.map((r) => ({ ...r, id: genId('r') })),
});

export const cloneEnvironment = (env) => ({
    ...env,
    id: genId('env'),
    name: `${env.name} Copy`,
    active: false,
    variables: (env.variables || []).map((v) => ({ ...v, id: genId('v') })),
});

// Workspaces own their collections + environments
export const initialWorkspaces = [
    {
        id: 'ws-1',
        name: 'My Workspace',
        collections: initialCollections,
        environments: initialEnvironments,
    },
    {
        id: 'ws-2',
        name: 'Team — Stellar Labs',
        collections: [
            {
                id: 'col-team-1',
                name: 'Billing API',
                description: 'Subscriptions & invoices',
                expanded: true,
                folders: [
                    {
                        id: 'fol-team-1',
                        name: 'Invoices',
                        expanded: true,
                        requests: [
                            { id: 'r-t1', name: 'List invoices', method: 'GET', url: 'https://api.stellar.dev/invoices' },
                            { id: 'r-t2', name: 'Create invoice', method: 'POST', url: 'https://api.stellar.dev/invoices' },
                        ],
                    },
                ],
            },
        ],
        environments: [
            { id: 'env-t1', name: 'Production', active: true },
            { id: 'env-t2', name: 'Sandbox', active: false },
        ],
    },
];

// Generates a mock response based on the request
export const generateMockResponse = (request) => {
    const start = performance.now();
    const { method, url } = request;

    let status = 200;
    let statusText = 'OK';
    let body;

    if (!url || url.trim() === '') {
        return {
            status: 0,
            statusText: 'No URL',
            time: 0,
            size: 0,
            headers: [],
            body: '{\n  "error": "Please enter a request URL"\n}',
            error: true,
        };
    }

    if (method === 'POST') {
        status = 201;
        statusText = 'Created';
        body = {
            id: Math.floor(Math.random() * 9000) + 1000,
            createdAt: new Date().toISOString(),
            ...tryParseJSON(request.body) || { message: 'Resource created successfully' },
        };
    } else if (method === 'DELETE') {
        status = 204;
        statusText = 'No Content';
        body = {};
    } else if (method === 'PUT' || method === 'PATCH') {
        status = 200;
        statusText = 'OK';
        body = {
            id: 1,
            updatedAt: new Date().toISOString(),
            ...tryParseJSON(request.body) || { message: 'Resource updated' },
        };
    } else {
        body = sampleGetBody(url);
    }

    const responseStr = JSON.stringify(body, null, 2);
    const elapsed = Math.max(80, Math.floor(performance.now() - start + Math.random() * 220));
    return {
        status,
        statusText,
        time: elapsed,
        size: new Blob([responseStr]).size,
        headers: [
            { key: 'Content-Type', value: 'application/json; charset=utf-8' },
            { key: 'Server', value: 'nginx/1.25.3' },
            { key: 'X-Powered-By', value: 'Stellar' },
            { key: 'Cache-Control', value: 'public, max-age=3600' },
            { key: 'Date', value: new Date().toUTCString() },
            { key: 'Content-Length', value: String(new Blob([responseStr]).size) },
        ],
        body: responseStr,
        error: false,
    };
};

function tryParseJSON(s) {
    try { return JSON.parse(s); } catch { return null; }
}

function sampleGetBody(url) {
    if (url.includes('/users/1') || url.match(/\/users\/\d+$/)) {
        return {
            id: 1,
            name: 'Leanne Graham',
            username: 'Bret',
            email: 'sincere@april.biz',
            address: { street: 'Kulas Light', suite: 'Apt. 556', city: 'Gwenborough', zipcode: '92998-3874' },
            phone: '1-770-736-8031 x56442',
            website: 'hildegard.org',
            company: { name: 'Romaguera-Crona', catchPhrase: 'Multi-layered client-server neural-net' },
        };
    }
    if (url.includes('/users')) {
        return [
            { id: 1, name: 'Leanne Graham', email: 'sincere@april.biz', company: 'Romaguera-Crona' },
            { id: 2, name: 'Ervin Howell', email: 'shanna@melissa.tv', company: 'Deckow-Crist' },
            { id: 3, name: 'Clementine Bauch', email: 'nathan@yesenia.net', company: 'Romaguera-Jacobson' },
        ];
    }
    if (url.includes('/posts')) {
        return [
            { userId: 1, id: 1, title: 'sunt aut facere repellat', body: 'quia et suscipit suscipit recusandae...' },
            { userId: 1, id: 2, title: 'qui est esse', body: 'est rerum tempore vitae...' },
        ];
    }
    return {
        success: true,
        endpoint: url,
        message: 'Mock response generated by Stellar (Postman clone prototype).',
        timestamp: new Date().toISOString(),
        data: {
            items: [
                { id: 1, label: 'Alpha', score: 92 },
                { id: 2, label: 'Beta', score: 88 },
                { id: 3, label: 'Gamma', score: 76 },
            ],
        },
    };
}
