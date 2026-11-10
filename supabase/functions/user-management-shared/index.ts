import { createUserManagementHandler } from "../user-management/handler.ts";

Deno.serve(createUserManagementHandler(true));
