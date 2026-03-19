export const MOCK_COLLECTIONS = [
  {
    id: 'col-1',
    name: 'Reqres API',
    isOpen: true,
    isFavorite: false,
    items: [
      {
        type: 'request',
        id: 'req-1',
        name: 'Get Users',
        method: 'GET',
        url: 'https://reqres.in/api/users?page=2',
        headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
        params: [{ key: 'page', value: '2', enabled: true }],
        pathVariables: [],
        body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] },
        auth: { type: 'none' },
        examples: [
          { id: 'ex-1', name: '200 OK - Users List', status: 200, body: '{"page":2,"data":[{"id":7,"email":"michael.lawson@reqres.in"}]}' }
        ]
      },
      {
        type: 'folder',
        id: 'fol-1',
        name: 'User Operations',
        isOpen: true,
        items: [
          {
            type: 'request',
            id: 'req-2',
            name: 'Create User',
            method: 'POST',
            url: 'https://reqres.in/api/users',
            headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
            params: [],
            pathVariables: [],
            body: { type: 'raw', rawType: 'JSON', raw: '{\n  "name": "John Doe",\n  "job": "engineer"\n}', formData: [], urlEncoded: [] },
            auth: { type: 'none' },
            examples: []
          },
          {
            type: 'request',
            id: 'req-3',
            name: 'Get User by ID',
            method: 'GET',
            url: 'https://reqres.in/api/users/:id',
            headers: [],
            params: [],
            pathVariables: [{ key: 'id', value: '2', enabled: true }],
            body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] },
            auth: { type: 'none' },
            examples: []
          },
          {
            type: 'request',
            id: 'req-4',
            name: 'Update User',
            method: 'PUT',
            url: 'https://reqres.in/api/users/:id',
            headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
            params: [],
            pathVariables: [{ key: 'id', value: '2', enabled: true }],
            body: { type: 'raw', rawType: 'JSON', raw: '{\n  "name": "Jane Smith",\n  "job": "manager"\n}', formData: [], urlEncoded: [] },
            auth: { type: 'none' },
            examples: []
          },
          {
            type: 'request',
            id: 'req-5',
            name: 'Delete User',
            method: 'DELETE',
            url: 'https://reqres.in/api/users/:id',
            headers: [],
            params: [],
            pathVariables: [{ key: 'id', value: '2', enabled: true }],
            body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] },
            auth: { type: 'none' },
            examples: []
          }
        ]
      }
    ]
  },
  {
    id: 'col-2',
    name: 'JSONPlaceholder',
    isOpen: false,
    isFavorite: true,
    items: [
      {
        type: 'request',
        id: 'req-6',
        name: 'Get All Posts',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts',
        headers: [],
        params: [],
        pathVariables: [],
        body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] },
        auth: { type: 'none' },
        examples: []
      },
      {
        type: 'folder',
        id: 'fol-2',
        name: 'Post CRUD',
        isOpen: false,
        items: [
          {
            type: 'request',
            id: 'req-7',
            name: 'Get Post by ID',
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/posts/:id',
            headers: [],
            params: [],
            pathVariables: [{ key: 'id', value: '1', enabled: true }],
            body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] },
            auth: { type: 'none' },
            examples: []
          },
          {
            type: 'request',
            id: 'req-8',
            name: 'Create Post',
            method: 'POST',
            url: 'https://jsonplaceholder.typicode.com/posts',
            headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
            params: [],
            pathVariables: [],
            body: { type: 'raw', rawType: 'JSON', raw: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}', formData: [], urlEncoded: [] },
            auth: { type: 'none' },
            examples: []
          }
        ]
      }
    ]
  },
  {
    id: 'col-3',
    name: 'GitHub API',
    isOpen: false,
    isFavorite: false,
    items: [
      {
        type: 'request',
        id: 'req-9',
        name: 'Get User',
        method: 'GET',
        url: 'https://api.github.com/users/:username',
        headers: [{ key: 'Accept', value: 'application/vnd.github.v3+json', enabled: true }],
        params: [],
        pathVariables: [{ key: 'username', value: 'octocat', enabled: true }],
        body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] },
        auth: { type: 'none' },
        examples: []
      }
    ]
  }
];

export const MOCK_ENVIRONMENTS = [
  {
    id: 'env-1',
    name: 'Development',
    variables: [
      { id: 'v1', key: 'base_url', value: 'http://localhost:3000', enabled: true },
      { id: 'v2', key: 'api_key', value: 'dev-key-abc123', enabled: true },
      { id: 'v3', key: 'user_id', value: '42', enabled: true },
    ]
  },
  {
    id: 'env-2',
    name: 'Staging',
    variables: [
      { id: 'v4', key: 'base_url', value: 'https://staging.api.example.com', enabled: true },
      { id: 'v5', key: 'api_key', value: 'stg-key-def456', enabled: true },
      { id: 'v6', key: 'user_id', value: '1', enabled: false },
    ]
  },
  {
    id: 'env-3',
    name: 'Production',
    variables: [
      { id: 'v7', key: 'base_url', value: 'https://api.example.com', enabled: true },
      { id: 'v8', key: 'api_key', value: 'prod-key-xyz789', enabled: true },
      { id: 'v9', key: 'timeout', value: '5000', enabled: true },
    ]
  }
];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const METHOD_COLORS = {
  GET: '#49cc90',
  POST: '#fca130',
  PUT: '#ffa500',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e',
  HEAD: '#9012fe',
  OPTIONS: '#0d5aa7'
};

export const DEFAULT_REQUEST = {
  id: null,
  name: 'Untitled Request',
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  params: [{ key: '', value: '', enabled: true }],
  pathVariables: [],
  body: { type: 'none', rawType: 'JSON', raw: '', formData: [{ key: '', value: '', fieldType: 'text', enabled: true }], urlEncoded: [{ key: '', value: '', enabled: true }] },
  auth: { type: 'none', bearerToken: '', basicUsername: '', basicPassword: '' }
};

export const MOCK_WORKSPACES = [
  { id: 'ws-1', name: 'My Workspace', type: 'Personal' },
  { id: 'ws-2', name: 'Team Alpha', type: 'Team' },
  { id: 'ws-3', name: 'API Projects', type: 'Personal' },
];

export const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'update', title: 'Postie v11.1 available', body: 'New features: improved API documentation and test runner.', time: '2h ago', read: false },
  { id: 2, type: 'collab', title: 'Team Alpha shared a collection', body: '"Payment Gateway API" has been shared with you.', time: '5h ago', read: false },
  { id: 3, type: 'info', title: 'API usage report ready', body: 'Your monthly API usage report for March is ready to view.', time: '1d ago', read: true },
  { id: 4, type: 'warn', title: 'API key expiring soon', body: 'Your API key "prod-key-789" expires in 7 days.', time: '2d ago', read: true },
  { id: 5, type: 'info', title: 'New monitor alert', body: 'Monitor "Health Check" ran successfully 100 times.', time: '3d ago', read: true },
];