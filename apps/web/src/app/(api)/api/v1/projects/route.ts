import { operations } from "@repo/api";
import { route } from "@repo/api/http";

export const GET = route(operations.listProjects);
export const POST = route(operations.createProject);
