import { Global, Module, Logger } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigEnum } from './enum/config.enum';
import { User } from './user/user.entity';
import { Profile } from './user/profile.entity';
import { Roles } from './roles/entities/role.entity';
import { Logs } from './logs/entities/log.entity';
import { LogsModule } from './logs/logs.module';
import { RolesModule } from './roles/roles.module';
const envFilePath = `.env.${process.env.NODE_ENV || `development`}`;

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      load: [() => dotenv.config({ path: '.env' })],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        DB_PORT: Joi.number().default(3306),
        DB_HOST: Joi.string().ip(),
        DB_TYPE: Joi.string().valid('mysql'),
        DB_DATABASE: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_SYNC: Joi.boolean().default(false),
      }),
    }),
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: 'localhost',
    //   port: 3090,
    //   username: 'root',
    //   password: 'example',
    //   database: 'testdb',
    //   entities: [],
    //   synchronize: true,
    // }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          type: configService.get(ConfigEnum.DB_TYPE),
          host: configService.get(ConfigEnum.DB_HOST),
          port: configService.get(ConfigEnum.DB_PORT),
          username: configService.get(ConfigEnum.DB_USERNAME),
          password: configService.get(ConfigEnum.DB_PASSWORD),
          database: configService.get(ConfigEnum.DB_DATABASE),
          entities: [User, Profile, Roles, Logs],
          // 同步本地的schema与数据库 -> 初始化的时候去使用
          synchronize: configService.get(ConfigEnum.DB_SYNC),
        } as TypeOrmModuleOptions),
    }),
    UserModule,
    LogsModule,
    RolesModule,
  ],
  controllers: [],
  providers: [Logger],
  exports: [Logger],
})
export class AppModule {}
