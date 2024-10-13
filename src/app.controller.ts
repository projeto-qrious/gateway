import {
  Controller,
  Post,
  Body,
  UseGuards,
  Inject,
  Request,
  Get,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { RolesGuard } from './guards/roles.guard';
import { ConfigService } from '@nestjs/config';
import { Role } from './decorators/roles.decorator';
import { JoinSessionDto } from './dto/join-session.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('')
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('SESSIONS_SERVICE') private readonly sessionsClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  @Post('auth/register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authClient.send({ cmd: 'register' }, createUserDto);
  }

  @Post('auth/login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authClient.send({ cmd: 'login' }, loginUserDto);
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER')
  @Post('sessions')
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @Request() req,
  ) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'create-session' },
      { createSessionDto, userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER', 'ATTENDEE')
  @Post('sessions/join')
  async joinSession(@Body() joinSessionDto: JoinSessionDto, @Request() req) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'join-session' },
      { joinSessionDto, userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER', 'ATTENDEE')
  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string, @Request() req) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'get-session' },
      { sessionId, userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER', 'ATTENDEE')
  @Get('sessions/user/:userId')
  async getUserSessions(@Param('userId') userId: string, @Request() req) {
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    if (req.user.uid !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar estas sessões.',
      );
    }

    return this.sessionsClient.send(
      { cmd: 'get-user-sessions' },
      { userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER')
  @Get('sessions/speaker/createdSessions')
  async getSessionsBySpeaker(@Request() req) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'get-sessions-by-speaker' },
      { userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER')
  @Get('sessions/:sessionId/attendees')
  async getSessionAttendees(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'get-session-attendees' },
      { sessionId, userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER', 'ATTENDEE')
  @Post('sessions/questions')
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req,
  ) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'create-question' },
      { createQuestionDto, userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER', 'ATTENDEE')
  @Get('sessions/:sessionId/questions')
  async getQuestions(@Param('sessionId') sessionId: string, @Request() req) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'get-questions' },
      { userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER', 'ATTENDEE')
  @Get('sessions/:sessionId/questions/:questionId')
  async getQuestionDetails(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
    @Request() req,
  ) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'get-question-details' },
      { sessionId, questionId, userId, token, role },
    );
  }

  @UseGuards(RolesGuard)
  @Role('SPEAKER', 'ATTENDEE')
  @Post('sessions/:sessionId/questions/:questionId/vote')
  async voteQuestion(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
    @Request() req,
  ) {
    const userId = req.user.uid;
    const token = req.headers.authorization.split('Bearer ')[1];
    const role = req.user.role;

    return this.sessionsClient.send(
      { cmd: 'vote-question' },
      { sessionId, questionId, userId, token, role },
    );
  }
}
