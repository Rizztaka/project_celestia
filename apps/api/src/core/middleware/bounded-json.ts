import express, { type RequestHandler } from 'express';

import { AppError } from '@/core/errors/app-error.js';

const tooLarge = () =>
  new AppError('Request body exceeds the supported size.', 413, 'BODY_TOO_LARGE');
const unsupported = () =>
  new AppError(
    'Send uncompressed application/json with UTF-8 encoding.',
    415,
    'UNSUPPORTED_MEDIA_TYPE',
  );

/** Classify only errors delivered by our parser, never arbitrary downstream errors. */
function parserError(error: unknown): Error {
  if (error instanceof Error && 'type' in error) {
    switch (error.type) {
      case 'entity.too.large':
        return tooLarge();
      case 'entity.parse.failed':
        return new AppError('Request body must contain valid JSON.', 400, 'INVALID_JSON');
      case 'encoding.unsupported':
      case 'charset.unsupported':
        return unsupported();
      case 'request.aborted':
      case 'request.size.invalid':
        return new AppError('Request body was incomplete.', 400, 'INVALID_BODY');
    }
  }
  // Even an unexpected parser failure must not carry submitted body/password diagnostics.
  return new Error('Unexpected JSON body reader failure.');
}

export function boundedJson(bytes: number): RequestHandler {
  const parse = express.json({ limit: bytes, inflate: false });
  return (req, res, next) => {
    const hasBody =
      req.headers['transfer-encoding'] !== undefined || Number(req.headers['content-length']) > 0;
    if (hasBody) {
      if (
        (req.headers['content-encoding'] ?? 'identity').toLowerCase() !== 'identity' ||
        !/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i.test(
          req.headers['content-type'] ?? '',
        )
      )
        return next(unsupported());
      // The installed reader rejects excessive Content-Length before buffering,
      // then drains the stream before delivering 413. This avoids an upload/reset
      // race on clients that are still writing when the response is sent.
    }
    parse(req, res, (error?: unknown) => next(error ? parserError(error) : undefined));
  };
}
