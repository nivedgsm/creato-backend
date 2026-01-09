export interface JwtUser {
  userId: string;
  email: string;
  role: 'CREATOR' | 'BRAND' | 'ADMIN';
}
