import type { WebMcpToolDefinition } from '../domain/WebMcpContracts';

interface NativeModelContext {
  registerTool(tool: WebMcpToolDefinition, options?: { signal?: AbortSignal }): Promise<void>;
}

export interface WebMcpDocument extends Document { modelContext?: NativeModelContext; }

export async function registerWebMcpTools({ document, tools }: { document: Document; tools: WebMcpToolDefinition[] }) {
  const target = document as WebMcpDocument; const modelContext = target.modelContext;
  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    return { supported: false as const, registeredNames: [] as string[], unregister: () => undefined, document: target };
  }
  const controllers = tools.map(() => new AbortController());
  await Promise.all(tools.map((tool, index) => modelContext.registerTool(tool, { signal: controllers[index].signal })));
  return { supported: true as const, registeredNames: tools.map((tool) => tool.name), unregister: () => controllers.forEach((controller) => controller.abort()), document: target };
}
