import { HttpInterceptorFn } from '@angular/common/http';

// Attaches the stored JWT (if any) to every outgoing request so the
// backend's auth middleware can identify the user.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(authReq);
};
