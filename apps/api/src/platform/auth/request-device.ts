import type { Request } from 'express';

import type { DeviceInfo } from './session.service.js';

/** Resolve the client through the same bounded ingress policy used by rate limiting. */
export function requestDevice(req: Request): DeviceInfo {
  return {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip ?? req.socket.remoteAddress,
  };
}
