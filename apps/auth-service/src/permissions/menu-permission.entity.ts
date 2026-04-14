import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('menu_permissions')
export class MenuPermission {
  @PrimaryColumn({ name: 'menu_path' })
  menuPath: string;

  @Column({ name: 'menu_label' })
  menuLabel: string;

  @Column({ name: 'allowed_roles', type: 'text', array: true, default: [] })
  allowedRoles: string[];

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
