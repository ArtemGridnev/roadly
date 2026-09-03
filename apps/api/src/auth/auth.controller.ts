import { Body, Controller, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { AgentLoginDto } from './dto/agent-login.dto';
import type { Response } from 'express';
import { REFRESH_COOKIE_NAME, setAccessCookie, setRefreshCookie } from './utils/authCookie';
import { AgentLoginResponseDto } from './dto/agent-login-response.dto';
import { TokenRefreshResponseDto } from './dto/token-refresh-response.dto';
import { RefreshTokenAuthGuard } from './guards/refresh-token-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Res({ passthrough: true }) res: Response, @Request() req, @Body() _loginDto: AgentLoginDto): Promise<AgentLoginResponseDto> {
        const { accessToken, refreshToken, agent } = await this.authService.login(req.user);

        setAccessCookie(res, accessToken);
        setRefreshCookie(res, refreshToken);

        return new AgentLoginResponseDto("Login successfully", agent);
    }

    @Public()
    @UseGuards(RefreshTokenAuthGuard)
    @Post('refresh')
    async refresh(@Res({ passthrough: true }) res: Response, @Request() req): Promise<TokenRefreshResponseDto> {
        const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
        const { accessToken, refreshToken: newRefreshToken, agent } = await this.authService.rotateRefreshToken(refreshToken);

        setAccessCookie(res, accessToken);
        setRefreshCookie(res, newRefreshToken);

        return new TokenRefreshResponseDto("Token refresh successfully", agent);
    }
}
