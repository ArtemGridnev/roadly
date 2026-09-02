import express, { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

export const ACCESS_COOKIE_NAME = 'access_token';
const ACCESS_COOKIE_OPTIONS: express.CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60,
};

export const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS: express.CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 90,
};

export function setAccessCookie(res: Response, token: string) {
    res.cookie(ACCESS_COOKIE_NAME, token, ACCESS_COOKIE_OPTIONS);
}

export function clearAccessCookie(res: Response) {
    res.clearCookie(ACCESS_COOKIE_NAME, ACCESS_COOKIE_OPTIONS);
}

export function setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

export function clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
}