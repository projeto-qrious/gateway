import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayController } from './app.controller';
import { FirebaseService } from './firebase/firebase.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ||
              'amqp://rabbitmq-3-management-pr9r.onrender.com:5672',
          ],
          queue: 'auth_queue',
          queueOptions: { durable: true },
        },
      },
      {
        name: 'SESSIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ||
              'amqp://rabbitmq-3-management-pr9r.onrender.com:5672',
          ],
          queue: 'sessions_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  providers: [FirebaseService],
  controllers: [GatewayController],
})
export class AppModule {}
