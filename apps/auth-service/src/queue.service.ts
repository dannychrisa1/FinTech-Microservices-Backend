import { Injectable, Inject } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { EmailService } from './email.service';

@Injectable()
export class QueueService {
  private emailQueue: Queue;
  private worker: Worker;

  constructor(
    @Inject('REDIS_CLIENT') private redisClient: Redis,
    private emailService: EmailService,
  ) {
   
    this.emailQueue = new Queue('email-queue', {
      connection: this.redisClient,
       defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });

    this.worker = new Worker(
      'email-queue',
      async (job) => {
        const { email, name, otp, accountNumber, type } = job.data;

        if (type === 'otp') {
          await this.emailService.sendOtpEmail(email, name, otp);
        } else if (type === 'welcome') {
          await this.emailService.sendPasscodeSetupEmail(email, name, accountNumber);
        }else if(type === 'reset-password') {
            await this.emailService.sendResetPasswordEmail(email, name, otp);
        }
      },
      { 
        connection: this.redisClient,
        
       },
    );

    //Log job completion/ failure
    this.worker.on('completed', (job) => {
      console.log(` Email job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(` Email job ${job.id} failed:`, err.message);
    });
  }

  async sendOtpEmail(email: string, name: string, otp: string) {
    await this.emailQueue.add(
      'send-otp',
      {
        email,
        name,
        otp,
        type: 'otp',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  async sendWelcomeEmail(email: string, name: string, accountNumber: string) {
    await this.emailQueue.add(
      'send-welcome',
      {
        email,
        name,
        accountNumber,
        type: 'welcome',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  async sendResetPasswordEmail(email:string, name:string, resetCode:string){
    await this.emailQueue.add(
        'send-reset-password',{
            email,
            name,
            otp:resetCode,
            type:'reset-password',
        },{
            attempts: 3,
            backoff: { type: 'exponential', delay:2000 },
        }
    )
  }
}
