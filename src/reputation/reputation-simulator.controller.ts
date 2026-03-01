import { Controller, Get, Query } from '@nestjs/common';
import { ReputationSimulatorService } from './reputation-simulator.service';

@Controller('reputation-simulator')
export class ReputationSimulatorController {
  constructor(private readonly simulator: ReputationSimulatorService) {}

  @Get('run')
  run(@Query('persona') persona: 'BOMBER' | 'REDEMPTION' | 'INCONSISTENT') {
    return this.simulator.runPersonaSimulation(persona);
  }
}
