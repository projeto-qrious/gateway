import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { RmqContext } from '@nestjs/microservices';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  protected firebaseService: FirebaseService;

  constructor(firebaseService: FirebaseService) {
    this.firebaseService = firebaseService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http') {
      return this.canActivateHttp(context);
    } else if (context.getType() === 'rpc') {
      return this.canActivateRpc(context);
    }
    return false;
  }

  private async canActivateHttp(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido ou inválido');
    }

    const token = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);

      const db = this.firebaseService.getDatabase();
      const userSnapshot = await db
        .ref(`users/${decodedToken.uid}`)
        .once('value');
      const userData = userSnapshot.val();

      if (!userData) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      request.user = {
        ...decodedToken,
        role: userData.role,
        email: userData.email,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Falha na autenticação do token');
    }
  }

  private async canActivateRpc(context: ExecutionContext): Promise<boolean> {
    const rpcContext = context.switchToRpc().getContext<RmqContext>();
    const message = rpcContext.getMessage();

    const content = JSON.parse(message.content.toString());
    const token = content?.data.token;
    if (!token) {
      throw new UnauthorizedException('Token não fornecido ou inválido');
    }

    try {
      const decodedToken = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);

      const db = this.firebaseService.getDatabase();
      const userSnapshot = await db
        .ref(`users/${decodedToken.uid}`)
        .once('value');
      const userData = userSnapshot.val();

      if (!userData) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      context.switchToRpc().getData().user = {
        ...decodedToken,
        role: userData.role,
        email: userData.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Falha na autenticação do token');
    }
  }
}
