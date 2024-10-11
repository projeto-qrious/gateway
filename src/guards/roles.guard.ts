import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RmqContext } from '@nestjs/microservices';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class RolesGuard extends FirebaseAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    firebaseService: FirebaseService,
  ) {
    super(firebaseService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primeiro, verifica se o usuário está autenticado usando o guard de autenticação
    await super.canActivate(context);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há roles especificados na rota, permite o acesso
    if (!requiredRoles) {
      return true;
    }

    let user;

    if (context.getType() === 'rpc') {
      const data = context.switchToRpc().getData();
      user = data.user;
    } else {
      const request = context.switchToHttp().getRequest();
      user = request.user;
    }

    if (!user || !user.role) {
      throw new ForbiddenException(
        'Acesso negado: Usuário não autenticado ou role não encontrada.',
      );
    }

    return true;
  }
}
