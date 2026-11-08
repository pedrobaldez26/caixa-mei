import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

export function signToken(userId: number, secret: string) {
  return jwt.sign({ sub: String(userId) }, secret, { expiresIn: '7d' });
}

export function requireAuth(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    try {
      const payload = jwt.verify(token, secret);
      if (typeof payload === 'string' || !payload.sub) throw new Error('bad payload');
      res.locals.userId = Number(payload.sub);
      next();
    } catch {
      res.status(401).json({ error: 'unauthorized' });
    }
  };
}
