import type { WebMcpToolDefinition } from '../domain/WebMcpContracts';

interface NativeModelContext {
  registerTool(tool: WebMcpToolDefinition, options?: { signal?: AbortSignal }): void | Promise<void>;
}

export interface WebMcpDocument extends Document { modelContext?: NativeModelContext; }

interface SharedRegistration {
  document: WebMcpDocument;
  modelContext: NativeModelContext;
  toolNames: string;
  controllers: AbortController[];
  ready: Promise<void>;
  leases: number;
  teardownTimer: ReturnType<typeof setTimeout> | null;
}

let sharedRegistration: SharedRegistration | null = null;

function stopRegistration(registration: SharedRegistration) {
  registration.controllers.forEach((controller) => controller.abort());
  if (sharedRegistration === registration) sharedRegistration = null;
}

export async function registerWebMcpTools({ document, tools }: { document: Document; tools: WebMcpToolDefinition[] }) {
  const target = document as WebMcpDocument; const modelContext = target.modelContext;
  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    return { supported: false as const, registeredNames: [] as string[], unregister: () => undefined, document: target };
  }
  const toolNames = tools.map((tool) => tool.name).join('|');
  const canReuse = sharedRegistration?.document === target && sharedRegistration.modelContext === modelContext && sharedRegistration.toolNames === toolNames;
  if (!canReuse) {
    if (sharedRegistration) stopRegistration(sharedRegistration);
    const controllers = tools.map(() => new AbortController());
    sharedRegistration = {
      document: target,
      modelContext,
      toolNames,
      controllers,
      ready: Promise.all(tools.map((tool, index) => Promise.resolve(modelContext.registerTool(tool, { signal: controllers[index].signal })))).then(() => undefined),
      leases: 0,
      teardownTimer: null,
    };
  }
  const registration = sharedRegistration;
  if (!registration) throw new Error('WebMCP註冊無法建立。');
  if (registration.teardownTimer) { clearTimeout(registration.teardownTimer); registration.teardownTimer = null; }
  registration.leases += 1;
  await registration.ready;
  let released = false;
  const unregister = () => {
    if (released) return;
    released = true; registration.leases = Math.max(0, registration.leases - 1);
    if (registration.leases === 0) {
      registration.teardownTimer = setTimeout(() => {
        if (registration.leases === 0) stopRegistration(registration);
      }, 0);
    }
  };
  return { supported: true as const, registeredNames: tools.map((tool) => tool.name), unregister, document: target };
}
