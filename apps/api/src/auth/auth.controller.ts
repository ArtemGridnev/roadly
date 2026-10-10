import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { AgentLoginDto } from './dto/agent-login.dto';
import type { Response } from 'express';
import { clearAccessCookie, clearRefreshCookie, REFRESH_COOKIE_NAME, setAccessCookie, setRefreshCookie } from './utils/authCookie';
import { AgentLoginResponseDto } from './dto/agent-login-response.dto';
import { TokenRefreshResponseDto } from './dto/token-refresh-response.dto';
import { RefreshTokenAuthGuard } from './guards/refresh-token-auth.guard';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { AgentResponseDto } from 'src/agents/dto/agent-response.dto';
import { CurrentAgent } from './decorators/current-agent.decorator';
import { AccessTokenPayload } from './dto/access-token-payload.dto';

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
    @Post('signup')
    async signup(@Res({ passthrough: true }) res: Response, @Body() createAgentDto: CreateAgentDto): Promise<AgentLoginResponseDto> {
        const { accessToken, refreshToken, agent } = await this.authService.signup(createAgentDto);

        setAccessCookie(res, accessToken);
        setRefreshCookie(res, refreshToken);

        return new AgentLoginResponseDto("Signup successfully", agent);
    }

    @Get('me')
    me(@CurrentAgent() agent: AccessTokenPayload): Promise<AgentResponseDto> {
        return this.authService.getCurrentAgent(agent.sub);
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

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Res({ passthrough: true }) res: Response, @Request() req): Promise<void> {
        const refreshToken: string | undefined = req.cookies?.[REFRESH_COOKIE_NAME];

        if (refreshToken) {
            await this.authService.logout(refreshToken);
        }

        clearAccessCookie(res);
        clearRefreshCookie(res);
    }
}
