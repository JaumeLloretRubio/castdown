import type { z } from "zod";
import type {
  InputFormat,
  OutputFormat,
  CastFromFileResponse,
  RenderRequest,
  CrawlRequest,
  ErrorResponse,
} from "./schemas.js";

export type InputFormatT = z.infer<typeof InputFormat>;
export type OutputFormatT = z.infer<typeof OutputFormat>;
export type CastFromFileResponseT = z.infer<typeof CastFromFileResponse>;
export type RenderRequestT = z.infer<typeof RenderRequest>;
export type CrawlRequestT = z.infer<typeof CrawlRequest>;
export type ErrorResponseT = z.infer<typeof ErrorResponse>;
