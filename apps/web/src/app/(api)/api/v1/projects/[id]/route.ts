import { operations } from "@repo/api";
import { route } from "@repo/api/http";

export const GET = route(operations.getProject);
export const PATCH = route(operations.updateProject);
export const DELETE = route(operations.deleteProject);
