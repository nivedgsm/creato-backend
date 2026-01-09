// import { Request } from 'express';

// export interface AuthRequest extends Request {
//   user: {
//     userId: string;
//     role: string;
//     email?: string;
//   };
// }

// export interface AuthRequest extends Request {
//   user: {
//     userId: string;
//     role: 'CREATOR' | 'BRAND' | 'ADMIN';
//   };
// }


import { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    userId: string;
    role: 'CREATOR' | 'BRAND' | 'ADMIN';
  };
}

