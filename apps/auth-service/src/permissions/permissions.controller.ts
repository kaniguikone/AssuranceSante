import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { PermissionsService } from './permissions.service';

class UpdatePermissionItemDto {
  @ApiProperty() @IsString() menuPath: string;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) allowedRoles: string[];
}

@ApiTags('Permissions')
@Controller('permissions')
@Public()
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer la matrice des permissions de menu' })
  findAll() {
    return this.service.findAll();
  }

  @Put()
  @ApiOperation({ summary: 'Mettre à jour toute la matrice des permissions' })
  updateAll(@Body() updates: UpdatePermissionItemDto[]) {
    return this.service.updateAll(updates);
  }
}
