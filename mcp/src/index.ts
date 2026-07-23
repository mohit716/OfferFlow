import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { apiRequest } from './client.js';

const STATUSES = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'] as const;

interface Application {
  id: number;
  company: string;
  role: string;
  location: string | null;
  salary: string | null;
  job_link: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const server = new McpServer({
  name: 'offerflow',
  version: '1.0.0',
});

// Helpers -------------------------------------------------------------------

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: 'text' as const, text: `Error: ${message}` }],
    isError: true,
  };
}

function formatApplication(a: Application): string {
  const parts = [
    `#${a.id} ${a.company} — ${a.role} [${a.status}]`,
    a.location ? `  location: ${a.location}` : null,
    a.salary ? `  salary: ${a.salary}` : null,
    a.job_link ? `  link: ${a.job_link}` : null,
    a.notes ? `  notes: ${a.notes}` : null,
  ].filter(Boolean);
  return parts.join('\n');
}

// Tools ---------------------------------------------------------------------

server.tool(
  'whoami',
  'Get the currently authenticated OfferFlow user (id, email, name).',
  {},
  async () => {
    try {
      const { user } = await apiRequest<{
        user: { id: number; email: string; name: string };
      }>('/auth/me');
      return ok(`Logged in as ${user.name} <${user.email}> (id ${user.id})`);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'get_dashboard',
  'Get dashboard stats for the current user: total applications and counts by status.',
  {},
  async () => {
    try {
      const stats = await apiRequest<{
        total: number;
        byStatus: Record<string, number>;
      }>('/applications/dashboard');
      const byStatus = Object.entries(stats.byStatus)
        .map(([status, count]) => `  ${status}: ${count}`)
        .join('\n');
      return ok(`Total: ${stats.total}\n${byStatus}`);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'list_applications',
  'List job applications for the current user. Optionally filter by company, role, or status.',
  {
    company: z.string().optional().describe('Filter by company (partial match)'),
    role: z.string().optional().describe('Filter by role (partial match)'),
    status: z.enum(STATUSES).optional().describe('Filter by exact status'),
  },
  async ({ company, role, status }) => {
    try {
      const params = new URLSearchParams();
      if (company) params.set('company', company);
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      const query = params.toString();

      const { applications } = await apiRequest<{ applications: Application[] }>(
        `/applications${query ? `?${query}` : ''}`
      );

      if (applications.length === 0) {
        return ok('No applications found.');
      }

      return ok(
        `${applications.length} application(s):\n\n` +
          applications.map(formatApplication).join('\n\n')
      );
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'get_application',
  'Get a single job application by its id.',
  {
    id: z.number().int().describe('Application id'),
  },
  async ({ id }) => {
    try {
      const { application } = await apiRequest<{ application: Application }>(
        `/applications/${id}`
      );
      return ok(formatApplication(application));
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'create_application',
  'Add a new job application for the current user.',
  {
    company: z.string().describe('Company name'),
    role: z.string().describe('Role / job title'),
    status: z.enum(STATUSES).optional().describe('Defaults to "Applied"'),
    location: z.string().optional(),
    salary: z.string().optional(),
    job_link: z.string().url().optional().describe('URL to the job posting'),
    notes: z.string().optional(),
  },
  async (args) => {
    try {
      const { application } = await apiRequest<{ application: Application }>(
        '/applications',
        { method: 'POST', body: JSON.stringify(args) }
      );
      return ok(`Created:\n${formatApplication(application)}`);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'update_application',
  'Update fields on an existing job application. Only provided fields are changed.',
  {
    id: z.number().int().describe('Application id to update'),
    company: z.string().optional(),
    role: z.string().optional(),
    status: z.enum(STATUSES).optional(),
    location: z.string().optional(),
    salary: z.string().optional(),
    job_link: z.string().url().optional(),
    notes: z.string().optional(),
  },
  async ({ id, ...fields }) => {
    try {
      const { application } = await apiRequest<{ application: Application }>(
        `/applications/${id}`,
        { method: 'PUT', body: JSON.stringify(fields) }
      );
      return ok(`Updated:\n${formatApplication(application)}`);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'delete_application',
  'Delete a job application by its id. This is permanent.',
  {
    id: z.number().int().describe('Application id to delete'),
  },
  async ({ id }) => {
    try {
      await apiRequest(`/applications/${id}`, { method: 'DELETE' });
      return ok(`Deleted application #${id}.`);
    } catch (error) {
      return fail(error);
    }
  }
);

// Start ---------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Note: stdout is reserved for the MCP protocol; log to stderr only.
  console.error('OfferFlow MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error starting OfferFlow MCP server:', error);
  process.exit(1);
});
