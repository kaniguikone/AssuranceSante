import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prestataire } from './prestataire.entity';
import { CreatePrestataireDto, UpdatePrestataireDto } from './dto/prestataire.dto';

@Injectable()
export class PrestatairesService {
  constructor(
    @InjectRepository(Prestataire)
    private readonly prestataireRepo: Repository<Prestataire>,
  ) {}

  findAll(): Promise<Prestataire[]> {
    return this.prestataireRepo.find({ order: { nom: 'ASC' } });
  }

  async findById(id: string): Promise<Prestataire> {
    const p = await this.prestataireRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`Prestataire ${id} introuvable`);
    return p;
  }

  create(dto: CreatePrestataireDto): Promise<Prestataire> {
    return this.prestataireRepo.save(this.prestataireRepo.create(dto));
  }

  async update(id: string, dto: UpdatePrestataireDto): Promise<Prestataire> {
    await this.findById(id);
    await this.prestataireRepo.update(id, dto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prestataireRepo.delete(id);
  }
}
