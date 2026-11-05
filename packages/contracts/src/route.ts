// Route definition helper. Every endpoint of architecture §8.2 is one RouteDef: method, path,
// authorisation, schemas for path params, query, body and response, and the error codes.
import type { z } from 'zod';
import type { ApiModuleName, ErrorCode } from './errors.ts';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Authorisation levels of architecture §8.1 (`adult` = student with 18_plus). */
export type AuthLevel = 'public' | 'pre' | 'student' | 'adult' | 'owner' | 'member' | 'board' | 'admin' | 'dev';

/** json: JSON body; empty: 204; svg: image/svg+xml; file: JSON download (export). */
export type ResponseKind = 'json' | 'empty' | 'svg' | 'file';

export interface RouteDef {
  readonly module: ApiModuleName;
  readonly method: HttpMethod;
  /** Path below /api/v1 with :param placeholders. */
  readonly path: string;
  readonly auth: readonly AuthLevel[];
  readonly params?: z.ZodType;
  readonly query?: z.ZodType;
  readonly body?: z.ZodType;
  readonly response: z.ZodType;
  readonly responseKind: ResponseKind;
  /** Success status codes; the first is the usual one. */
  readonly status: readonly [number, ...number[]];
  /** Route-specific error codes from §8.2 (implicit middleware codes are not listed). */
  readonly errors: readonly ErrorCode[];
  /** `Idempotency-Key` header (architecture §5.4). */
  readonly idempotencyKey?: 'required';
  /** Paragraph of the architecture or spec that defines the route. */
  readonly spec: string;
}

/** Identity helper that keeps literal types for the typed client. */
export function defineRoutes<const T extends Record<string, RouteDef>>(routes: T): T {
  return routes;
}

type Input<S> = S extends z.ZodType ? z.input<S> : never;
type Output<S> = S extends z.ZodType ? z.output<S> : never;

type Field<K extends string, S> = [S] extends [z.ZodType] ? (undefined extends Input<S> ? { [P in K]?: Input<S> } : {} extends Input<S> ? { [P in K]?: Input<S> } : { [P in K]: Input<S> }) : { [P in K]?: never };

/** Arguments for one call of the typed client. */
export type RouteInput<R extends RouteDef> = Field<'params', R['params']> &
  Field<'query', R['query']> &
  Field<'body', R['body']> &
  (R['idempotencyKey'] extends 'required' ? { idempotencyKey: string } : { idempotencyKey?: never }) & { signal?: unknown };

export type RouteOutput<R extends RouteDef> = Output<R['response']>;
export type RouteBody<R extends RouteDef> = Output<R['body']>;
