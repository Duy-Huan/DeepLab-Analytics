export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'DeepLab Analytics REST API',
    version: '1.0.0',
    description:
      'Extensible REST API for tracking, analyzing, comparing, and reporting deep learning experiments in Hyperspectral Imaging (HSI) and Computer Vision. Designed for integration with PhD-Research-Lab, Hermes Agent Runtime, Google Colab, and PyTorch.',
    contact: {
      name: 'DeepLab Analytics Research Team',
      url: 'https://deeplab.internal',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current DeepLab Analytics Service',
    },
  ],
  paths: {
    '/projects': {
      get: {
        summary: 'List research projects',
        operationId: 'listProjects',
        responses: {
          '200': {
            description: 'Array of active research projects',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } },
          },
        },
      },
      post: {
        summary: 'Create a new research project',
        operationId: 'createProject',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProjectInput' } } },
        },
        responses: {
          '201': { description: 'Project created successfully' },
        },
      },
    },
    '/projects/{id}': {
      get: {
        summary: 'Get project details and associated runs',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Project details' },
          '404': { description: 'Project not found' },
        },
      },
      delete: {
        summary: 'Delete project and cascade runs',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Project deleted' } },
      },
    },
    '/runs': {
      get: {
        summary: 'List experiment runs',
        parameters: [
          { name: 'projectId', in: 'query', schema: { type: 'string' } },
          { name: 'dataset', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'List of runs' },
        },
      },
      post: {
        summary: 'Register a training run',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRunInput' } } },
        },
        responses: { '201': { description: 'Run registered' } },
      },
    },
    '/runs/{id}': {
      get: {
        summary: 'Get run details, epoch history, confusion matrix, and diagnostics',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Run details' } },
      },
      delete: {
        summary: 'Delete experiment run',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Run deleted' } },
      },
    },
    '/runs/import': {
      post: {
        summary: 'Import experiment from CSV, JSON, or TensorBoard log',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ImportRunInput' } } },
        },
        responses: { '200': { description: 'Run imported successfully' } },
      },
    },
    '/analyze': {
      post: {
        summary: 'Invoke Gemini AI Research Analyst on selected experiment runs',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  run_ids: { type: 'array', items: { type: 'string' } },
                  focus: { type: 'string', enum: ['general', 'overfitting', 'efficiency', 'hyperparameters', 'ablation'] },
                  prompt: { type: 'string' },
                },
                required: ['run_ids'],
              },
            },
          },
        },
        responses: { '200': { description: 'Structured 4-tier scientific analysis' } },
      },
    },
    '/chat': {
      post: {
        summary: 'Send prompt to AI Research Assistant with experiment context',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  run_ids: { type: 'array', items: { type: 'string' } },
                  history: { type: 'array' },
                },
                required: ['message'],
              },
            },
          },
        },
        responses: { '200': { description: 'Assistant answer' } },
      },
    },
    '/reports': {
      get: { summary: 'List scientific reports', responses: { '200': { description: 'Saved reports' } } },
      post: { summary: 'Create and persist a scientific report', responses: { '201': { description: 'Report created' } } },
    },
  },
  components: {
    schemas: {
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          domain: { type: 'string' },
          dataset: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          run_count: { type: 'number' },
          best_oa: { type: 'number' },
        },
      },
      CreateProjectInput: {
        type: 'object',
        required: ['name', 'dataset'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          domain: { type: 'string', enum: ['hyperspectral', 'computer_vision', 'multimodal'] },
          dataset: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      CreateRunInput: {
        type: 'object',
        required: ['project_id', 'name', 'metadata', 'hyperparameters', 'results'],
        properties: {
          project_id: { type: 'string' },
          name: { type: 'string' },
          metadata: { type: 'object' },
          hyperparameters: { type: 'object' },
          results: { type: 'object' },
          epochs: { type: 'array', items: { type: 'object' } },
        },
      },
      ImportRunInput: {
        type: 'object',
        required: ['project_id', 'format', 'payload'],
        properties: {
          project_id: { type: 'string' },
          format: { type: 'string', enum: ['json', 'csv', 'tensorboard'] },
          payload: { type: 'string' },
          override_name: { type: 'string' },
        },
      },
    },
  },
};
