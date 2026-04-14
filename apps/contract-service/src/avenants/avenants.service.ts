import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avenant } from './avenant.entity';
import { CreateAvenantDto, ValiderAvenantDto } from './dto/avenant.dto';

@Injectable()
export class AvenantsService {
  constructor(
    @InjectRepository(Avenant)
    private readonly repo: Repository<Avenant>,
  ) {}

  findByContrat(contratId: string): Promise<Avenant[]> {
    return this.repo.find({
      where: { contratId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Avenant> {
    const avenant = await this.repo.findOne({ where: { id } });
    if (!avenant) throw new NotFoundException(`Avenant ${id} introuvable`);
    return avenant;
  }

  async create(dto: CreateAvenantDto, createdBy = 'system'): Promise<Avenant> {
    const count = await this.repo.count({ where: { contratId: dto.contratId } });
    const numero = `AVN-${dto.contratId.slice(0, 6).toUpperCase()}-${String(count + 1).padStart(3, '0')}`;

    const avenant = this.repo.create({
      numero,
      contratId: dto.contratId,
      type: dto.type,
      description: dto.description,
      dateEffet: new Date(dto.dateEffet),
      primeAvant: dto.primeAvant,
      primeApres: dto.primeApres,
      validationRequise: dto.validationRequise ?? false,
      documentUrl: dto.documentUrl,
      createdBy,
    });

    return this.repo.save(avenant);
  }

  async valider(id: string, dto: ValiderAvenantDto): Promise<Avenant> {
    const avenant = await this.findById(id);
    avenant.validePar = dto.validePar;
    if (dto.validePar2 !== undefined) avenant.validePar2 = dto.validePar2;
    avenant.valideAt = new Date();
    return this.repo.save(avenant);
  }
}
