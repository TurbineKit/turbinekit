// Writes the API's OpenAPI document for Blume (blume.config.ts reads
// ./openapi.json). Runs before every dev, build and check, so the reference
// always matches the operations the API itself serves (packages/api).
import { writeFileSync } from "node:fs";
import { openApiDocument } from "@repo/api/openapi";

const SPEC_PATH = "openapi.json";

writeFileSync(SPEC_PATH, `${JSON.stringify(openApiDocument(), null, "\t")}\n`);
console.log(`Wrote ${SPEC_PATH}`);
