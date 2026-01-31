import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) { }

    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find();
    }

    async findOne(id: number): Promise<Category> {
        return this.categoryRepository.findOne({ where: { id } });
    }

    async create(categoryData: Partial<Category>): Promise<Category> {
        const category = this.categoryRepository.create(categoryData);
        return this.categoryRepository.save(category);
    }

    async update(id: number, categoryData: Partial<Category>): Promise<Category> {
        await this.categoryRepository.update(id, categoryData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.categoryRepository.delete(id);
    }
}
