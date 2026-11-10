import { createUserManagementHandler } from "./handler.ts";

Deno.serve(createUserManagementHandler(false));
