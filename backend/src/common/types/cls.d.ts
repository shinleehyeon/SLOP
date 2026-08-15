declare module 'nestjs-cls' {
  interface ClsStore {
    requestId?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }
}

export {};
